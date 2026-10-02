<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DutySwap extends Model
{
    protected $fillable = [
        'duty_schedule_id', 'requester_id', 'substitute_id', 'reason', 'approved_by', 'status'
    ];

    public function schedule()
    {
        return $this->belongsTo(DutySchedule::class, 'duty_schedule_id');
    }

    public function requester()
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function substitute()
    {
        return $this->belongsTo(User::class, 'substitute_id');
    }
}
