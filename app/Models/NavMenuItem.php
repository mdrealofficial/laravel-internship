<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class NavMenuItem extends Model
{
    use HasUuids;

    protected $fillable = ['id', 'label', 'icon', 'url', 'display_order', 'is_active', 'is_external'];

    protected $casts = [
        'is_active' => 'boolean',
        'is_external' => 'boolean',
    ];
}
