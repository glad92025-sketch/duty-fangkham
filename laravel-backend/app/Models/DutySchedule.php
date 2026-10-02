<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DutySchedule extends Model
{
    protected $fillable = ['duty_date', 'shift_id', 'staff_id', 'inspector_id', 'status'];

    public function shift()
    {
        return $this->belongsTo(Shift::class);
    }

    public function staff()
    {
        return $this->belongsTo(User::class, 'staff_id');
    }

    public function inspector()
    {
        return $this->belongsTo(User::class, 'inspector_id');
    }

    public function checkin()
    {
        return $this->hasOne(DutyCheckin::class);
    }

    public function inspectionLogs()
    {
        return $this->hasMany(InspectionLog::class);
    }

    public function swaps()
    {
        return $this->hasMany(DutySwap::class);
    }
}
