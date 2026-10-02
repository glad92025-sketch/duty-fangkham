<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DutyCheckin extends Model
{
    protected $fillable = [
        'duty_schedule_id', 'checkin_at', 'checkin_lat', 'checkin_lng', 'checkin_photo_path', 'checkout_at', 'incident_report'
    ];

    public function schedule()
    {
        return $this->belongsTo(DutySchedule::class, 'duty_schedule_id');
    }
}
