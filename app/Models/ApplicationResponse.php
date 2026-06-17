<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ApplicationResponse extends Model
{
    use HasUuids;

    public $timestamps = false; // created_at only in migration

    protected $fillable = ['id', 'application_id', 'field_id', 'response_value', 'file_url', 'created_at'];

    public function application()
    {
        return $this->belongsTo(Application::class, 'application_id', 'id');
    }

    public function formField()
    {
        return $this->belongsTo(FormField::class, 'field_id', 'id');
    }
}
