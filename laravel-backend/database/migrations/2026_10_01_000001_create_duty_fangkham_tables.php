<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 1. ตารางกลุ่มไลน์สำหรับบอทแจ้งเตือน
        Schema::create('line_groups', function (Blueprint $table) {
            $table->id();
            $table->string('group_id')->unique(); // ID กลุ่ม LINE เช่น Ca123456...
            $table->string('group_name')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 2. ตารางผู้ใช้งาน / บุคลากร อบต.ฝางคำ
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->enum('gender', ['female', 'male']); // หญิง (กะวัน) / ชาย (กะค่ำ)
            $table->string('position')->nullable(); // ตำแหน่ง
            $table->string('department')->nullable(); // สำนัก/กอง
            $table->string('phone')->nullable();
            $table->string('line_user_id')->nullable(); // LINE User ID
            $table->enum('role', ['staff', 'inspector', 'admin', 'executive'])->default('staff');
            $table->timestamps();
        });

        // 3. ตารางรอบผลัดเวร
        Schema::create('shifts', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // เวรกลางวัน (หญิง) / เวรกลางคืน (ชาย)
            $table->enum('type', ['day', 'night']);
            $table->time('start_time'); // 08:30:00 / 16:30:00
            $table->time('end_time');   // 16:30:00 / 08:30:00
            $table->enum('required_gender', ['female', 'male']);
            $table->timestamps();
        });

        // 4. ตารางเวรยามประจำวัน
        Schema::create('duty_schedules', function (Blueprint $table) {
            $table->id();
            $table->date('duty_date');
            $table->foreignId('shift_id')->constrained('shifts')->cascadeOnDelete();
            $table->foreignId('staff_id')->constrained('users')->cascadeOnDelete(); // ผู้เข้าเวร
            $table->foreignId('inspector_id')->constrained('users')->cascadeOnDelete(); // ผู้ตรวจเวร
            $table->enum('status', ['scheduled', 'on_duty', 'completed', 'swapped', 'absent'])->default('scheduled');
            $table->timestamps();

            $table->unique(['duty_date', 'shift_id']);
        });

        // 5. บันทึกการลงเวลาเข้า-ออกเวร (Check-in / Check-out)
        Schema::create('duty_checkins', function (Blueprint $table) {
            $table->id();
            $table->foreignId('duty_schedule_id')->constrained('duty_schedules')->cascadeOnDelete();
            $table->dateTime('checkin_at')->nullable();
            $table->decimal('checkin_lat', 10, 7)->nullable();
            $table->decimal('checkin_lng', 10, 7)->nullable();
            $table->string('checkin_photo_path')->nullable();
            $table->dateTime('checkout_at')->nullable();
            $table->text('incident_report')->nullable();
            $table->timestamps();
        });

        // 6. บันทึกผลการตรวจเวรยาม (Inspection Logs)
        Schema::create('inspection_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('duty_schedule_id')->constrained('duty_schedules')->cascadeOnDelete();
            $table->foreignId('inspector_id')->constrained('users')->cascadeOnDelete();
            $table->dateTime('inspected_at');
            $table->boolean('is_staff_present')->default(true);
            $table->boolean('is_normal')->default(true);
            $table->text('remark')->nullable();
            $table->text('signature_data')->nullable(); // ลายมือชื่อดิจิทัล Base64
            $table->timestamps();
        });

        // 7. คำขอสลับ/แลกเวร
        Schema::create('duty_swaps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('duty_schedule_id')->constrained('duty_schedules')->cascadeOnDelete();
            $table->foreignId('requester_id')->constrained('users');
            $table->foreignId('substitute_id')->constrained('users'); // ผู้ปฏิบัติหน้าที่แทน (ต้องเพศเดียวกัน)
            $table->text('reason')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('duty_swaps');
        Schema::dropIfExists('inspection_logs');
        Schema::dropIfExists('duty_checkins');
        Schema::dropIfExists('duty_schedules');
        Schema::dropIfExists('shifts');
        Schema::dropIfExists('users');
        Schema::dropIfExists('line_groups');
    }
};
