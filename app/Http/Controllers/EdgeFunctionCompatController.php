<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Profile;
use App\Models\UserRole;
use App\Models\Intern;
use App\Models\StaffAssignment;
use App\Models\NotificationSetting;
use App\Models\NotificationTemplate;
use App\Models\NotificationLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class EdgeFunctionCompatController extends Controller
{
    public function invoke(Request $request, $name)
    {
        if ($name === 'create-staff-user') {
            return $this->createStaffUser($request);
        } elseif ($name === 'create-intern-user') {
            return $this->createInternUser($request);
        } elseif ($name === 'send-notification') {
            return $this->sendNotification($request);
        }

        return response()->json([
            'success' => false,
            'error' => "Edge function [{$name}] not supported."
        ], 404);
    }

    private function createStaffUser(Request $request)
    {
        $email = $request->input('email');
        $fullName = $request->input('fullName');
        $departmentIds = $request->input('departmentIds', []);

        if (!$email || !$fullName || empty($departmentIds)) {
            return response()->json([
                'success' => false,
                'error' => 'Email, full name, and at least one department are required'
            ], 400);
        }

        if (User::where('email', $email)->exists()) {
            return response()->json([
                'success' => false,
                'error' => 'This email address is already registered.'
            ], 400);
        }

        try {
            $tempPassword = 'TempPass' . Str::random(8) . '!';

            $user = User::create([
                'id' => (string) Str::uuid(),
                'name' => $fullName,
                'email' => $email,
                'password' => Hash::make($tempPassword),
            ]);

            Profile::create([
                'id' => (string) Str::uuid(),
                'user_id' => $user->id,
                'email' => $email,
                'full_name' => $fullName,
            ]);

            UserRole::create([
                'id' => (string) Str::uuid(),
                'user_id' => $user->id,
                'role' => 'staff',
                'created_at' => now(),
            ]);

            foreach ($departmentIds as $deptId) {
                StaffAssignment::create([
                    'id' => (string) Str::uuid(),
                    'user_id' => $user->id,
                    'department_id' => $deptId,
                    'created_at' => now(),
                ]);
            }

            return response()->json([
                'success' => true,
                'user' => ['id' => $user->id, 'email' => $user->email],
                'tempPassword' => $tempPassword,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function createInternUser(Request $request)
    {
        $email = $request->input('email');
        $fullName = $request->input('fullName');
        $roleTitle = $request->input('roleTitle');
        $departmentId = $request->input('departmentId');
        $supervisorName = $request->input('supervisorName');
        $startDate = $request->input('startDate');
        $endDate = $request->input('endDate');
        $status = $request->input('status', 'pending');
        $description = $request->input('description');
        $phone = $request->input('phone');

        try {
            $existingProfile = Profile::where('email', $email)->first();
            $userId = null;
            $tempPassword = null;

            if ($existingProfile) {
                $userId = $existingProfile->user_id;
            } else {
                if (User::where('email', $email)->exists()) {
                    return response()->json([
                        'success' => false,
                        'error' => 'This email address is already registered.'
                    ], 400);
                }

                $tempPassword = 'TempPass' . Str::random(8) . '!';
                $user = User::create([
                    'id' => (string) Str::uuid(),
                    'name' => $fullName,
                    'email' => $email,
                    'password' => Hash::make($tempPassword),
                ]);

                Profile::create([
                    'id' => (string) Str::uuid(),
                    'user_id' => $user->id,
                    'email' => $email,
                    'full_name' => $fullName,
                ]);

                $userId = $user->id;
            }

            // Assign role if not present
            $hasRole = UserRole::where('user_id', $userId)->where('role', 'intern')->exists();
            if (!$hasRole) {
                UserRole::create([
                    'id' => (string) Str::uuid(),
                    'user_id' => $userId,
                    'role' => 'intern',
                    'created_at' => now(),
                ]);
            }

            // Create Intern record
            $intern = Intern::create([
                'id' => (string) Str::uuid(),
                'user_id' => $userId,
                'department_id' => $departmentId,
                'role_title' => $roleTitle,
                'description' => $description,
                'phone' => $phone,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'status' => $status,
                'supervisor_name' => $supervisorName,
            ]);

            return response()->json([
                'success' => true,
                'user' => ['id' => $userId, 'email' => $email],
                'intern' => $intern,
                'tempPassword' => $tempPassword,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function sendNotification(Request $request)
    {
        $templateKey = $request->input('template_key');
        $recipientEmail = $request->input('recipient_email');
        $recipientPhone = $request->input('recipient_phone');
        $data = $request->input('data', []);
        $forceSend = $request->input('force_send', false);

        if (!$templateKey) {
            return response()->json(['success' => false, 'error' => 'template_key is required'], 400);
        }

        try {
            $smtpSettings = NotificationSetting::where('setting_type', 'smtp')->first();
            $smsSettings = NotificationSetting::where('setting_type', 'sms')->first();

            $results = [];

            // Handle test SMS
            if ($templateKey === 'test_sms' && $recipientPhone) {
                $smsConfig = $smsSettings ? $smsSettings->config : [];
                $testMessage = $data['test_message'] ?? 'Test SMS from DIGI5 LTD';
                $smsResult = $this->sendSMS($smsConfig, $recipientPhone, $testMessage);
                $results['sms'] = $smsResult;

                NotificationLog::create([
                    'id' => (string) Str::uuid(),
                    'notification_type' => 'sms',
                    'template_key' => 'test_sms',
                    'recipient' => $recipientPhone,
                    'body' => $testMessage,
                    'status' => $smsResult['success'] ? 'sent' : 'failed',
                    'error_message' => $smsResult['error'] ?? null,
                    'metadata' => ['test' => true, 'api_response' => $smsResult['response'] ?? null],
                    'sent_at' => now(),
                ]);

                return response()->json(['success' => $smsResult['success'], 'results' => $results]);
            }

            // Handle test Email
            if ($templateKey === 'test_email' && $recipientEmail) {
                $smtpConfig = $smtpSettings ? $smtpSettings->config : [];
                $testSubject = $data['test_subject'] ?? 'Test Email from DIGI5 LTD';
                $testBody = $data['test_message'] ?? 'This is a test email to verify your SMTP configuration.';
                $emailResult = $this->sendEmail($smtpConfig, $recipientEmail, $testSubject, $testBody);
                $results['email'] = $emailResult;

                NotificationLog::create([
                    'id' => (string) Str::uuid(),
                    'notification_type' => 'email',
                    'template_key' => 'test_email',
                    'recipient' => $recipientEmail,
                    'subject' => $testSubject,
                    'body' => $testBody,
                    'status' => $emailResult['success'] ? 'sent' : 'failed',
                    'error_message' => $emailResult['error'] ?? null,
                    'metadata' => ['test' => true, 'api_response' => $emailResult['response'] ?? null],
                    'sent_at' => now(),
                ]);

                return response()->json(['success' => $emailResult['success'], 'results' => $results]);
            }

            // Fetch templates
            $templates = NotificationTemplate::where('template_key', $templateKey)->where('is_enabled', true)->get();
            $emailTemplate = $templates->where('template_type', 'email')->first();
            $smsTemplate = $templates->where('template_type', 'sms')->first();

            // Send Email
            if ($recipientEmail && $emailTemplate && ($smtpSettings->is_enabled || $forceSend)) {
                $smtpConfig = $smtpSettings->config;
                $subject = $this->processTemplate($emailTemplate->subject ?? '', $data);
                $body = $this->processTemplate($emailTemplate->body_template, $data);

                if ($smtpSettings->test_mode && !$forceSend) {
                    $results['email'] = ['success' => true, 'test_mode' => true];
                } else {
                    $emailResult = $this->sendEmail($smtpConfig, $recipientEmail, $subject, $body);
                    $results['email'] = $emailResult;

                    NotificationLog::create([
                        'id' => (string) Str::uuid(),
                        'notification_type' => 'email',
                        'template_key' => $templateKey,
                        'recipient' => $recipientEmail,
                        'subject' => $subject,
                        'body' => $body,
                        'status' => $emailResult['success'] ? 'sent' : 'failed',
                        'error_message' => $emailResult['error'] ?? null,
                        'metadata' => ['template_id' => $emailTemplate->id],
                        'sent_at' => now(),
                    ]);
                }
            }

            // Send SMS
            if ($recipientPhone && $smsTemplate && ($smsSettings->is_enabled || $forceSend)) {
                $smsConfig = $smsSettings->config;
                $message = $this->processTemplate($smsTemplate->body_template, $data);

                if ($smsSettings->test_mode && !$forceSend) {
                    $results['sms'] = ['success' => true, 'test_mode' => true];
                } else {
                    $smsResult = $this->sendSMS($smsConfig, $recipientPhone, $message);
                    $results['sms'] = $smsResult;

                    NotificationLog::create([
                        'id' => (string) Str::uuid(),
                        'notification_type' => 'sms',
                        'template_key' => $templateKey,
                        'recipient' => $recipientPhone,
                        'body' => $message,
                        'status' => $smsResult['success'] ? 'sent' : 'failed',
                        'error_message' => $smsResult['error'] ?? null,
                        'metadata' => ['template_id' => $smsTemplate->id, 'api_response' => $smsResult['response'] ?? null],
                        'sent_at' => now(),
                    ]);
                }
            }

            return response()->json(['success' => true, 'results' => $results]);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    private function processTemplate($template, $data)
    {
        return preg_replace_callback('/\{\{(\w+)\}\}/', function ($matches) use ($data) {
            return $data[$matches[1]] ?? $matches[0];
        }, $template);
    }

    private function sendEmail($config, $to, $subject, $body)
    {
        try {
            $provider = $config['provider'] ?? (empty($config['host']) ? 'resend' : 'smtp');

            if ($provider === 'resend' && !empty($config['api_key'])) {
                $response = Http::withToken($config['api_key'])
                    ->post('https://api.resend.com/emails', [
                        'from' => ($config['from_name'] ?? 'DIGI5') . ' <' . ($config['from_email'] ?? 'onboarding@resend.dev') . '>',
                        'to' => [$to],
                        'subject' => $subject,
                        'html' => nl2br($body),
                    ]);

                if ($response->successful()) {
                    return ['success' => true, 'response' => $response->json()];
                } else {
                    return ['success' => false, 'error' => $response->json()['message'] ?? 'Resend API call failed', 'response' => $response->json()];
                }
            }

            // Set SMTP configuration dynamically if host/username are provided in config
            if (!empty($config['host'])) {
                config([
                    'mail.mailers.smtp.transport' => 'smtp',
                    'mail.mailers.smtp.host' => $config['host'],
                    'mail.mailers.smtp.port' => intval($config['port'] ?? 587),
                    'mail.mailers.smtp.encryption' => ($config['secure'] ?? true) ? 'tls' : null,
                    'mail.mailers.smtp.username' => $config['username'] ?? null,
                    'mail.mailers.smtp.password' => $config['password'] ?? null,
                    'mail.from.address' => $config['from_email'] ?? 'no-reply@example.com',
                    'mail.from.name' => $config['from_name'] ?? 'DIGI5',
                ]);
                Mail::purge();
            }

            // Fallback: Laravel standard Mail
            Mail::html(nl2br($body), function ($message) use ($to, $subject, $config) {
                $message->to($to)
                    ->subject($subject);
                if (!empty($config['from_email'])) {
                    $message->from($config['from_email'], $config['from_name'] ?? null);
                }
            });

            return ['success' => true, 'response' => 'Sent via Laravel Mail'];
        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    private function sendSMS($config, $to, $message)
    {
        try {
            $cleanPhone = preg_replace('/[\s\-\(\)]/', '', $to);

            if (str_starts_with($cleanPhone, '0')) {
                $cleanPhone = '88' . $cleanPhone;
            }
            if (!str_starts_with($cleanPhone, '88') && strlen($cleanPhone) === 11) {
                $cleanPhone = '88' . $cleanPhone;
            }

            $apiUrl = $config['api_url'] ?? 'https://api.sms.net.bd/sendsms';
            $method = strtoupper($config['method'] ?? 'POST');
            $apiKey = $config['api_key'] ?? '';

            if (empty($apiKey)) {
                return ['success' => false, 'error' => 'SMS API Key not configured', 'response' => null];
            }

            if ($method === 'GET') {
                $params = [
                    'api_key' => $apiKey,
                    'msg' => $message,
                    'to' => $cleanPhone,
                ];
                if (!empty($config['sender_id'])) {
                    $params['sender_id'] = $config['sender_id'];
                }

                $response = Http::get($apiUrl, $params);
            } else {
                $params = [
                    'api_key' => $apiKey,
                    'msg' => $message,
                    'to' => $cleanPhone,
                ];
                if (!empty($config['sender_id'])) {
                    $params['sender_id'] = $config['sender_id'];
                }

                $response = Http::asForm()->post($apiUrl, $params);
            }

            $result = $response->json() ?? ['raw_response' => $response->body()];

            $isSuccess = isset($result['error']) && ($result['error'] === 0 || $result['error'] === '0')
                || (isset($result['status']) && strtolower($result['status']) === 'success')
                || (isset($result['code']) && ($result['code'] === 200 || $result['code'] === '200'))
                || $response->successful();

            if ($isSuccess) {
                return ['success' => true, 'response' => $result];
            }

            return [
                'success' => false,
                'error' => $result['msg'] ?? $result['message'] ?? 'SMS Gateway returned failure',
                'response' => $result
            ];

        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
}
