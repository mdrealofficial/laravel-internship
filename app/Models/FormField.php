<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class FormField extends Model
{
    use HasUuids;

    protected $fillable = ['id', 'form_id', 'label', 'placeholder', 'field_type', 'is_required', 'options', 'validation_rules', 'display_order'];

    protected $casts = [
        'is_required' => 'boolean',
        'options' => 'json',
        'validation_rules' => 'json',
    ];

    public function form()
    {
        return $this->belongsTo(ApplicationForm::class, 'form_id', 'id');
    }
}
