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

    public function trackOpen($id)
    {
        $log = NotificationLog::find($id);
        if ($log) {
            $log->update([
                'opened' => true,
                'opened_at' => now(),
            ]);
        }
        
        $gif = base64_decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
        return response($gif)->header('Content-Type', 'image/gif');
    }

    public function trackClick(Request $request, $id)
    {
        $url = $request->query('url');
        $log = NotificationLog::find($id);
        if ($log) {
            $log->update([
                'clicked' => true,
                'clicked_at' => now(),
            ]);
        }
        
        if ($url) {
            return redirect()->away($url);
        }
        return redirect()->to('/');
    }

    public function webview($id)
    {
        $log = NotificationLog::find($id);
        if ($log && $log->notification_type === 'email') {
            return response($log->body)->header('Content-Type', 'text/html');
        }
        return response('Email not found or is not an email.', 404);
    }

    public function processScheduled()
    {
        $now = now();
        $logs = NotificationLog::where('status', 'scheduled')
            ->where('scheduled_at', '<=', $now)
            ->get();

        $smtpSettings = NotificationSetting::where('setting_type', 'smtp')->first();
        $smsSettings = NotificationSetting::where('setting_type', 'sms')->first();

        foreach ($logs as $log) {
            try {
                if ($log->notification_type === 'email') {
                    if (!$smtpSettings || (!$smtpSettings->is_enabled && !$smtpSettings->test_mode)) {
                        $log->update([
                            'status' => 'failed',
                            'error_message' => 'SMTP settings not enabled or configured.',
                        ]);
                        continue;
                    }

                    $smtpConfig = $smtpSettings->config;
                    if ($smtpSettings->test_mode) {
                        $log->update([
                            'status' => 'sent',
                            'metadata' => array_merge($log->metadata ?? [], ['test_mode' => true]),
                            'sent_at' => now(),
                        ]);
                    } else {
                        $emailResult = $this->sendEmail($smtpConfig, $log->recipient, $log->subject, $log->body, $log->id, $log->campaign_name, true);
                        
                        $log->update([
                            'status' => $emailResult['success'] ? 'sent' : 'failed',
                            'error_message' => $emailResult['error'] ?? null,
                            'sent_at' => now(),
                        ]);
                    }
                } elseif ($log->notification_type === 'sms') {
                    if (!$smsSettings || (!$smsSettings->is_enabled && !$smsSettings->test_mode)) {
                        $log->update([
                            'status' => 'failed',
                            'error_message' => 'SMS settings not enabled or configured.',
                        ]);
                        continue;
                    }

                    $smsConfig = $smsSettings->config;
                    if ($smsSettings->test_mode) {
                        $log->update([
                            'status' => 'sent',
                            'metadata' => array_merge($log->metadata ?? [], ['test_mode' => true]),
                            'sent_at' => now(),
                        ]);
                    } else {
                        $smsResult = $this->sendSMS($smsConfig, $log->recipient, $log->body);
                        
                        $log->update([
                            'status' => $smsResult['success'] ? 'sent' : 'failed',
                            'error_message' => $smsResult['error'] ?? null,
                            'sent_at' => now(),
                        ]);
                    }
                }
            } catch (\Exception $e) {
                $log->update([
                    'status' => 'failed',
                    'error_message' => $e->getMessage(),
                ]);
            }
        }
        
        return count($logs);
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
        $campaignName = $request->input('campaign_name');
        $scheduledAt = $request->input('scheduled_at');
        $recipientName = $data['name'] ?? ($data['applicant_name'] ?? ($data['intern_name'] ?? null));
        
        if (empty($recipientName)) {
            if ($recipientEmail) {
                $recipientName = \App\Models\Profile::where('email', $recipientEmail)->value('full_name');
                if (empty($recipientName)) {
                    $recipientName = \Illuminate\Support\Facades\DB::table('applications')
                        ->where('applicant_email', $recipientEmail)
                        ->value('applicant_name');
                }
            }
            if (empty($recipientName) && $recipientPhone) {
                $recipientName = \Illuminate\Support\Facades\DB::table('applications')
                    ->where('applicant_phone', $recipientPhone)
                    ->value('applicant_name');
                if (empty($recipientName)) {
                    $internProfileId = \Illuminate\Support\Facades\DB::table('interns')
                        ->where('phone', $recipientPhone)
                        ->value('user_id');
                    if ($internProfileId) {
                        $recipientName = \App\Models\Profile::where('user_id', $internProfileId)->value('full_name');
                    }
                }
            }
        }

        if (!$templateKey) {
            return response()->json(['success' => false, 'error' => 'template_key is required'], 400);
        }

        try {
            $smtpSettings = NotificationSetting::where('setting_type', 'smtp')->first();
            $smsSettings = NotificationSetting::where('setting_type', 'sms')->first();

            $results = [];

            if ($scheduledAt) {
                if ($templateKey === 'custom_broadcast') {
                    $subject = $request->input('subject') ?? ($data['subject'] ?? 'Notification');
                    $body = $request->input('body') ?? ($data['body'] ?? '');
                    $smsBody = $request->input('sms_body') ?? ($data['sms_body'] ?? '');

                    $subject = $this->processTemplate($subject, $data);
                    $body = $this->processTemplate($body, $data);
                    $smsBody = $this->processTemplate($smsBody, $data);

                    if ($recipientEmail && $body && ($smtpSettings->is_enabled || $forceSend)) {
                        $logId = (string) Str::uuid();
                        $htmlBody = $this->buildEmailBody($body, $recipientEmail, $subject, $smtpSettings->config['unsubscribe_enabled'] ?? false, $smtpSettings->config['unsubscribe_url'] ?? '', $logId);
                        
                        $htmlBody = preg_replace_callback('/<a\s+([^>]*?)href=["\'](https?:\/\/[^"\']+)["\']([^>]*?)>/i', function ($matches) use ($logId) {
                            $attrsBefore = $matches[1];
                            $originalUrl = $matches[2];
                            $attrsAfter = $matches[3];
                            
                            if (str_contains($originalUrl, 'unsubscribe')) {
                                return $matches[0];
                            }
                            
                            $trackedUrl = url("api/mail-track/click/{$logId}") . '?url=' . urlencode($originalUrl);
                            return '<a ' . $attrsBefore . 'href="' . $trackedUrl . '"' . $attrsAfter . '>';
                        }, $htmlBody);

                        $trackingPixel = '<img src="' . url("api/mail-track/open/{$logId}") . '" width="1" height="1" alt="" style="display:none;" />';
                        if (str_contains($htmlBody, '</body>')) {
                            $htmlBody = str_replace('</body>', $trackingPixel . '</body>', $htmlBody);
                        } else {
                            $htmlBody .= $trackingPixel;
                        }

                        NotificationLog::create([
                            'id' => $logId,
                            'notification_type' => 'email',
                            'template_key' => $templateKey,
                            'recipient' => $recipientEmail,
                            'subject' => $subject,
                            'body' => $htmlBody,
                            'status' => 'scheduled',
                            'campaign_name' => $campaignName,
                            'metadata' => ['custom_broadcast' => true, 'recipient_name' => $recipientName],
                            'scheduled_at' => $scheduledAt,
                        ]);
                        $results['email'] = ['success' => true, 'scheduled' => true];
                    }

                    if ($recipientPhone && $smsBody && ($smsSettings->is_enabled || $forceSend)) {
                        NotificationLog::create([
                            'id' => (string) Str::uuid(),
                            'notification_type' => 'sms',
                            'template_key' => $templateKey,
                            'recipient' => $recipientPhone,
                            'body' => $smsBody,
                            'status' => 'scheduled',
                            'campaign_name' => $campaignName,
                            'metadata' => ['custom_broadcast' => true, 'recipient_name' => $recipientName],
                            'scheduled_at' => $scheduledAt,
                        ]);
                        $results['sms'] = ['success' => true, 'scheduled' => true];
                    }
                } else {
                    $templates = NotificationTemplate::where('template_key', $templateKey)->where('is_enabled', true)->get();
                    $emailTemplate = $templates->where('template_type', 'email')->first();
                    $smsTemplate = $templates->where('template_type', 'sms')->first();

                    if ($recipientEmail && $emailTemplate && ($smtpSettings->is_enabled || $forceSend)) {
                        $subject = $this->processTemplate($emailTemplate->subject ?? '', $data);
                        $body = $this->processTemplate($emailTemplate->body_template, $data);
                        $logId = (string) Str::uuid();
                        
                        $htmlBody = $this->buildEmailBody($body, $recipientEmail, $subject, $smtpSettings->config['unsubscribe_enabled'] ?? false, $smtpSettings->config['unsubscribe_url'] ?? '', $logId);
                        
                        $htmlBody = preg_replace_callback('/<a\s+([^>]*?)href=["\'](https?:\/\/[^"\']+)["\']([^>]*?)>/i', function ($matches) use ($logId) {
                            $attrsBefore = $matches[1];
                            $originalUrl = $matches[2];
                            $attrsAfter = $matches[3];
                            
                            if (str_contains($originalUrl, 'unsubscribe')) {
                                return $matches[0];
                            }
                            
                            $trackedUrl = url("api/mail-track/click/{$logId}") . '?url=' . urlencode($originalUrl);
                            return '<a ' . $attrsBefore . 'href="' . $trackedUrl . '"' . $attrsAfter . '>';
                        }, $htmlBody);

                        $trackingPixel = '<img src="' . url("api/mail-track/open/{$logId}") . '" width="1" height="1" alt="" style="display:none;" />';
                        if (str_contains($htmlBody, '</body>')) {
                            $htmlBody = str_replace('</body>', $trackingPixel . '</body>', $htmlBody);
                        } else {
                            $htmlBody .= $trackingPixel;
                        }

                        NotificationLog::create([
                            'id' => $logId,
                            'notification_type' => 'email',
                            'template_key' => $templateKey,
                            'recipient' => $recipientEmail,
                            'subject' => $subject,
                            'body' => $htmlBody,
                            'status' => 'scheduled',
                            'campaign_name' => $campaignName,
                            'metadata' => ['template_id' => $emailTemplate->id, 'recipient_name' => $recipientName],
                            'scheduled_at' => $scheduledAt,
                        ]);
                        $results['email'] = ['success' => true, 'scheduled' => true];
                    }

                    if ($recipientPhone && $smsTemplate && ($smsSettings->is_enabled || $forceSend)) {
                        $message = $this->processTemplate($smsTemplate->body_template, $data);
                        
                        NotificationLog::create([
                            'id' => (string) Str::uuid(),
                            'notification_type' => 'sms',
                            'template_key' => $templateKey,
                            'recipient' => $recipientPhone,
                            'body' => $message,
                            'status' => 'scheduled',
                            'campaign_name' => $campaignName,
                            'metadata' => ['template_id' => $smsTemplate->id, 'recipient_name' => $recipientName],
                            'scheduled_at' => $scheduledAt,
                        ]);
                        $results['sms'] = ['success' => true, 'scheduled' => true];
                    }
                }

                return response()->json(['success' => true, 'scheduled' => true, 'results' => $results]);
            }

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
                        $logId = (string) Str::uuid();
                        $emailResult = $this->sendEmail($smtpConfig, $recipientEmail, $subject, $body, $logId, $campaignName);
                        $results['email'] = $emailResult;

                        NotificationLog::create([
                            'id' => $logId,
                            'notification_type' => 'email',
                            'template_key' => $templateKey,
                            'recipient' => $recipientEmail,
                            'subject' => $subject,
                            'body' => $emailResult['html_body'] ?? $body,
                            'status' => $emailResult['success'] ? 'sent' : 'failed',
                            'error_message' => $emailResult['error'] ?? null,
                            'campaign_name' => $campaignName,
                            'metadata' => ['custom_broadcast' => true, 'recipient_name' => $recipientName],
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
                            'campaign_name' => $campaignName,
                            'metadata' => ['custom_broadcast' => true, 'recipient_name' => $recipientName],
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
                    $logId = (string) Str::uuid();
                    $emailResult = $this->sendEmail($smtpConfig, $recipientEmail, $subject, $body, $logId, $campaignName);
                    $results['email'] = $emailResult;

                    NotificationLog::create([
                        'id' => $logId,
                        'notification_type' => 'email',
                        'template_key' => $templateKey,
                        'recipient' => $recipientEmail,
                        'subject' => $subject,
                        'body' => $emailResult['html_body'] ?? $body,
                        'status' => $emailResult['success'] ? 'sent' : 'failed',
                        'error_message' => $emailResult['error'] ?? null,
                        'campaign_name' => $campaignName,
                        'metadata' => ['template_id' => $emailTemplate->id, 'recipient_name' => $recipientName],
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
                        'campaign_name' => $campaignName,
                        'metadata' => ['template_id' => $smsTemplate->id, 'recipient_name' => $recipientName],
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

    private function sendEmail($config, $to, $subject, $body, $logId = null, $campaignName = null, $isPrebuilt = false)
    {
        try {
            // Check if recipient is unsubscribed
            $isUnsubscribed = \Illuminate\Support\Facades\DB::table('unsubscribed_emails')
                ->where('email', $to)
                ->exists();
            if ($isUnsubscribed) {
                return ['success' => true, 'response' => 'Skipped sending: recipient email has unsubscribed', 'html_body' => ''];
            }

            $provider = $config['provider'] ?? (empty($config['host']) ? 'resend' : 'smtp');
            
            $companyName = \Illuminate\Support\Facades\DB::table('site_settings')
                ->where('setting_key', 'company_name')
                ->value('setting_value') ?? 'DIGI5 LTD';

            // Get unsubscribe config
            $unsubscribeEnabled = $config['unsubscribe_enabled'] ?? false;
            $unsubscribeUrl = $config['unsubscribe_url'] ?? '';
            if (empty($unsubscribeUrl)) {
                $unsubscribeUrl = url('/unsubscribe');
            }
            if (!str_contains($unsubscribeUrl, 'email=')) {
                $separator = str_contains($unsubscribeUrl, '?') ? '&' : '?';
                $unsubscribeUrl .= $separator . 'email=' . urlencode($to);
            }

            if ($isPrebuilt) {
                $htmlBody = $body;
            } else {
                if ($logId) {
                    // Click tracking: rewrite links in the body
                    $body = preg_replace_callback('/<a\s+([^>]*?)href=["\'](https?:\/\/[^"\']+)["\']([^>]*?)>/i', function ($matches) use ($logId) {
                        $attrsBefore = $matches[1];
                        $originalUrl = $matches[2];
                        $attrsAfter = $matches[3];
                        
                        if (str_contains($originalUrl, 'unsubscribe')) {
                            return $matches[0];
                        }
                        
                        $trackedUrl = url("api/mail-track/click/{$logId}") . '?url=' . urlencode($originalUrl);
                        return '<a ' . $attrsBefore . 'href="' . $trackedUrl . '"' . $attrsAfter . '>';
                    }, $body);
                }

                // Build beautifully wrapped HTML body
                $htmlBody = $this->buildEmailBody($body, $to, $subject, $unsubscribeEnabled, $unsubscribeUrl, $logId);
                
                // Append open tracking pixel if logId is provided
                if ($logId) {
                    $trackingPixel = '<img src="' . url("api/mail-track/open/{$logId}") . '" width="1" height="1" alt="" style="display:none;" />';
                    if (str_contains($htmlBody, '</body>')) {
                        $htmlBody = str_replace('</body>', $trackingPixel . '</body>', $htmlBody);
                    } else {
                        $htmlBody .= $trackingPixel;
                    }
                }
            }

            $plainBody = $this->convertHtmlToText($htmlBody);

            $unsubscribeHeaders = [];
            if ($unsubscribeEnabled) {
                $unsubscribeHeaders['List-Unsubscribe'] = '<' . $unsubscribeUrl . '>';
                $unsubscribeHeaders['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
            }

            if ($provider === 'resend' && !empty($config['api_key'])) {
                $payload = [
                    'from' => ($config['from_name'] ?? $companyName) . ' <' . ($config['from_email'] ?? 'onboarding@resend.dev') . '>',
                    'to' => [$to],
                    'subject' => $subject,
                    'html' => $htmlBody,
                    'text' => $plainBody,
                ];

                if (!empty($unsubscribeHeaders)) {
                    $payload['headers'] = $unsubscribeHeaders;
                }

                $response = Http::withToken($config['api_key'])
                    ->post('https://api.resend.com/emails', $payload);

                if ($response->successful()) {
                    return ['success' => true, 'response' => $response->json(), 'html_body' => $htmlBody];
                } else {
                    return ['success' => false, 'error' => $response->json()['message'] ?? 'Resend API call failed', 'response' => $response->json(), 'html_body' => $htmlBody];
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
            Mail::send([], [], function ($message) use ($to, $subject, $htmlBody, $plainBody, $config, $unsubscribeHeaders) {
                $message->to($to)
                    ->subject($subject)
                    ->html($htmlBody)
                    ->text($plainBody);
                
                if (!empty($config['from_email'])) {
                    $message->from($config['from_email'], $config['from_name'] ?? null);
                }

                foreach ($unsubscribeHeaders as $key => $val) {
                    try {
                        $message->getHeaders()->addTextHeader($key, $val);
                    } catch (\Exception $ex) {
                        try {
                            $message->getHeaders()->addHeader($key, $val);
                        } catch (\Exception $ex2) {}
                    }
                }
            });

            return ['success' => true, 'response' => 'Sent via Laravel Mail', 'html_body' => $htmlBody];
        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    private function convertHtmlToText($html) {
        $text = preg_replace('/<br\s*\/?>/i', "\n", $html);
        $text = preg_replace('/<\/p>/i', "\n\n", $text);
        $text = preg_replace('/<\/div>/i', "\n", $text);
        $text = preg_replace('/<\/h[1-6]>/i', "\n\n", $text);
        $text = preg_replace('/<a[^>]*href=["\']([^"\']*)["\'][^>]*>(.*?)<\/a>/i', '$2 ($1)', $text);
        $text = strip_tags($text);
        $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $text = preg_replace("/\n{3,}/", "\n\n", $text);
        return trim($text);
    }

    private function buildEmailBody($body, $to, $subject, $unsubscribeEnabled, $unsubscribeUrl, $logId = null) {
        $footerSettings = \Illuminate\Support\Facades\DB::table('site_settings')
            ->whereIn('setting_key', [
                'footer_title', 'footer_subtitle', 'footer_website_url', 'footer_website_text',
                'footer_address', 'footer_copyright', 'footer_terms_url', 'footer_privacy_url',
                'footer_contact_url', 'footer_instagram_url', 'footer_facebook_url', 'footer_twitter_url',
                'footer_youtube_url', 'footer_tiktok_url', 'footer_linkedin_url', 'company_logo_url', 'company_name'
            ])
            ->pluck('setting_value', 'setting_key')
            ->all();
        
        $companyName = $footerSettings['company_name'] ?? 'DIGI5 LTD';
        $logoUrl = $footerSettings['company_logo_url'] ?? null;
        
        // Construct Social Icons
        $socialIconsHtml = '';
        $socialPlatforms = [
            'instagram' => ['url_key' => 'footer_instagram_url', 'icon' => 'https://img.icons8.com/material-outlined/48/4f5660/instagram-new.png'],
            'facebook' => ['url_key' => 'footer_facebook_url', 'icon' => 'https://img.icons8.com/material-outlined/48/4f5660/facebook-new.png'],
            'twitter' => ['url_key' => 'footer_twitter_url', 'icon' => 'https://img.icons8.com/material-outlined/48/4f5660/twitter.png'],
            'youtube' => ['url_key' => 'footer_youtube_url', 'icon' => 'https://img.icons8.com/material-outlined/48/4f5660/youtube-play.png'],
            'tiktok' => ['url_key' => 'footer_tiktok_url', 'icon' => 'https://img.icons8.com/material-outlined/48/4f5660/tiktok.png'],
            'linkedin' => ['url_key' => 'footer_linkedin_url', 'icon' => 'https://img.icons8.com/material-outlined/48/4f5660/linkedin--v1.png'],
        ];
        
        foreach ($socialPlatforms as $platform => $info) {
            $url = $footerSettings[$info['url_key']] ?? null;
            if (!empty($url)) {
                $socialIconsHtml .= '<a href="' . htmlspecialchars($url) . '" style="display: inline-block; margin: 0 8px; text-decoration: none;" target="_blank"><img src="' . $info['icon'] . '" width="24" height="24" style="vertical-align: middle; border: 0;" alt="' . ucfirst($platform) . '"></a>';
            }
        }
        
        // Construct Unsubscribe text
        $unsubscribeHtml = '';
        if ($unsubscribeEnabled) {
            $unsubscribeHtml = '<p style="margin: 16px 0; font-size: 13px; color: #4b5563;">If you no longer wish to receive commercial emails from ' . htmlspecialchars($companyName) . ', you can <a href="' . htmlspecialchars($unsubscribeUrl) . '" style="color: #4b5563; text-decoration: underline;" target="_blank">Unsubscribe</a>.</p>';
        }
        
        // Construct Legal Links
        $legalLinksList = [];
        if (!empty($footerSettings['footer_terms_url'])) {
            $legalLinksList[] = '<a href="' . htmlspecialchars($footerSettings['footer_terms_url']) . '" style="color: #4b5563; text-decoration: underline; margin: 0 10px;" target="_blank">Terms</a>';
        }
        if (!empty($footerSettings['footer_privacy_url'])) {
            $legalLinksList[] = '<a href="' . htmlspecialchars($footerSettings['footer_privacy_url']) . '" style="color: #4b5563; text-decoration: underline; margin: 0 10px;" target="_blank">Privacy Policy</a>';
        }
        if (!empty($footerSettings['footer_contact_url'])) {
            $legalLinksList[] = '<a href="' . htmlspecialchars($footerSettings['footer_contact_url']) . '" style="color: #4b5563; text-decoration: underline; margin: 0 10px;" target="_blank">Contact Us</a>';
        }
        $legalLinksHtml = !empty($legalLinksList) ? '<div style="margin-top: 16px; font-size: 13px;">' . implode(' | ', $legalLinksList) . '</div>' : '';
        
        $footerTitle = $footerSettings['footer_title'] ?? '';
        $footerSubtitle = $footerSettings['footer_subtitle'] ?? '';
        $footerWebsiteUrl = $footerSettings['footer_website_url'] ?? '';
        $footerWebsiteText = $footerSettings['footer_website_text'] ?? $footerWebsiteUrl;
        $footerCopyright = $footerSettings['footer_copyright'] ?? '';
        $footerAddress = $footerSettings['footer_address'] ?? '';
        
        $footerHtml = '<div style="text-align: center; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; color: #4b5563; font-size: 14px; line-height: 1.6; padding: 40px 20px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; margin-top: 40px;">';
        if (!empty($footerTitle)) {
            $footerHtml .= '<h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #111827;">' . htmlspecialchars($footerTitle) . '</h3>';
        }
        if (!empty($footerSubtitle)) {
            $footerHtml .= '<p style="margin: 0 0 16px 0; font-size: 14px; color: #4b5563; max-width: 480px; margin-left: auto; margin-right: auto;">' . htmlspecialchars($footerSubtitle) . '</p>';
        }
        if (!empty($footerWebsiteUrl)) {
            $footerHtml .= '<a href="' . htmlspecialchars($footerWebsiteUrl) . '" style="color: #111827; font-weight: 600; text-decoration: underline; font-size: 14px;" target="_blank">' . htmlspecialchars($footerWebsiteText) . '</a>';
        }
        if (!empty($socialIconsHtml)) {
            $footerHtml .= '<div style="margin: 24px 0;">' . $socialIconsHtml . '</div>';
        }
        $footerHtml .= $unsubscribeHtml;
        
        $copyrightAddressList = [];
        if (!empty($footerCopyright)) $copyrightAddressList[] = htmlspecialchars($footerCopyright);
        if (!empty($footerAddress)) $copyrightAddressList[] = htmlspecialchars($footerAddress);
        
        if (!empty($copyrightAddressList)) {
            $footerHtml .= '<p style="margin: 16px 0 8px 0; font-size: 12px; color: #9ca3af;">' . implode(' - ', $copyrightAddressList) . '</p>';
        }
        $footerHtml .= $legalLinksHtml;
        $footerHtml .= '</div>';
        
        // Wrap/Inject
        if (str_contains($body, '<html>') || str_contains($body, '<html ')) {
            $webviewHtml = '';
            if ($logId) {
                $webviewHtml = '<div style="text-align: center; padding: 8px 0; font-size: 12px; color: #6b7280; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb; font-family: sans-serif;">
                    Trouble viewing this email? <a href="' . url("api/mail-track/webview/{$logId}") . '" style="color: #2563eb; text-decoration: underline;" target="_blank">View in Browser</a>
                </div>';
            }
            
            $finalBody = $body;
            if (str_contains($finalBody, '{{email_footer}}')) {
                $finalBody = str_replace('{{email_footer}}', $footerHtml, $finalBody);
            } else if (str_contains($finalBody, '</body>')) {
                $finalBody = str_replace('</body>', $footerHtml . '</body>', $finalBody);
            } else {
                $finalBody .= $footerHtml;
            }
            
            if ($webviewHtml) {
                if (str_contains($finalBody, '<body')) {
                    $finalBody = preg_replace('/(<body[^>]*>)/i', '$1' . $webviewHtml, $finalBody);
                } else {
                    $finalBody = $webviewHtml . $finalBody;
                }
            }
            
            return $finalBody;
        }
        
        // Construct Header HTML
        $headerHtml = '';
        if ($logoUrl) {
            $logoAbsoluteUrl = str_starts_with($logoUrl, 'http') ? $logoUrl : url($logoUrl);
            $headerHtml = '<div style="text-align: center; padding: 24px 0; border-bottom: 1px solid #e5e7eb;"><img src="' . htmlspecialchars($logoAbsoluteUrl) . '" style="max-height: 48px; width: auto;" alt="' . htmlspecialchars($companyName) . '"></div>';
        } else {
            $headerHtml = '<div style="text-align: center; padding: 24px 0; border-bottom: 1px solid #e5e7eb;"><h2 style="margin: 0; color: #111827; font-size: 20px; font-weight: 600;">' . htmlspecialchars($companyName) . '</h2></div>';
        }
        
        $webviewHtml = '';
        if ($logId) {
            $webviewHtml = '<div style="text-align: center; padding: 8px 0; font-size: 12px; color: #6b7280; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">
                Trouble viewing this email? <a href="' . url("api/mail-track/webview/{$logId}") . '" style="color: #2563eb; text-decoration: underline;" target="_blank">View in Browser</a>
            </div>';
        }
        
        return '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>' . htmlspecialchars($subject) . '</title>
    <style>
        body { margin: 0; padding: 0; background-color: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
        .email-container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.02); border: 1px solid #e5e7eb; }
        .email-body { padding: 32px; font-size: 16px; line-height: 1.6; color: #1f2937; }
        p { margin-top: 0; margin-bottom: 16px; }
        a { color: #2563eb; text-decoration: underline; }
    </style>
</head>
<body>
    <div class="email-container">
        ' . $webviewHtml . '
        ' . $headerHtml . '
        <div class="email-body">
            ' . $body . '
        </div>
        ' . $footerHtml . '
    </div>
</body>
</html>';
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
