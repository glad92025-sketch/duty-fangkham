<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\LineGroup;
use Illuminate\Support\Facades\Log;

class LineWebhookController extends Controller
{
    public function handle(Request $request)
    {
        $events = $request->input('events', []);

        foreach ($events as $event) {
            $type = $event['type'] ?? null;
            $source = $event['source'] ?? [];

            // เมื่อบอทถูกเชิญเข้าสู่ LINE Group
            if ($type === 'join' && ($source['type'] ?? '') === 'group') {
                $groupId = $source['groupId'];
                LineGroup::firstOrCreate(
                    ['group_id' => $groupId],
                    ['group_name' => 'กลุ่มงานเวรยาม อบต.ฝางคำ', 'is_active' => true]
                );
                Log::info("Bot joined LINE group: {$groupId}");
            }
        }

        return response()->json(['status' => 'success']);
    }
}
