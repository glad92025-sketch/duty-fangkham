<?php

namespace App\Services;

use LINE\Clients\MessagingApi\Model\PushMessageRequest;
use LINE\Clients\MessagingApi\Model\FlexMessage;
use LINE\Clients\MessagingApi\Model\FlexContainer;
use LINE\Clients\MessagingApi\Api\MessagingApiApi;
use GuzzleHttp\Client;
use LINE\Clients\MessagingApi\Configuration;
use Illuminate\Support\Facades\Log;

class LineBotService
{
    protected $messagingApi;

    public function __construct()
    {
        $token = config('services.line.channel_token');
        if ($token) {
            $config = new Configuration();
            $config->setAccessToken($token);
            $this->messagingApi = new MessagingApiApi(new Client(), $config);
        }
    }

    /**
     * ส่ง Flex Message แจ้งเตือนเวรประจำวันเข้ากลุ่ม LINE อบต.ฝางคำ
     */
    public function sendDailyDutyAlert(string $groupId, string $shiftName, string $dutyDate, string $staffName, string $inspectorName, string $liffUrl): bool
    {
        if (!$this->messagingApi) {
            Log::warning("LINE Channel Access Token is not configured.");
            return false;
        }

        $isDay = ($shiftName === 'เวรกลางวัน');
        $headerColor = $isDay ? "#F59E0B" : "#0F172A";

        $jsonFlex = [
            "type" => "bubble",
            "header" => [
                "type" => "box",
                "layout" => "vertical",
                "backgroundColor" => $headerColor,
                "contents" => [
                    [
                        "type" => "text",
                        "text" => "📢 แจ้งเตือน{$shiftName}",
                        "color" => "#FFFFFF",
                        "weight" => "bold",
                        "size" => "lg"
                    ],
                    [
                        "type" => "text",
                        "text" => "ที่ทำการ อบต.ฝางคำ ประจำวันที่ {$dutyDate}",
                        "color" => "#E2E8F0",
                        "size" => "xs",
                        "margin" => "xs"
                    ]
                ]
            ],
            "body" => [
                "type" => "box",
                "layout" => "vertical",
                "contents" => [
                    [
                        "type" => "box",
                        "layout" => "horizontal",
                        "contents" => [
                            ["type" => "text", "text" => "👮 ผู้เข้าเวร:", "size" => "sm", "color" => "#64748B", "flex" => 3],
                            ["type" => "text", "text" => $staffName, "size" => "sm", "weight" => "bold", "color" => "#0F172A", "flex" => 5]
                        ]
                    ],
                    [
                        "type" => "box",
                        "layout" => "horizontal",
                        "margin" => "md",
                        "contents" => [
                            ["type" => "text", "text" => "🔍 ผู้ตรวจเวร:", "size" => "sm", "color" => "#64748B", "flex" => 3],
                            ["type" => "text", "text" => $inspectorName, "size" => "sm", "weight" => "bold", "color" => "#0F172A", "flex" => 5]
                        ]
                    ]
                ]
            ],
            "footer" => [
                "type" => "box",
                "layout" => "vertical",
                "contents" => [
                    [
                        "type" => "button",
                        "action" => [
                            "type" => "uri",
                            "label" => "📍 ลงเวลาเข้าเวร (LIFF)",
                            "uri" => $liffUrl
                        ],
                        "style" => "primary",
                        "color" => "#10B981"
                    ]
                ]
            ]
        ];

        try {
            $flexContainer = FlexContainer::fromJson(json_encode($jsonFlex));
            $message = new FlexMessage([
                'altText' => "แจ้งเตือน{$shiftName} อบต.ฝางคำ ({$dutyDate})",
                'contents' => $flexContainer
            ]);

            $request = new PushMessageRequest([
                'to' => $groupId,
                'messages' => [$message]
            ]);

            $this->messagingApi->pushMessage($request);
            return true;
        } catch (\Exception $e) {
            Log::error("LineBotService error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * ส่งการแจ้งเตือนเมื่อลงเวลาเข้าเวรสำเร็จ
     */
    public function notifyCheckinSuccess(string $groupId, string $staffName, string $shiftName, string $timeStr): bool
    {
        if (!$this->messagingApi) return false;

        $jsonFlex = [
            "type" => "bubble",
            "body" => [
                "type" => "box",
                "layout" => "vertical",
                "contents" => [
                    ["type" => "text", "text" => "✅ เข้าเวรปฏิบัติหน้าที่เรียบร้อย", "weight" => "bold", "color" => "#10B981", "size" => "md"],
                    ["type" => "text", "text" => "เจ้าหน้าที่: {$staffName}\nรอบเวร: {$shiftName}\nเวลา: {$timeStr} น. ณ อบต.ฝางคำ", "size" => "sm", "color" => "#334155", "margin" => "sm", "wrap" => true]
                ]
            ]
        ];

        try {
            $flexContainer = FlexContainer::fromJson(json_encode($jsonFlex));
            $message = new FlexMessage(['altText' => "{$staffName} ลงเวลาเข้าเวรแล้ว", 'contents' => $flexContainer]);
            $this->messagingApi->pushMessage(new PushMessageRequest(['to' => $groupId, 'messages' => [$message]]));
            return true;
        } catch (\Exception $e) {
            Log::error("LineBot notifyCheckin error: " . $e->getMessage());
            return false;
        }
    }
}
