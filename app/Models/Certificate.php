<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Certificate extends Model
{
    use HasUuids;

    protected $fillable = ['id', 'certificate_id', 'intern_id', 'template_type', 'issued_date', 'issued_by', 'status', 'qr_code_data'];

    protected $casts = [
        'issued_date' => 'date',
    ];

    public function intern()
    {
        return $this->belongsTo(Intern::class, 'intern_id', 'id');
    }
}
