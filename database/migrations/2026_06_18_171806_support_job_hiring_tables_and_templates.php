<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Add form_type and salary_range to application_forms
        Schema::table('application_forms', function (Blueprint $table) {
            $table->string('form_type')->default('internship')->after('title');
            $table->string('salary_range')->nullable()->after('is_paid');
        });

        // 2. Add form_type to applications
        Schema::table('applications', function (Blueprint $table) {
            $table->string('form_type')->default('internship')->after('form_id');
        });

        // 3. Seed Job notification templates
        $now = now()->format('Y-m-d H:i:s');
        $templates = [
            // job_application_submitted
            [
                'id' => (string) Str::uuid(),
                'name' => 'Job Application Submitted',
                'template_key' => 'job_application_submitted',
                'template_type' => 'email',
                'subject' => 'Job Application Received - {{form_title}}',
                'body_template' => "Dear {{applicant_name}},\n\nThank you for submitting your application for the {{form_title}} position at DIGI5 LTD.\n\nWe have received your application and will review it shortly. You will be notified once your application status is updated.\n\nBest regards,\nDIGI5 LTD Team",
                'is_enabled' => 1,
                'created_at' => $now,
                'updated_at' => $now
            ],
            [
                'id' => (string) Str::uuid(),
                'name' => 'Job Application Submitted',
                'template_key' => 'job_application_submitted',
                'template_type' => 'sms',
                'subject' => null,
                'body_template' => "Dear {{applicant_name}}, your job application for {{form_title}} at DIGI5 LTD has been received. We will notify you of any updates.",
                'is_enabled' => 1,
                'created_at' => $now,
                'updated_at' => $now
            ],
            
            // job_application_status_changed
            [
                'id' => (string) Str::uuid(),
                'name' => 'Job Application Status Changed',
                'template_key' => 'job_application_status_changed',
                'template_type' => 'email',
                'subject' => 'Job Application Update - {{form_title}}',
                'body_template' => "Dear {{applicant_name}},\n\nYour application status for {{form_title}} has been updated.\n\nNew Status: {{application_status}}\n\n{{#if admin_notes}}\nNotes: {{admin_notes}}\n{{/if}}\n\nBest regards,\nDIGI5 LTD Team",
                'is_enabled' => 1,
                'created_at' => $now,
                'updated_at' => $now
            ],
            [
                'id' => (string) Str::uuid(),
                'name' => 'Job Application Status Changed',
                'template_key' => 'job_application_status_changed',
                'template_type' => 'sms',
                'subject' => null,
                'body_template' => "Hi {{applicant_name}}, your job application for {{form_title}} status: {{application_status}}. - DIGI5 LTD",
                'is_enabled' => 1,
                'created_at' => $now,
                'updated_at' => $now
            ],

            // job_application_approved
            [
                'id' => (string) Str::uuid(),
                'name' => 'Job Application Approved',
                'template_key' => 'job_application_approved',
                'template_type' => 'email',
                'subject' => 'Job Offer - {{position}}',
                'body_template' => "Dear {{applicant_name}},\n\nCongratulations! We are delighted to inform you that your application for the {{position}} position has been approved.\n\nWelcome to the {{company_name}} team! We are excited to have you on board. Our HR team will reach out to you shortly with next steps and the job contract.\n\nBest regards,\n{{company_name}} Team",
                'is_enabled' => 1,
                'created_at' => $now,
                'updated_at' => $now
            ],
            [
                'id' => (string) Str::uuid(),
                'name' => 'Job Application Approved',
                'template_key' => 'job_application_approved',
                'template_type' => 'sms',
                'subject' => null,
                'body_template' => "Congratulations {{applicant_name}}! Your application for {{position}} at {{company_name}} has been approved. Welcome to the team!",
                'is_enabled' => 1,
                'created_at' => $now,
                'updated_at' => $now
            ],

            // job_application_rejected
            [
                'id' => (string) Str::uuid(),
                'name' => 'Job Application Rejected',
                'template_key' => 'job_application_rejected',
                'template_type' => 'email',
                'subject' => 'Application Update - {{company_name}}',
                'body_template' => "Dear {{applicant_name}},\n\nThank you for your interest in the {{position}} position at {{company_name}} and for taking the time to apply.\n\nAfter careful consideration, we regret to inform you that we will not be moving forward with your application at this time.\n\nWe wish you the best in your career endeavors.\n\nBest regards,\n{{company_name}} Team",
                'is_enabled' => 1,
                'created_at' => $now,
                'updated_at' => $now
            ],
            [
                'id' => (string) Str::uuid(),
                'name' => 'Job Application Rejected',
                'template_key' => 'job_application_rejected',
                'template_type' => 'sms',
                'subject' => null,
                'body_template' => "Hi {{applicant_name}}, thank you for applying to {{company_name}}. Unfortunately, we will not be moving forward with your application at this time.",
                'is_enabled' => 1,
                'created_at' => $now,
                'updated_at' => $now
            ],

            // job_application_shortlisted
            [
                'id' => (string) Str::uuid(),
                'name' => 'Job Application Shortlisted',
                'template_key' => 'job_application_shortlisted',
                'template_type' => 'email',
                'subject' => 'Congratulations! You have been Shortlisted - {{company_name}}',
                'body_template' => "Dear {{applicant_name}},\n\nGreat news! Your application for the {{position}} position at {{company_name}} has been shortlisted.\n\nWe would like to move forward with your application. Our team will reach out to you shortly to schedule an interview.\n\nBest regards,\n{{company_name}} Team",
                'is_enabled' => 1,
                'created_at' => $now,
                'updated_at' => $now
            ],
            [
                'id' => (string) Str::uuid(),
                'name' => 'Job Application Shortlisted',
                'template_key' => 'job_application_shortlisted',
                'template_type' => 'sms',
                'subject' => null,
                'body_template' => "Congratulations {{applicant_name}}! Your application for {{position}} at {{company_name}} has been shortlisted. We will contact you soon.",
                'is_enabled' => 1,
                'created_at' => $now,
                'updated_at' => $now
            ],

            // job_application_reviewing
            [
                'id' => (string) Str::uuid(),
                'name' => 'Job Application Under Review',
                'template_key' => 'job_application_reviewing',
                'template_type' => 'email',
                'subject' => 'Your Application is Under Review - {{company_name}}',
                'body_template' => "Dear {{applicant_name}},\n\nThank you for your application for the {{position}} position at {{company_name}}.\n\nYour application is currently under review by our hiring team. We will get back to you soon with further updates.\n\nBest regards,\n{{company_name}} Team",
                'is_enabled' => 1,
                'created_at' => $now,
                'updated_at' => $now
            ],
            [
                'id' => (string) Str::uuid(),
                'name' => 'Job Application Under Review',
                'template_key' => 'job_application_reviewing',
                'template_type' => 'sms',
                'subject' => null,
                'body_template' => "Hi {{applicant_name}}, your application for {{position}} at {{company_name}} is now under review. We will contact you soon.",
                'is_enabled' => 1,
                'created_at' => $now,
                'updated_at' => $now
            ]
        ];

        DB::table('notification_templates')->insert($templates);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove templates
        DB::table('notification_templates')->whereIn('template_key', [
            'job_application_submitted',
            'job_application_status_changed',
            'job_application_approved',
            'job_application_rejected',
            'job_application_shortlisted',
            'job_application_reviewing'
        ])->delete();

        // Drop columns
        Schema::table('applications', function (Blueprint $table) {
            $table->dropColumn('form_type');
        });

        Schema::table('application_forms', function (Blueprint $table) {
            $table->dropColumn(['form_type', 'salary_range']);
        });
    }
};
