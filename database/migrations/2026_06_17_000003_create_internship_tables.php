<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Departments
        Schema::create('departments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('head_name')->nullable();
            $table->timestamps();
        });

        // 2. Department Skills
        Schema::create('department_skills', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('department_id');
            $table->string('skill_name');
            $table->text('skill_description')->nullable();
            $table->integer('display_order')->nullable();
            $table->timestamps();

            $table->foreign('department_id')->references('id')->on('departments')->onDelete('cascade');
        });

        // 3. Application Forms
        Schema::create('application_forms', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('department_id')->nullable();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('slug')->unique();
            $table->timestamp('deadline')->nullable();
            $table->boolean('is_active')->default(true);
            $table->uuid('created_by')->nullable();
            $table->timestamps();

            $table->foreign('department_id')->references('id')->on('departments')->onDelete('set null');
        });

        // 4. Form Fields
        Schema::create('form_fields', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('form_id');
            $table->string('label');
            $table->string('placeholder')->nullable();
            $table->string('field_type'); // enum: text, textarea, email, phone, number, date, select, radio, checkbox, file
            $table->boolean('is_required')->default(false);
            $table->json('options')->nullable();
            $table->json('validation_rules')->nullable();
            $table->integer('display_order')->default(0);
            $table->timestamps();

            $table->foreign('form_id')->references('id')->on('application_forms')->onDelete('cascade');
        });

        // 5. Applications
        Schema::create('applications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('form_id');
            $table->string('applicant_name');
            $table->string('applicant_email');
            $table->string('applicant_phone')->nullable();
            $table->string('status')->default('submitted'); // enum: submitted, reviewing, shortlisted, approved, rejected
            $table->text('admin_notes')->nullable();
            $table->uuid('reviewed_by')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->foreign('form_id')->references('id')->on('application_forms')->onDelete('cascade');
        });

        // 6. Application Responses
        Schema::create('application_responses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('application_id');
            $table->uuid('field_id');
            $table->text('response_value')->nullable();
            $table->text('file_url')->nullable();
            $table->timestamp('created_at')->nullable();

            $table->foreign('application_id')->references('id')->on('applications')->onDelete('cascade');
            $table->foreign('field_id')->references('id')->on('form_fields')->onDelete('cascade');
        });

        // 7. Profiles
        Schema::create('profiles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->unique();
            $table->string('email');
            $table->string('full_name')->nullable();
            $table->text('avatar_url')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        // 8. User Roles
        Schema::create('user_roles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->string('role'); // enum: admin, intern, staff
            $table->timestamp('created_at')->nullable();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        // 9. Interns
        Schema::create('interns', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->unique();
            $table->uuid('department_id')->nullable();
            $table->string('role_title');
            $table->text('description')->nullable();
            $table->string('phone')->nullable();
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->string('status')->default('pending'); // enum: pending, active, completed, terminated
            $table->string('supervisor_name')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('department_id')->references('id')->on('departments')->onDelete('set null');
        });

        // 10. Certificates
        Schema::create('certificates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('certificate_id')->unique();
            $table->uuid('intern_id');
            $table->string('template_type')->nullable();
            $table->date('issued_date')->nullable();
            $table->uuid('issued_by')->nullable();
            $table->string('status')->default('pending'); // enum: pending, issued, revoked
            $table->text('qr_code_data')->nullable();
            $table->timestamps();

            $table->foreign('intern_id')->references('id')->on('interns')->onDelete('cascade');
        });

        // 11. Intern Skill Assessments
        Schema::create('intern_skill_assessments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('intern_id');
            $table->uuid('skill_id');
            $table->integer('rating')->nullable();
            $table->text('notes')->nullable();
            $table->uuid('assessed_by')->nullable();
            $table->timestamps();

            $table->foreign('intern_id')->references('id')->on('interns')->onDelete('cascade');
            $table->foreign('skill_id')->references('id')->on('department_skills')->onDelete('cascade');
        });

        // 12. Staff Assignments
        Schema::create('staff_assignments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->uuid('department_id');
            $table->timestamp('created_at')->nullable();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('department_id')->references('id')->on('departments')->onDelete('cascade');
        });

        // 13. Nav Menu Items
        Schema::create('nav_menu_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('label');
            $table->string('url');
            $table->integer('display_order')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_external')->default(false);
            $table->timestamps();
        });

        // 14. Site Settings
        Schema::create('site_settings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('setting_key')->unique();
            $table->text('setting_value')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->timestamps();
        });

        // 15. Notification Settings
        Schema::create('notification_settings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('setting_type');
            $table->boolean('is_enabled')->default(true);
            $table->json('config');
            $table->boolean('test_mode')->default(false);
            $table->timestamps();
        });

        // 16. Notification Templates
        Schema::create('notification_templates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('template_key');
            $table->string('template_type');
            $table->string('subject')->nullable();
            $table->text('body_template');
            $table->boolean('is_enabled')->default(true);
            $table->timestamps();

            $table->unique(['template_key', 'template_type']);
        });

        // 17. Notification Logs
        Schema::create('notification_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('recipient');
            $table->string('notification_type');
            $table->string('subject')->nullable();
            $table->text('body')->nullable();
            $table->string('template_key')->nullable();
            $table->string('status')->nullable();
            $table->text('error_message')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('sent_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notification_logs');
        Schema::dropIfExists('notification_templates');
        Schema::dropIfExists('notification_settings');
        Schema::dropIfExists('site_settings');
        Schema::dropIfExists('nav_menu_items');
        Schema::dropIfExists('staff_assignments');
        Schema::dropIfExists('intern_skill_assessments');
        Schema::dropIfExists('certificates');
        Schema::dropIfExists('interns');
        Schema::dropIfExists('user_roles');
        Schema::dropIfExists('profiles');
        Schema::dropIfExists('application_responses');
        Schema::dropIfExists('applications');
        Schema::dropIfExists('form_fields');
        Schema::dropIfExists('application_forms');
        Schema::dropIfExists('department_skills');
        Schema::dropIfExists('departments');
    }
};
