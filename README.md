# ระบบบริหารจัดการเวรยามและตรวจเวรยาม - องค์การบริหารส่วนตำบลฝางคำ
**Fangkham SAO Duty & Security Patrol Management System with LINE Bot Group Integration**

ระบบดิจิทัลสำหรับบริหารจัดการตารางเวรยาม การลงเวลาปฏิบัติหน้าที่ และการตรวจเวรยามของที่ทำการ อบต.ฝางคำ อ.สิรินธร จ.อุบลราชธานี

---

## 🌟 จุดเด่นและคุณสมบัติของระบบ

1. **การแบ่งผลัดเวรตามระเบียบราชการ:**
   - **กะกลางวัน (08:30 - 16:30 น.):** ข้าราชการ/พนักงานหญิง (ปฏิบัติหน้าที่เฉพาะวันหยุดราชการและเสาร์-อาทิตย์)
   - **กะกลางคืน (16:30 - 08:30 น. วันถัดไป):** ข้าราชการ/พนักงานชาย (ปฏิบัติหน้าที่ดูแลรักษาความปลอดภัยทุกคืน)
   - **ผู้ตรวจเวร:** หัวหน้าสำนักปลัด, ผู้อำนวยการกอง หรือผู้ได้รับแต่งตั้ง ตรวจความสงบเรียบร้อยและบันทึกสมุดเวร
2. **ระบบตรวจจับพิกัด GPS Geofencing:**
   - ป้องกันการลงเวลานอกพื้นที่ โดยอนุญาตให้กดลงเวลาได้เฉพาะเมื่ออยู่ในรัศมี 150 เมตร ของที่ทำการ อบต.ฝางคำ
3. **ระบบผู้ตรวจเวรและลายเซ็นดิจิทัล:**
   - บันทึกการตรวจเวรออนไลน์ พร้อมช่องเซ็นชื่อดิจิทัล (Digital Signature) รองรับหน้าจอสัมผัสมือถือและแท็บเล็ต
4. **LINE Messaging Bot ประจำกลุ่ม:**
   - แจ้งเตือนตารางเวรเช้า (07:30 น.) และเวรค่ำ (16:00 น.) เข้ากลุ่มไลน์ อบต.ฝางคำ ด้วย Flex Message สวยงาม
   - แจ้งเตือนเข้ากลุ่มทันทีเมื่อมีผู้เข้าเวรเช็กอิน หรือเมื่อผู้ตรวจเวรลงบันทึกเสร็จสิ้น
5. **การพิมพ์คำสั่งราชการ (Print / PDF Ready):**
   - รูปแบบคำสั่ง อบต.ฝางคำ แต่งตั้งเจ้าหน้าที่อยู่เวร ตามระเบียบงานสารบรรณ สามารถสั่งพิมพ์ A4 ได้ทันที
6. **ดีไซน์ทันสมัย รองรับทุกอุปกรณ์ (Responsive):**
   - ใช้งานได้ราบรื่นทั้งบนหน้าจอสมาร์ตโฟน (เปิดผ่าน LINE LIFF ได้ทันที), แท็บเล็ต, แล็ปท็อป และจอ Kiosk

---

## 📁 โครงสร้างโปรเจกต์

```
duty-fangkham/
├── index.html            # เว็บแอปพลิเคชันหลัก (เปิดใช้งานได้ทันที)
├── app.js                # State Management, GPS Logic, Signature & LINE Bot Simulator
├── styles.css            # ตกแต่ง UI รองรับฟอนต์ Sarabun/Prompt และโหมดพิมพ์เอกสาร A4
├── README.md             # เอกสารแนะนำโปรเจกต์
├── SETUP_GUIDE_TH.md     # คู่มือการติดตั้ง Laravel และ LINE Developers แบบละเอียด
└── laravel-backend/      # ซอร์สโค้ดระบบ Backend Laravel 11
    ├── app/
    │   ├── Console/Commands/SendDutyScheduleNotification.php
    │   ├── Http/Controllers/
    │   │   ├── Api/LineWebhookController.php
    │   │   ├── DutyCheckinController.php
    │   │   ├── DutyScheduleController.php
    │   │   ├── DutySwapController.php
    │   │   └── InspectionController.php
    │   ├── Models/
    │   │   ├── DutyCheckin.php
    │   │   ├── DutySchedule.php
    │   │   ├── DutySwap.php
    │   │   ├── InspectionLog.php
    │   │   ├── LineGroup.php
    │   │   ├── Shift.php
    │   │   └── User.php
    │   └── Services/
    │       ├── DutySchedulerService.php
    │       ├── GeofenceService.php
    │       └── LineBotService.php
    ├── config/services.php
    ├── database/migrations/2026_10_01_000001_create_duty_fangkham_tables.php
    ├── routes/
    │   ├── api.php
    │   ├── console.php
    │   └── web.php
    ├── .env.example
    └── composer.json
```

---

## 🚀 เริ่มต้นใช้งาน

- **เปิดดูหน้าเว็บทันที:** ดับเบิลคลิกไฟล์ `index.html`
- **ติดตั้งระบบ Laravel บนเซิร์ฟเวอร์:** ดูขั้นตอนในไฟล์ `SETUP_GUIDE_TH.md`
