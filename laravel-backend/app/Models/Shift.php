<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Shift extends Model
{
    protected $fillable = ['name', 'type', 'start_time', 'end_time', 'required_gender'];

    public function dutySchedules()
    {
        return $this->hasMany(DutySchedule::class);
    }
}
