<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LineGroup extends Model
{
    protected $fillable = ['group_id', 'group_name', 'is_active'];
}
