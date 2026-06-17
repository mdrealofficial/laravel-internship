<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class InternSkillAssessment extends Model
{
    use HasUuids;

    protected $fillable = ['id', 'intern_id', 'skill_id', 'rating', 'notes', 'assessed_by'];

    public function intern()
    {
        return $this->belongsTo(Intern::class, 'intern_id', 'id');
    }

    public function skill()
    {
        return $this->belongsTo(DepartmentSkill::class, 'skill_id', 'id');
    }
}
