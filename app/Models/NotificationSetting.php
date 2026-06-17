<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class NotificationSetting extends Model
{
    use HasUuids;

    protected $fillable = ['id', 'setting_type', 'is_enabled', 'config', 'test_mode'];

    protected $casts = [
        'is_enabled' => 'boolean',
        'config' => 'json',
        'test_mode' => 'boolean',
    ];
}
