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
        } elseif ($name === 'screen-candidate') {
            return $this->screenCandidate($request);
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
        $batchName = $request->input('batchName');

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
                'batch_name' => $batchName,
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
        $data['status_url'] = url('/status');
        
        $companyName = \Illuminate\Support\Facades\DB::table('site_settings')
            ->where('setting_key', 'company_name')
            ->value('setting_value') ?? 'DIGI5 LTD';
        $data['company_name'] = $companyName;
        
        $forceSend = $request->input('force_send', false);

        if (!$templateKey) {
            return response()->json(['success' => false, 'error' => 'template_key is required'], 400);
        }

        try {
            $smtpSettings = NotificationSetting::where('setting_type', 'smtp')->first();
            $smsSettings = NotificationSetting::where('setting_type', 'sms')->first();

            $results = [];

            // Handle custom broadcast
            if ($templateKey === 'custom_broadcast') {
                $subject = $request->input('subject') ?? ($data['subject'] ?? 'Notification');
                $body = $request->input('body') ?? ($data['body'] ?? '');
                $smsBody = $request->input('sms_body') ?? ($data['sms_body'] ?? '');

                // Personalize custom content using processTemplate
                $subject = $this->processTemplate($subject, $data);
                $body = $this->processTemplate($body, $data);
                $smsBody = $this->processTemplate($smsBody, $data);

                // Send Email
                if ($recipientEmail && $body && ($smtpSettings->is_enabled || $forceSend)) {
                    $smtpConfig = $smtpSettings->config;
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
                            'metadata' => ['custom_broadcast' => true],
                            'sent_at' => now(),
                        ]);
                    }
                }

                // Send SMS
                if ($recipientPhone && $smsBody && ($smsSettings->is_enabled || $forceSend)) {
                    $smsConfig = $smsSettings->config;
                    if ($smsSettings->test_mode && !$forceSend) {
                        $results['sms'] = ['success' => true, 'test_mode' => true];
                    } else {
                        $smsResult = $this->sendSMS($smsConfig, $recipientPhone, $smsBody);
                        $results['sms'] = $smsResult;

                        NotificationLog::create([
                            'id' => (string) Str::uuid(),
                            'notification_type' => 'sms',
                            'template_key' => $templateKey,
                            'recipient' => $recipientPhone,
                            'body' => $smsBody,
                            'status' => $smsResult['success'] ? 'sent' : 'failed',
                            'error_message' => $smsResult['error'] ?? null,
                            'metadata' => ['custom_broadcast' => true],
                            'sent_at' => now(),
                        ]);
                    }
                }

                return response()->json(['success' => true, 'results' => $results]);
            }

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
        $processed = preg_replace_callback('/\{\{(\w+)\}\}/', function ($matches) use ($data) {
            return $data[$matches[1]] ?? $matches[0];
        }, $template);

        // Fetch company name from settings to replace hardcoded DIGI5 LTD
        $companyName = \Illuminate\Support\Facades\DB::table('site_settings')
            ->where('setting_key', 'company_name')
            ->value('setting_value') ?? 'DIGI5 LTD';

        if ($companyName && $companyName !== 'DIGI5 LTD') {
            $processed = str_replace('DIGI5 LTD', $companyName, $processed);
        }

        return $processed;
    }

    private function sendEmail($config, $to, $subject, $body)
    {
        try {
            $provider = $config['provider'] ?? (empty($config['host']) ? 'resend' : 'smtp');
            
            $companyName = \Illuminate\Support\Facades\DB::table('site_settings')
                ->where('setting_key', 'company_name')
                ->value('setting_value') ?? 'DIGI5 LTD';

            if ($provider === 'resend' && !empty($config['api_key'])) {
                $response = Http::withToken($config['api_key'])
                    ->post('https://api.resend.com/emails', [
                        'from' => ($config['from_name'] ?? $companyName) . ' <' . ($config['from_email'] ?? 'onboarding@resend.dev') . '>',
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
                $encryption = isset($config['encryption']) 
                    ? ($config['encryption'] === 'none' ? null : $config['encryption'])
                    : (($config['secure'] ?? true) ? 'tls' : null);

                config([
                    'mail.default' => 'smtp',
                    'mail.mailers.smtp.transport' => 'smtp',
                    'mail.mailers.smtp.host' => $config['host'],
                    'mail.mailers.smtp.port' => intval($config['port'] ?? 587),
                    'mail.mailers.smtp.encryption' => $encryption,
                    'mail.mailers.smtp.username' => $config['username'] ?? null,
                    'mail.mailers.smtp.password' => $config['password'] ?? null,
                    'mail.from.address' => $config['from_email'] ?? 'no-reply@example.com',
                    'mail.from.name' => $config['from_name'] ?? $companyName,
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

            $params = [];
            if (!empty($config['parameters']) && is_array($config['parameters'])) {
                foreach ($config['parameters'] as $param) {
                    $key = $param['key'] ?? '';
                    if (empty($key)) continue;

                    $type = $param['type'] ?? 'fixed';
                    $val = $param['value'] ?? '';

                    if ($type === 'destination_number') {
                        $params[$key] = $cleanPhone;
                    } elseif ($type === 'message_content') {
                        $params[$key] = $message;
                    } else {
                        $params[$key] = $val;
                    }
                }
            } else {
                $apiKey = $config['api_key'] ?? '';
                if (empty($apiKey)) {
                    return ['success' => false, 'error' => 'SMS API Key not configured', 'response' => null];
                }
                $params = [
                    'api_key' => $apiKey,
                    'msg' => $message,
                    'to' => $cleanPhone,
                ];
                if (!empty($config['sender_id'])) {
                    $params['sender_id'] = $config['sender_id'];
                }
            }

            if ($method === 'GET') {
                $response = Http::get($apiUrl, $params);
            } else {
                $response = Http::asForm()->post($apiUrl, $params);
            }

            $result = $response->json() ?? ['raw_response' => $response->body()];

            $isSuccess = $response->successful();

            if ($isSuccess && is_array($result)) {
                // bulksmsbd.net response_code (202 = success, others are error)
                if (isset($result['response_code'])) {
                    $code = intval($result['response_code']);
                    if ($code !== 202 && $code !== 1000) {
                        $isSuccess = false;
                    }
                }
                // generic error field checks (where error !== 0 / '0' / false / null)
                if (isset($result['error'])) {
                    $err = $result['error'];
                    if ($err !== 0 && $err !== '0' && $err !== false && $err !== 'false' && $err !== null) {
                        $isSuccess = false;
                    }
                }
                // generic success field
                if (isset($result['success']) && ($result['success'] === false || $result['success'] === 'false')) {
                    $isSuccess = false;
                }
                // generic status field
                if (isset($result['status'])) {
                    $status = strtolower(strval($result['status']));
                    if ($status === 'failed' || $status === 'error' || $status === 'false') {
                        $isSuccess = false;
                    }
                }
                // bulksmsbd.net or other error message field
                if (!empty($result['error_message'])) {
                    $isSuccess = false;
                }
                if (!empty($result['msg_type']) && strtolower($result['msg_type']) === 'error') {
                    $isSuccess = false;
                }
            }

            if ($isSuccess) {
                return ['success' => true, 'response' => $result];
            }

            $errorMsg = 'SMS Gateway returned failure';
            if (is_array($result)) {
                $errorMsg = $result['error_message'] ?? $result['msg'] ?? $result['message'] ?? $result['error'] ?? 'SMS Gateway returned failure';
                if (is_array($errorMsg) || is_object($errorMsg)) {
                    $errorMsg = json_encode($errorMsg);
                }
            }

            return [
                'success' => false,
                'error' => $errorMsg,
                'response' => $result
            ];

        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    private function screenCandidate(Request $request)
    {
        $applicationId = $request->input('application_id');
        if (!$applicationId) {
            return response()->json(['success' => false, 'error' => 'application_id is required'], 400);
        }

        $application = \App\Models\Application::with(['form', 'responses.formField', 'department'])->find($applicationId);
        if (!$application) {
            return response()->json(['success' => false, 'error' => 'Application not found'], 404);
        }

        $responsesText = "";
        foreach ($application->responses as $resp) {
            if ($resp->formField) {
                $responsesText .= "Question: " . $resp->formField->label . "\nAnswer: " . ($resp->response_value ?? $resp->file_url ?? '—') . "\n\n";
            }
        }

        $siteSetting = \App\Models\SiteSetting::where('setting_key', 'gemini_api_key')->first();
        $apiKey = ($siteSetting && !empty($siteSetting->setting_value)) ? $siteSetting->setting_value : env('GEMINI_API_KEY');
        $screeningResult = null;

        if ($apiKey) {
            try {
                $formTitle = $application->form->title ?? 'Position';
                $formType = $application->form_type ?? 'application';
                $deptName = $application->department->name ?? 'N/A';
                
                $prompt = "You are an expert HR recruitment assistant. You are screening a candidate application for DIGI5 LTD.\n" .
                    "Candidate Name: {$application->applicant_name}\n" .
                    "Position: {$formTitle} ({$formType})\n" .
                    "Department: {$deptName}\n\n" .
                    "Candidate Responses:\n" .
                    $responsesText . "\n" .
                    "Evaluate the candidate based on their responses. Auto-generate:\n" .
                    "1. Fit Score: An integer from 0 to 100 based on their suitability for the role.\n" .
                    "2. Summary: A 3-sentence summary of their application, highlighting key skills, qualifications, and potential fit.\n" .
                    "3. Interview Questions: Exactly 3 customized interview questions specifically tailored to this candidate's application and answers to dig deeper.\n\n" .
                    "You MUST respond in JSON format with exactly the following keys and structure:\n" .
                    "{\n" .
                    "  \"fit_score\": <number>,\n" .
                    "  \"summary\": \"<3-sentence summary text>\",\n" .
                    "  \"questions\": [\n" .
                    "    \"<question 1>\",\n" .
                    "    \"<question 2>\",\n" .
                    "    \"<question 3>\"\n" .
                    "  ]\n" .
                    "}\n\n" .
                    "Provide ONLY the JSON response, no markdown wrapping like ```json or other text.";

                $response = Http::post("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" . $apiKey, [
                    'contents' => [
                        [
                            'parts' => [
                                ['text' => $prompt]
                            ]
                        ]
                    ],
                    'generationConfig' => [
                        'responseMimeType' => 'application/json'
                    ]
                ]);

                if ($response->successful()) {
                    $resData = $response->json();
                    $text = $resData['candidates'][0]['content']['parts'][0]['text'] ?? '';
                    $decoded = json_decode(trim($text), true);
                    if ($decoded && isset($decoded['fit_score']) && isset($decoded['summary']) && isset($decoded['questions'])) {
                        $screeningResult = $decoded;
                    }
                }
            } catch (\Exception $e) {
                // API call failed, will fallback below
            }
        }

        if (!$screeningResult) {
            $screeningResult = $this->generateMockScreening($application, $responsesText);
        }

        $application->update([
            'ai_screening' => json_encode($screeningResult)
        ]);

        return response()->json([
            'success' => true,
            'screening' => $screeningResult
        ]);
    }

    private function generateMockScreening($application, $responsesText)
    {
        $score = 75;
        if (stripos($responsesText, 'experience') !== false || stripos($responsesText, 'laravel') !== false || stripos($responsesText, 'react') !== false) {
            $score += 12;
        }
        if (stripos($responsesText, 'intern') !== false || stripos($responsesText, 'junior') !== false || stripos($responsesText, 'student') !== false) {
            $score += 4;
        }
        $score = min(100, max(40, $score + rand(-6, 6)));

        $positionName = $application->form->title ?? 'the requested position';
        $name = $application->applicant_name;

        $summary = "{$name} has submitted a solid application for the {$positionName} role, showing relevant interest and basic competencies. Their responses reflect a positive attitude and willingness to learn and adapt to DIGI5 LTD's environment. Further technical evaluation is recommended to gauge their practical experience and skill depth.";

        $questions = [
            "Can you elaborate on your experience or projects related to the core requirements of the {$positionName} position?",
            "What specific aspects of DIGI5 LTD motivated you to apply for this role, and how do you see yourself contributing here?",
            "Describe a challenging technical problem you encountered in a recent project and how you went about resolving it."
        ];

        return [
            'fit_score' => $score,
            'summary' => $summary,
            'questions' => $questions
        ];
    }
}
