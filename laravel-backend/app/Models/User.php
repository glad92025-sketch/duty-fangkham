<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name', 'email', 'password', 'gender', 'position', 'department', 'phone', 'line_user_id', 'role'
    ];

    protected $hidden = [
        'password', 'remember_token',
    ];

    public function dutySchedules()
    {
        return $this->hasMany(DutySchedule::class, 'staff_id');
    }

    public function inspectionSchedules()
    {
        return $this->hasMany(DutySchedule::class, 'inspector_id');
    }
}
