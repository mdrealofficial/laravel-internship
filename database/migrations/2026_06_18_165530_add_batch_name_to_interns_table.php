<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('interns', function (Blueprint $table) {
            $table->string('batch_name')->nullable()->after('department_id');
        });

        // Seed some batch names for existing interns so we have test data
        DB::table('interns')->whereNull('batch_name')->update(['batch_name' => 'Batch 2026']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('interns', function (Blueprint $table) {
            $table->dropColumn('batch_name');
        });
    }
};
