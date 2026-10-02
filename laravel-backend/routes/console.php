<?php

use Illuminate\Support\Facades\Schedule;

// 1. แจ้งเตือนเวรกลางวัน (หญิง) ทุกวัน เวลา 07:30 น.
Schedule::command('duty:notify day')->dailyAt('07:30');

// 2. แจ้งเตือนเวรกลางคืน (ชาย) ทุกวัน เวลา 16:00 น.
Schedule::command('duty:notify night')->dailyAt('16:00');
