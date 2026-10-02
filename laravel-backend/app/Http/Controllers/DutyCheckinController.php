<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\DutySchedule;
use App\Models\DutyCheckin;
use App\Models\LineGroup;
use App\Services\GeofenceService;
use App\Services\LineBotService;
use Carbon\Carbon;

class DutyCheckinController extends Controller
{
    public function store(Request $request, LineBotService $lineBot)
    {
        $request->validate([
            'duty_schedule_id' => 'required|exists:duty_schedules,id',
            'lat' => 'required|numeric',
            'lng' => 'required|numeric',
            'photo' => 'nullable|string',
            'incident_report' => 'nullable|string'
        ]);

        // 1. ตรวจสอบ Geofence 150 ม. จาก อบต.ฝางคำ
        $geo = GeofenceService::isWithinFangkhamSAO((float)$request->lat, (float)$request->lng);
        if (!$geo['is_within']) {
            return response()->json([
                'status' => 'error',
                'message' => "ท่านอยู่นอกพื้นที่ที่ทำการ อบต.ฝางคำ (ระยะห่าง {$geo['distance_meters']} เมตร เกินกว่า {$geo['max_allowed_meters']} เมตร)"
            ], 422);
        }

        $schedule = DutySchedule::with(['shift', 'staff'])->findOrFail($request->duty_schedule_id);

        $checkin = DutyCheckin::updateOrCreate(
            ['duty_schedule_id' => $schedule->id],
            [
                'checkin_at' => Carbon::now(),
                'checkin_lat' => $request->lat,
                'checkin_lng' => $request->lng,
                'checkin_photo_path' => $request->photo,
                'incident_report' => $request->incident_report ?? 'เหตุการณ์ทั่วไปปกติ'
            ]
        );

        $schedule->update(['status' => 'on_duty']);

        // ส่งแจ้งเตือนเข้ากลุ่ม LINE
        $activeGroups = LineGroup::where('is_active', true)->get();
        foreach ($activeGroups as $group) {
            $lineBot->notifyCheckinSuccess(
                $group->group_id,
                $schedule->staff->name,
                $schedule->shift->name,
                Carbon::now()->format('H:i')
            );
        }

        return response()->json([
            'status' => 'success',
            'message' => 'ลงเวลาเข้าเวรเรียบร้อยและแจ้งเตือนเข้ากลุ่ม LINE แล้ว',
            'data' => $checkin
        ]);
    }
}
