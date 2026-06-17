<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Intern extends Model
{
    use HasUuids;

    protected $fillable = ['id', 'user_id', 'department_id', 'role_title', 'description', 'phone', 'start_date', 'end_date', 'status', 'supervisor_name'];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id', 'id');
    }

    public function certificates()
    {
        return $this->hasMany(Certificate::class, 'intern_id', 'id');
    }

    public function assessments()
    {
        return $this->hasMany(InternSkillAssessment::class, 'intern_id', 'id');
    }
}
