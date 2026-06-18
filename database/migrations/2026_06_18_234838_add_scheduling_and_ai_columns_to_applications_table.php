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
        Schema::table('applications', function (Blueprint $table) {
            $table->timestamp('interview_scheduled_at')->nullable()->after('skill_score');
            $table->string('interview_meeting_link')->nullable()->after('interview_scheduled_at');
            $table->string('interview_type')->nullable()->after('interview_meeting_link');
            $table->text('ai_screening')->nullable()->after('interview_type');
        });

        // Seed templates
        $now = now()->format('Y-m-d H:i:s');
        $templates = [
            // internship templates
            [
                'id' => (string) Str::uuid(),
                'name' => 'Internship Interview Scheduled',
                'template_key' => 'application_interview_scheduled',
                'template_type' => 'email',
                'subject' => 'Interview Scheduled - {{form_title}}',
                'body_template' => "Dear {{applicant_name}},\n\nWe are pleased to inform you that your interview for the {{form_title}} position has been scheduled.\n\nDate & Time: {{interview_time}}\nType: {{interview_type}}\nMeeting Link/Location: {{interview_link}}\n\nTrack status updates here: {{status_url}}\n\nBest regards,\nDIGI5 LTD Team",
                'is_enabled' => 1,
                'created_at' => $now,
                'updated_at' => $now
            ],
            [
                'id' => (string) Str::uuid(),
                'name' => 'Internship Interview Scheduled',
                'template_key' => 'application_interview_scheduled',
                'template_type' => 'sms',
                'subject' => null,
                'body_template' => "Dear {{applicant_name}}, your interview for {{form_title}} is scheduled on {{interview_time}} via {{interview_type}}. Details: {{status_url}}",
                'is_enabled' => 1,
                'created_at' => $now,
                'updated_at' => $now
            ],

            // job templates
            [
                'id' => (string) Str::uuid(),
                'name' => 'Job Interview Scheduled',
                'template_key' => 'job_application_interview_scheduled',
                'template_type' => 'email',
                'subject' => 'Interview Scheduled - {{form_title}}',
                'body_template' => "Dear {{applicant_name}},\n\nWe are pleased to inform you that your interview for the {{form_title}} position has been scheduled.\n\nDate & Time: {{interview_time}}\nType: {{interview_type}}\nMeeting Link/Location: {{interview_link}}\n\nTrack status updates here: {{status_url}}\n\nBest regards,\nDIGI5 LTD Team",
                'is_enabled' => 1,
                'created_at' => $now,
                'updated_at' => $now
            ],
            [
                'id' => (string) Str::uuid(),
                'name' => 'Job Interview Scheduled',
                'template_key' => 'job_application_interview_scheduled',
                'template_type' => 'sms',
                'subject' => null,
                'body_template' => "Dear {{applicant_name}}, your interview for {{form_title}} is scheduled on {{interview_time}} via {{interview_type}}. Details: {{status_url}}",
                'is_enabled' => 1,
                'created_at' => $now,
                'updated_at' => $now
            ],
        ];

        DB::table('notification_templates')->insert($templates);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('notification_templates')->whereIn('template_key', [
            'application_interview_scheduled',
            'job_application_interview_scheduled'
        ])->delete();

        Schema::table('applications', function (Blueprint $table) {
            $table->dropColumn([
                'interview_scheduled_at',
                'interview_meeting_link',
                'interview_type',
                'ai_screening'
            ]);
        });
    }
};
