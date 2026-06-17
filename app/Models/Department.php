<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Department extends Model
{
    use HasUuids;

    protected $fillable = ['id', 'name', 'description', 'head_name'];

    public function skills()
    {
        return $this->hasMany(DepartmentSkill::class, 'department_id', 'id');
    }

    public function forms()
    {
        return $this->hasMany(ApplicationForm::class, 'department_id', 'id');
    }

    public function interns()
    {
        return $this->hasMany(Intern::class, 'department_id', 'id');
    }

    public function staffAssignments()
    {
        return $this->hasMany(StaffAssignment::class, 'department_id', 'id');
    }
}
