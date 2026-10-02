<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\DutySchedule;
use App\Models\LineGroup;
use App\Services\LineBotService;
use Carbon\Carbon;

class SendDutyScheduleNotification extends Command
{
    protected $signature = 'duty:notify {shift_type : "day" สำหรับกะกลางวัน หรือ "night" สำหรับกะกลางคืน}';
    protected $description = 'ส่ง Flex Message แจ้งเตือนเวรยามประจำผลัดเข้ากลุ่ม LINE อบต.ฝางคำ';

    public function handle(LineBotService $lineBotService)
    {
        $shiftType = $this->argument('shift_type');
        $today = Carbon::today()->toDateString();

        $schedule = DutySchedule::with(['shift', 'staff', 'inspector'])
            ->where('duty_date', $today)
            ->whereHas('shift', fn($q) => $q->where('type', $shiftType))
            ->first();

        if (!$schedule) {
            $this->warn("ไม่พบตารางเวรสำหรับผลัด {$shiftType} วันที่ {$today}");
            return Command::SUCCESS;
        }

        $activeGroups = LineGroup::where('is_active', true)->get();
        $liffUrl = config('services.line.liff_checkin_url');

        $thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
        $d = Carbon::parse($today);
        $thaiDate = $d->day . ' ' . $thaiMonths[$d->month - 1] . ' ' . ($d->year + 543);

        $sentCount = 0;
        foreach ($activeGroups as $group) {
            $ok = $lineBotService->sendDailyDutyAlert(
                $group->group_id,
                $schedule->shift->name,
                $thaiDate,
                $schedule->staff->name . " (" . ($schedule->staff->gender === 'female' ? 'หญิง' : 'ชาย') . ")",
                $schedule->inspector->name,
                $liffUrl
            );
            if ($ok) $sentCount++;
        }

        $this->info("ส่งแจ้งเตือนเวร {$shiftType} ไปยัง {$sentCount} กลุ่มเรียบร้อยแล้ว");
        return Command::SUCCESS;
    }
}
