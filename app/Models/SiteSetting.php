<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class SiteSetting extends Model
{
    use HasUuids;

    protected $fillable = ['id', 'setting_key', 'setting_value', 'updated_by'];
}
