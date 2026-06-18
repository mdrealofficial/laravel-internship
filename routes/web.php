<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SupabaseCompatController;
use App\Http\Controllers\AuthCompatController;
use App\Http\Controllers\StorageCompatController;
use App\Http\Controllers\EdgeFunctionCompatController;

// Supabase Compatibility API
Route::prefix('api/supabase-compat')->group(function () {
    Route::post('query', [SupabaseCompatController::class, 'query']);
    
    Route::post('auth/signin', [AuthCompatController::class, 'signin']);
    Route::post('auth/signup', [AuthCompatController::class, 'signup']);
    Route::post('auth/signout', [AuthCompatController::class, 'signout']);
    Route::get('auth/session', [AuthCompatController::class, 'session']);
    Route::post('auth/update-user', [AuthCompatController::class, 'updateUser']);
    
    Route::post('storage/upload', [StorageCompatController::class, 'upload']);
    Route::post('functions/{name}', [EdgeFunctionCompatController::class, 'invoke']);
});

// Storage Fallback Route (handles requests if symbolic link is broken or missing)
Route::get('storage/{bucket}/{path}', [StorageCompatController::class, 'serve'])->where('path', '.*');

// Wildcard SPA route
Route::get('/{any?}', function () {
    return view('app');
})->where('any', '^(?!api|storage|up).*');

