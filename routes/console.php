<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Http\Controllers\EdgeFunctionCompatController;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('notifications:process-scheduled', function () {
    $this->info('Processing scheduled notifications...');
    $controller = new EdgeFunctionCompatController();
    $processedCount = $controller->processScheduled();
    $this->info("Successfully processed {$processedCount} notifications.");
})->purpose('Process and send scheduled notifications');

Schedule::command('notifications:process-scheduled')->everyMinute();
