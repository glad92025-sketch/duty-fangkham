<?php

namespace App\Services;

use App\Models\User;
use App\Models\Shift;
use App\Models\DutySchedule;
use Carbon\Carbon;
use Carbon\CarbonPeriod;

class DutySchedulerService
{
    /**
     * สร้างตารางเวรประจำเดือน อบต.ฝางคำ
     * กฎ: กะกลางวัน = หญิง (เฉพาะวันหยุด) / กะกลางคืน = ชาย (ทุกวัน)
     */
    public function generateMonthlySchedule(int $year, int $month): int
    {
        $femaleStaff = User::where('gender', 'female')->where('role', 'staff')->get();
        $maleStaff = User::where('gender', 'male')->where('role', 'staff')->get();
        $inspectors = User::where('role', 'inspector')->get();

        if ($femaleStaff->isEmpty() || $maleStaff->isEmpty() || $inspectors->isEmpty()) {
            return 0;
        }

        $dayShift = Shift::where('type', 'day')->firstOrCreate(
            ['type' => 'day'],
            ['name' => 'เวรกลางวัน', 'start_time' => '08:30:00', 'end_time' => '16:30:00', 'required_gender' => 'female']
        );

        $nightShift = Shift::where('type', 'night')->firstOrCreate(
            ['type' => 'night'],
            ['name' => 'เวรกลางคืน', 'start_time' => '16:30:00', 'end_time' => '08:30:00', 'required_gender' => 'male']
        );

        $daysInMonth = Carbon::createFromDate($year, $month, 1)->daysInMonth;
        $period = CarbonPeriod::create("{$year}-{$month}-01", "{$year}-{$month}-{$daysInMonth}");

        $femaleIdx = 0;
        $maleIdx = 0;
        $inspectorIdx = 0;
        $count = 0;

        foreach ($period as $date) {
            $dateStr = $date->toDateString();

            // 1. เวรกลางวัน (หญิง) - วันเสาร์ อาทิตย์ หรือวันหยุด
            if ($date->isWeekend()) {
                DutySchedule::updateOrCreate(
                    ['duty_date' => $dateStr, 'shift_id' => $dayShift->id],
                    [
                        'staff_id' => $femaleStaff[$femaleIdx % $femaleStaff->count()]->id,
                        'inspector_id' => $inspectors[$inspectorIdx % $inspectors->count()]->id,
                        'status' => 'scheduled'
                    ]
                );
                $femaleIdx++;
                $count++;
            }

            // 2. เวรกลางคืน (ชาย) - ทุกวัน
            DutySchedule::updateOrCreate(
                ['duty_date' => $dateStr, 'shift_id' => $nightShift->id],
                [
                    'staff_id' => $maleStaff[$maleIdx % $maleStaff->count()]->id,
                    'inspector_id' => $inspectors[$inspectorIdx % $inspectors->count()]->id,
                    'status' => 'scheduled'
                ]
            );
            $maleIdx++;
            $inspectorIdx++;
            $count++;
        }

        return $count;
    }
}
