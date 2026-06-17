<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class NotificationTemplate extends Model
{
    use HasUuids;

    protected $fillable = ['id', 'name', 'template_key', 'template_type', 'subject', 'body_template', 'is_enabled'];

    protected $casts = [
        'is_enabled' => 'boolean',
    ];
}
