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
        Schema::table('application_forms', function (Blueprint $table) {
            $table->string('job_type')->nullable()->after('form_type');
            $table->string('job_location')->nullable()->after('job_type');
            $table->string('office_timing')->nullable()->after('job_location');
            $table->string('working_days')->nullable()->after('office_timing');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('application_forms', function (Blueprint $table) {
            $table->dropColumn(['job_type', 'job_location', 'office_timing', 'working_days']);
        });
    }
};
