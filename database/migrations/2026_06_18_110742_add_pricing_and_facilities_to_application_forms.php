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
            $table->boolean('is_paid')->default(false)->after('batch_name');
            $table->string('stipend_amount')->nullable()->after('is_paid');
            $table->json('facilities')->nullable()->after('stipend_amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('application_forms', function (Blueprint $table) {
            $table->dropColumn(['is_paid', 'stipend_amount', 'facilities']);
        });
    }
};
