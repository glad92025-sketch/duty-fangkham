<?php

namespace App\Services;

class GeofenceService
{
    /**
     * คำนวณระยะทาง Haversine ตรวจสอบพิกัด อบต.ฝางคำ รัศมี 150 เมตร
     */
    public static function isWithinFangkhamSAO(float $userLat, float $userLng): array
    {
        $saoLat = (float) config('services.fangkham.lat', 15.22850);
        $saoLng = (float) config('services.fangkham.lng', 104.38710);
        $maxMeters = (int) config('services.fangkham.radius_meters', 150);

        $earthRadius = 6371000; // รัศมีโลกหน่วยเมตร

        $dLat = deg2rad($userLat - $saoLat);
        $dLng = deg2rad($userLng - $saoLng);

        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($saoLat)) * cos(deg2rad($userLat)) *
             sin($dLng / 2) * sin($dLng / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        $distance = round($earthRadius * $c);

        return [
            'is_within' => $distance <= $maxMeters,
            'distance_meters' => $distance,
            'max_allowed_meters' => $maxMeters
        ];
    }
}
