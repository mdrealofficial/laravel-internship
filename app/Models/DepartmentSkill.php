<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class DepartmentSkill extends Model
{
    use HasUuids;

    protected $fillable = ['id', 'department_id', 'skill_name', 'skill_description', 'display_order'];

    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id', 'id');
    }

    public function assessments()
    {
        return $this->hasMany(InternSkillAssessment::class, 'skill_id', 'id');
    }
}
