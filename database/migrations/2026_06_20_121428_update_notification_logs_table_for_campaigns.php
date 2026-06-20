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
        Schema::table('notification_logs', function (Blueprint $table) {
            $table->string('campaign_name')->nullable();
            $table->boolean('opened')->default(false);
            $table->boolean('clicked')->default(false);
            $table->timestamp('opened_at')->nullable();
            $table->timestamp('clicked_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notification_logs', function (Blueprint $table) {
            $table->dropColumn(['campaign_name', 'opened', 'clicked', 'opened_at', 'clicked_at']);
        });
    }
};
