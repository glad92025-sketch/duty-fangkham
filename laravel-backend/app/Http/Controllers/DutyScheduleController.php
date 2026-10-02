<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\DutySchedule;
use App\Services\DutySchedulerService;
use Carbon\Carbon;

class DutyScheduleController extends Controller
{
    public function index(Request $request)
    {
        $month = $request->input('month', Carbon::now()->month);
        $year = $request->input('year', Carbon::now()->year);

        $schedules = DutySchedule::with(['shift', 'staff', 'inspector'])
            ->whereYear('duty_date', $year)
            ->whereMonth('duty_date', $month)
            ->orderBy('duty_date')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $schedules
        ]);
    }

    public function generate(Request $request, DutySchedulerService $scheduler)
    {
        $month = (int) $request->input('month', Carbon::now()->month);
        $year = (int) $request->input('year', Carbon::now()->year);

        $count = $scheduler->generateMonthlySchedule($year, $month);

        return response()->json([
            'status' => 'success',
            'message' => "สร้างตารางเวรประจำเดือนเรียบร้อย จำนวน {$count} รายการ"
        ]);
    }
}
