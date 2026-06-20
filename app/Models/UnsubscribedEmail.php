<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class UnsubscribedEmail extends Model
{
    use HasUuids;

    protected $fillable = ['id', 'email'];
}
