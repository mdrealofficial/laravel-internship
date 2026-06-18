<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ApplicationForm extends Model
{
    use HasUuids;

    protected $fillable = ['id', 'department_id', 'is_multi_department', 'allowed_departments', 'title', 'batch_name', 'is_paid', 'stipend_amount', 'facilities', 'description', 'slug', 'deadline', 'is_active', 'created_by'];

    protected $casts = [
        'is_active' => 'boolean',
        'deadline' => 'datetime',
        'is_multi_department' => 'boolean',
        'allowed_departments' => 'json',
        'is_paid' => 'boolean',
        'facilities' => 'json',
    ];

    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id', 'id');
    }

    public function formFields()
    {
        return $this->hasMany(FormField::class, 'form_id', 'id')->orderBy('display_order');
    }

    public function applications()
    {
        return $this->hasMany(Application::class, 'form_id', 'id');
    }
}
