# คู่มือการติดตั้งและใช้งานระบบเวรยาม อบต.ฝางคำ
**ระบบบริหารจัดการเวรยามและตรวจเวรยาม พร้อม LINE Messaging Bot ประจำกลุ่มงาน**

---

## ⚡ วิธีทดลองใช้งานหน้าเว็บทันที (ไม่ต้องติดตั้งโปรแกรม)

1. เข้าไปที่โฟลเดอร์ `duty-fangkham` บนหน้า Desktop ของคุณ
2. ดับเบิลคลิกเปิดไฟล์ `index.html` บนเว็บเบราว์เซอร์ (Google Chrome, Microsoft Edge)
3. ระบบจะทำงานเต็มรูปแบบแบบ Responsive ทันที:
   - **ภาพรวม & จอเวร:** ตรวจสอบเวรวันนี้ (หญิง-กลางวัน, ชาย-กลางคืน)
   - **ปฏิทินตารางเวร:** ดูรอบเวรประจำเดือน
   - **ลงเวลาเข้าเวร (LIFF):** ทดสอบปุ่มจำลองพิกัด "ใน อบต." และ "นอกเขต" เพื่อดูระบบ Geofence ป้องกันการลงเวลานอกพื้นที่
   - **สมุดตรวจเวรยาม:** ผู้ตรวจเวรสามารถใช้นิ้วมือหรือเมาส์เซ็นลายมือชื่อดิจิทัลได้ทันที
   - **จำลองกลุ่ม LINE:** กดปุ่ม **"ทดสอบบอทกะค่ำ"** หรือปุ่มส่งแจ้งเตือน เพื่อดูข้อความ Flex Message เสมือนจริงในห้องแชต LINE
   - **พิมพ์คำสั่งราชการ:** กดปุ่ม "พิมพ์คำสั่ง" หรือ Ctrl+P เพื่อพิมพ์เอกสารคำสั่งเวรยามตามแบบฟอร์มระเบียบงานสารบรรณ

---

## 🛠️ ขั้นตอนการติดตั้งระบบหลังบ้าน Laravel บน Server / เครื่องคอมพิวเตอร์

### 1. ติดตั้งเครื่องมือพื้นฐาน
- ติดตั้ง **PHP 8.2+** และ **Composer** (แนะนำใช้โปรแกรม **Laragon** หรือ **XAMPP**)
- ติดตั้ง **MySQL** หรือ **MariaDB**

### 2. ติดตั้ง Dependencies ของโปรเจกต์
เปิด Terminal / PowerShell ในโฟลเดอร์ `laravel-backend`:
```bash
cd "C:\Users\Windows 10\Desktop\duty-fangkham\laravel-backend"
composer install
```

### 3. ตั้งค่าสภาพแวดล้อม (.env)
คัดลอกไฟล์ `.env.example` เป็น `.env`:
```bash
copy .env.example .env
php artisan key:generate
```

แก้ไขข้อมูลในไฟล์ `.env`:
```ini
DB_DATABASE=duty_fangkham
DB_USERNAME=root
DB_PASSWORD=

# ข้อมูล LINE Messaging API
LINE_CHANNEL_ID="ใส่ Channel ID จาก LINE Developers"
LINE_CHANNEL_SECRET="ใส่ Channel Secret"
LINE_CHANNEL_ACCESS_TOKEN="ใส่ Channel Access Token (Long-lived)"
LINE_LIFF_CHECKIN_URL="https://liff.line.me/xxxxxx-xxxxxx"

# พิกัดที่ทำการ อบต.ฝางคำ (ละติจูด, ลองจิจูด และรัศมีเมตร)
FANGKHAM_SAO_LAT=15.2285000
FANGKHAM_SAO_LNG=104.3871000
FANGKHAM_GEOFENCE_METERS=150
```

### 4. สั่งสร้างตารางฐานข้อมูล (Migrate)
```bash
php artisan migrate
```

### 5. เริ่มรันเซิร์ฟเวอร์
```bash
php artisan serve
```
ระบบจะรันอยู่ที่ `http://127.0.0.1:8000`

---

## 🤖 ขั้นตอนการตั้งค่า LINE Official Account & LINE Bot ประจำกลุ่ม

1. **เข้าสู่ LINE Developers Console:**
   - เข้าเว็บ [https://developers.line.biz/](https://developers.line.biz/) ล็อกอินด้วย LINE ของคุณ
   - สร้าง **Provider** เช่น `อบต.ฝางคำ`
   - สร้าง Channel ประเภท **Messaging API**

2. **เปิดสิทธิ์ให้บอทเข้ากลุ่ม LINE ได้:**
   - ไปที่แท็บ **Messaging API**
   - เลื่อนลงมาที่หัวข้อ **LINE Official Account features**
   - คลิกแก้ไขที่ **Allow bot to join group chats** -> เลือก **Enabled**
   - ที่ **Auto-reply messages** -> เลือก **Disabled** (เพื่อไม่ให้บอทตอบคำสุ่มในกลุ่ม)

3. **ตั้งค่า Webhook URL:**
   - นำ Domain ของเซิร์ฟเวอร์ (ต้องเป็น HTTPS) เช่น `https://yourdomain.go.th/api/line/webhook` ไปใส่ในช่อง **Webhook URL**
   - กดปุ่ม **Verify** และเปิดสวิตช์ **Use webhook**

4. **สร้าง LIFF App สำหรับการลงเวลาเข้าเวร:**
   - ใน LINE Developers ให้สร้าง Channel ประเภท **LIFF**
   - ตั้งค่า **Endpoint URL** ชี้ไปที่หน้าลงเวลา: `https://yourdomain.go.th/`
   - คัดลอก `LIFF URL` นำมาใส่ใน `.env`

5. **เชิญบอทเข้ากลุ่ม LINE อบต.ฝางคำ:**
   - เพิ่มเพื่อน LINE Bot ของ อบต.ฝางคำ
   - เชิญ LINE Bot เข้ากลุ่มงาน อบต.ฝางคำ
   - เมื่อบอทเข้าร่วมกลุ่ม ระบบ Laravel จะจับคู่ Group ID ให้อัตโนมัติ พร้อมส่ง Flex Message แจ้งเตือนเวรทุกวัน!

---

## ⏰ คำสั่งตั้งเวลาอัตโนมัติ (Task Scheduling)
สามารถตั้ง Task Scheduler ใน Windows หรือ Cron Job ใน Linux:
```bash
* * * * * cd /path/to/laravel-backend && php artisan schedule:run >> /dev/null 2>&1
```
- **07:30 น.** ส่งแจ้งเตือนเวรกลางวัน (หญิง)
- **16:00 น.** ส่งแจ้งเตือนเวรกลางคืน (ชาย)
