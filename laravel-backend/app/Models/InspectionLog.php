<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InspectionLog extends Model
{
    protected $fillable = [
        'duty_schedule_id', 'inspector_id', 'inspected_at', 'is_staff_present', 'is_normal', 'remark', 'signature_data'
    ];

    public function schedule()
    {
        return $this->belongsTo(DutySchedule::class, 'duty_schedule_id');
    }

    public function inspector()
    {
        return $this->belongsTo(User::class, 'inspector_id');
    }
}
