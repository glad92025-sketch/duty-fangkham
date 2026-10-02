<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\LineWebhookController;
use App\Http\Controllers\DutyScheduleController;
use App\Http\Controllers\DutyCheckinController;
use App\Http\Controllers\InspectionController;
use App\Http\Controllers\DutySwapController;

// Webhook สำหรับ LINE Messaging API Bot
Route::post('/line/webhook', [LineWebhookController::class, 'handle']);

// API ตารางเวรและการลงเวลา
Route::get('/schedules', [DutyScheduleController::class, 'index']);
Route::post('/schedules/generate', [DutyScheduleController::class, 'generate']);
Route::post('/checkin', [DutyCheckinController::class, 'store']);
Route::post('/inspections', [InspectionController::class, 'store']);
Route::post('/swaps', [DutySwapController::class, 'store']);
