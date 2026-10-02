<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\DutySchedule;
use App\Models\InspectionLog;
use Carbon\Carbon;

class InspectionController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'duty_schedule_id' => 'required|exists:duty_schedules,id',
            'inspector_id' => 'required|exists:users,id',
            'is_staff_present' => 'required|boolean',
            'is_normal' => 'required|boolean',
            'remark' => 'nullable|string',
            'signature_data' => 'nullable|string'
        ]);

        $log = InspectionLog::create([
            'duty_schedule_id' => $request->duty_schedule_id,
            'inspector_id' => $request->inspector_id,
            'inspected_at' => Carbon::now(),
            'is_staff_present' => $request->is_staff_present,
            'is_normal' => $request->is_normal,
            'remark' => $request->remark,
            'signature_data' => $request->signature_data
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'บันทึกการตรวจเวรยามเรียบร้อยแล้ว',
            'data' => $log
        ]);
    }
}
