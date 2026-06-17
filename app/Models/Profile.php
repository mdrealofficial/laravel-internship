<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Profile extends Model
{
    use HasUuids;

    protected $fillable = ['id', 'user_id', 'email', 'full_name', 'avatar_url'];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }
}
