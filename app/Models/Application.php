<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Application extends Model
{
    use HasUuids;

    protected $fillable = ['id', 'form_id', 'department_id', 'applicant_name', 'applicant_email', 'applicant_phone', 'status', 'admin_notes', 'reviewed_by', 'reviewed_at', 'delivery_status', 'skill_score'];

    protected $casts = [
        'reviewed_at' => 'datetime',
    ];

    public function form()
    {
        return $this->belongsTo(ApplicationForm::class, 'form_id', 'id');
    }

    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id', 'id');
    }

    public function responses()
    {
        return $this->hasMany(ApplicationResponse::class, 'application_id', 'id');
    }
}
