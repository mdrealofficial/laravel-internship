<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class NotificationLog extends Model
{
    use HasUuids;

    public $timestamps = false; // sent_at maps to created_at basically, manually handled

    protected $fillable = ['id', 'recipient', 'notification_type', 'subject', 'body', 'template_key', 'status', 'error_message', 'metadata', 'sent_at'];

    protected $casts = [
        'metadata' => 'json',
        'sent_at' => 'datetime',
    ];
}
