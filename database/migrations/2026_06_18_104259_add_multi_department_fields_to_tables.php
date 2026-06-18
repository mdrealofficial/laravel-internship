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
            $table->boolean('is_multi_department')->default(false)->after('department_id');
            $table->json('allowed_departments')->nullable()->after('is_multi_department');
        });

        Schema::table('applications', function (Blueprint $table) {
            $table->uuid('department_id')->nullable()->after('form_id');
            $table->foreign('department_id')->references('id')->on('departments')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            $table->dropForeign(['department_id']);
            $table->dropColumn('department_id');
        });

        Schema::table('application_forms', function (Blueprint $table) {
            $table->dropColumn(['is_multi_department', 'allowed_departments']);
        });
    }
};
