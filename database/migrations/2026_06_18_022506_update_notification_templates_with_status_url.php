<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Update application_submitted email template
        DB::table('notification_templates')
            ->where('template_key', 'application_submitted')
            ->where('template_type', 'email')
            ->update([
                'body_template' => "Dear {{applicant_name}},\n\nThank you for submitting your application for {{form_title}} at DIGI5 LTD.\n\nWe have received your application and our team will review it shortly. You can track your application status anytime here: {{status_url}}\n\nBest regards,\nDIGI5 LTD Team"
            ]);

        // 2. Update application_submitted sms template
        DB::table('notification_templates')
            ->where('template_key', 'application_submitted')
            ->where('template_type', 'sms')
            ->update([
                'body_template' => "Dear {{applicant_name}}, your application for {{form_title}} has been received. Track status: {{status_url}}"
            ]);

        // 3. Update application_status_changed email template
        DB::table('notification_templates')
            ->where('template_key', 'application_status_changed')
            ->where('template_type', 'email')
            ->update([
                'body_template' => "Dear {{applicant_name}},\n\nYour application for {{form_title}} has been updated.\n\nNew Status: {{application_status}}\n\nNotes: {{admin_notes}}\n\nCheck full details here: {{status_url}}\n\nBest regards,\nDIGI5 LTD Team"
            ]);

        // 4. Update application_status_changed sms template
        DB::table('notification_templates')
            ->where('template_key', 'application_status_changed')
            ->where('template_type', 'sms')
            ->update([
                'body_template' => "Hi {{applicant_name}}, your application for {{form_title}} status: {{application_status}}. Check details: {{status_url}}"
            ]);

        // 5. Update application_approved email template
        DB::table('notification_templates')
            ->where('template_key', 'application_approved')
            ->where('template_type', 'email')
            ->update([
                'body_template' => "Dear {{applicant_name}},\n\nCongratulations! We are delighted to inform you that your application for the {{position}} position has been approved.\n\nWelcome to the {{company_name}} team! We are excited to have you on board. You will receive further instructions regarding your onboarding process shortly.\n\nYou can track details here: {{status_url}}\n\nBest regards,\n{{company_name}} Team"
            ]);

        // 6. Update application_approved sms template
        DB::table('notification_templates')
            ->where('template_key', 'application_approved')
            ->where('template_type', 'sms')
            ->update([
                'body_template' => "Congratulations {{applicant_name}}! Your application for {{position}} at {{company_name}} has been approved. Status details: {{status_url}}"
            ]);

        // 7. Update application_rejected email template
        DB::table('notification_templates')
            ->where('template_key', 'application_rejected')
            ->where('template_type', 'email')
            ->update([
                'body_template' => "Dear {{applicant_name}},\n\nThank you for your interest in the {{position}} position at {{company_name}} and for taking the time to apply.\n\nAfter careful consideration, we regret to inform you that we will not be moving forward with your application at this time.\n\nYou can track details here: {{status_url}}\n\nBest regards,\n{{company_name}} Team"
            ]);

        // 8. Update application_rejected sms template
        DB::table('notification_templates')
            ->where('template_key', 'application_rejected')
            ->where('template_type', 'sms')
            ->update([
                'body_template' => "Hi {{applicant_name}}, thank you for applying to {{company_name}}. Unfortunately, we will not be moving forward at this time. Track status: {{status_url}}"
            ]);

        // 9. Update application_shortlisted email template
        DB::table('notification_templates')
            ->where('template_key', 'application_shortlisted')
            ->where('template_type', 'email')
            ->update([
                'body_template' => "Dear {{applicant_name}},\n\nGreat news! Your application for the {{position}} position at {{company_name}} has been shortlisted.\n\nWe were impressed with your profile and would like to move forward with your application. Our team will reach out shortly.\n\nTrack status here: {{status_url}}\n\nBest regards,\n{{company_name}} Team"
            ]);

        // 10. Update application_shortlisted sms template
        DB::table('notification_templates')
            ->where('template_key', 'application_shortlisted')
            ->where('template_type', 'sms')
            ->update([
                'body_template' => "Congratulations {{applicant_name}}! Your application for {{position}} at {{company_name}} has been shortlisted. Track: {{status_url}}"
            ]);

        // 11. Update application_reviewing email template
        DB::table('notification_templates')
            ->where('template_key', 'application_reviewing')
            ->where('template_type', 'email')
            ->update([
                'body_template' => "Dear {{applicant_name}},\n\nThank you for your application for the {{position}} position at {{company_name}}.\n\nWe are pleased to inform you that your application is currently under review by our team.\n\nTrack status updates here: {{status_url}}\n\nBest regards,\n{{company_name}} Team"
            ]);

        // 12. Update application_reviewing sms template
        DB::table('notification_templates')
            ->where('template_key', 'application_reviewing')
            ->where('template_type', 'sms')
            ->update([
                'body_template' => "Hi {{applicant_name}}, your application for {{position}} at {{company_name}} is now under review. Track updates: {{status_url}}"
            ]);
    }

    public function down(): void
    {
        // No down migration needed for seeded template body text updates
    }
};
