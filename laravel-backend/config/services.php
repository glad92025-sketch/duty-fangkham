<?php

return [
    'line' => [
        'channel_id' => env('LINE_CHANNEL_ID'),
        'channel_secret' => env('LINE_CHANNEL_SECRET'),
        'channel_token' => env('LINE_CHANNEL_ACCESS_TOKEN'),
        'liff_checkin_url' => env('LINE_LIFF_CHECKIN_URL', 'https://liff.line.me/example'),
    ],

    'fangkham' => [
        'lat' => env('FANGKHAM_SAO_LAT', 15.22850),
        'lng' => env('FANGKHAM_SAO_LNG', 104.38710),
        'radius_meters' => env('FANGKHAM_GEOFENCE_METERS', 150),
    ],
];
