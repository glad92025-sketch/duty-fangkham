<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\DutySchedule;
use App\Models\DutySwap;

class DutySwapController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'duty_schedule_id' => 'required|exists:duty_schedules,id',
            'requester_id' => 'required|exists:users,id',
            'substitute_id' => 'required|exists:users,id',
            'reason' => 'required|string'
        ]);

        $requester = User::findOrFail($request->requester_id);
        $substitute = User::findOrFail($request->substitute_id);

        // ตรวจสอบเงื่อนไขเพศตามระเบียบ อบต.ฝางคำ
        if ($requester->gender !== $substitute->gender) {
            return response()->json([
                'status' => 'error',
                'message' => 'ไม่สามารถขอสลับเวรได้ เนื่องจากผู้ปฏิบัติหน้าที่แทนต้องเป็นเพศเดียวกันตามข้อกำหนดกะเวร (หญิง-กะกลางวัน, ชาย-กะกลางคืน)'
            ], 422);
        }

        $swap = DutySwap::create([
            'duty_schedule_id' => $request->duty_schedule_id,
            'requester_id' => $request->requester_id,
            'substitute_id' => $request->substitute_id,
            'reason' => $request->reason,
            'status' => 'pending'
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'ยื่นคำขอสลับเวรเรียบร้อย รอการอนุมัติจากหัวหน้าสำนักปลัด',
            'data' => $swap
        ]);
    }
}
