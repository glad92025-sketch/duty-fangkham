// =========================================================================
// ระบบบริหารจัดการเวรยาม อบต.ฝางคำ (Smart Duty & Inspection System)
// เวอร์ชั่น: 3.5 (Gov Tech 2026)
// ฟีเจอร์: เข้าสู่ระบบ Username/Password, เปลี่ยนรหัสผ่าน, แนบไฟล์คำสั่ง PDF,
//         LINE Messaging API Bot, Geofencing, ลงนามดิจิทัล, พิมพ์คำสั่งราชการ
// =========================================================================

const FANGKHAM_COORDS = { lat: 15.22850, lng: 104.38710 }; // พิกัด ที่ทำการ อบต.ฝางคำ อ.สิรินธร จ.อุบลราชธานี
const GEOFENCE_RADIUS = 150; // เมตร

// -------------------------------------------------------------
// ระบบจัดเก็บรหัสผ่าน (LocalStorage)
// -------------------------------------------------------------
function getSavedPasswords() {
    try {
        const saved = localStorage.getItem('fangkham_passwords_v1');
        return saved ? JSON.parse(saved) : {};
    } catch(e) {
        return {};
    }
}

function savePasswordForUser(username, newPass) {
    const saved = getSavedPasswords();
    saved[username.toLowerCase()] = newPass;
    localStorage.setItem('fangkham_passwords_v1', JSON.stringify(saved));
}

function getUserCurrentPassword(user) {
    const saved = getSavedPasswords();
    if (saved[user.username.toLowerCase()]) {
        return saved[user.username.toLowerCase()];
    }
    return user.defaultPass;
}

// -------------------------------------------------------------
// บัญชีผู้ใช้งานระบบ อบต.ฝางคำ ทั้งหมด 30 ท่าน (อ้างอิงคำสั่ง ต.ค. 2569)
// -------------------------------------------------------------
const ALL_SYSTEM_USERS = [
    // 1. ผู้ดูแลระบบ & ผู้บริหาร
    { id: 'admin', username: 'admin', defaultPass: '1234', name: 'นายชาญชัย อักโข (ผู้ดูแลระบบ/หน.สำนักปลัด)', role: 'admin', roleName: 'ผู้ดูแลระบบ (Admin)', category: 'admin', dept: 'สำนักปลัด อบต.ฝางคำ', gender: 'male', dutyDays: 'จัดการระบบ / ตรวจเวร', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80', badge: 'bg-purple-100 text-purple-800 border-purple-200' },
    { id: 'exec', username: 'palad', defaultPass: '1234', name: 'ปลัด อบต.ฝางคำ (ผู้บริหาร)', role: 'executive', roleName: 'ผู้บริหาร (Executive)', category: 'admin', dept: 'ผู้บริหาร อบต.ฝางคำ', gender: 'male', dutyDays: 'อนุมัติคำสั่งราชการ', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=120&q=80', badge: 'bg-rose-100 text-rose-800 border-rose-200' },

    // 2. ผู้ตรวจเวรยาม (4 ท่าน)
    { id: 'insp_1', username: 'chanchai', defaultPass: '1234', name: 'นายชาญชัย อักโข', role: 'inspector', roleName: 'ผู้ตรวจเวร (กะกลางคืน)', category: 'inspector', dept: 'สำนักปลัด', gender: 'male', dutyDays: 'ตรวจเวรวันที่ 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31 ต.ค.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80', badge: 'bg-blue-100 text-blue-800 border-blue-200' },
    { id: 'insp_2', username: 'wuttisak', defaultPass: '1234', name: 'นายวุฒิศักดิ์ บุตรสิงห์', role: 'inspector', roleName: 'ผู้ตรวจเวร (กะกลางคืน)', category: 'inspector', dept: 'กองช่าง', gender: 'male', dutyDays: 'ตรวจเวรวันที่ 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30 ต.ค. (คืนนี้!)', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80', badge: 'bg-blue-100 text-blue-800 border-blue-200' },
    { id: 'insp_3', username: 'vasana', defaultPass: '1234', name: 'นางวาสนา สินทรัพย์', role: 'inspector', roleName: 'ผู้ตรวจเวร (กะกลางวัน)', category: 'inspector', dept: 'กองคลัง', gender: 'female', dutyDays: 'ตรวจเวรวันที่ 3, 5, 10, 13, 17, 23, 31 ต.ค.', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80', badge: 'bg-blue-100 text-blue-800 border-blue-200' },
    { id: 'insp_4', username: 'arunrat', defaultPass: '1234', name: 'นางอรุณรัตน์ บุญกอ', role: 'inspector', roleName: 'ผู้ตรวจเวร (กะกลางวัน)', category: 'inspector', dept: 'กองการศึกษา', gender: 'female', dutyDays: 'ตรวจเวรวันที่ 4, 11, 18, 24 ต.ค.', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&q=80', badge: 'bg-blue-100 text-blue-800 border-blue-200' },

    // 3. ผู้อยู่เวรยามกะกลางคืน (ชาย - 14 ท่าน)
    { id: 'night_1', username: 'manit', defaultPass: '1234', name: 'จ.ส.ท.มานิต ทองดวง', role: 'staff', roleName: 'ผู้อยู่เวรยาม (กะกลางคืน)', category: 'night', dept: 'สำนักปลัด', gender: 'male', dutyDays: 'วันที่ 1, 15, 29 ต.ค.', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80', badge: 'bg-slate-900 text-white' },
    { id: 'night_2', username: 'kiattiphon', defaultPass: '1234', name: 'จ.ส.อ.เกียรติพล หาทรัพย์', role: 'staff', roleName: 'ผู้อยู่เวรยาม (กะกลางคืน)', category: 'night', dept: 'กองช่าง', gender: 'male', dutyDays: 'วันที่ 2, 16, 30 ต.ค. (เวรคืนนี้ 2 ต.ค.!)', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=120&q=80', badge: 'bg-emerald-600 text-white' },
    { id: 'night_3', username: 'singha', defaultPass: '1234', name: 'นายสิงหา ชุมชัย', role: 'staff', roleName: 'ผู้อยู่เวรยาม (กะกลางคืน)', category: 'night', dept: 'สำนักปลัด', gender: 'male', dutyDays: 'วันที่ 3, 17, 31 ต.ค.', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=120&q=80', badge: 'bg-slate-900 text-white' },
    { id: 'night_4', username: 'thosapol', defaultPass: '1234', name: 'นายทศพล โลมรัตน์', role: 'staff', roleName: 'ผู้อยู่เวรยาม (กะกลางคืน)', category: 'night', dept: 'กองช่าง', gender: 'male', dutyDays: 'วันที่ 4, 18 ต.ค.', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=120&q=80', badge: 'bg-slate-900 text-white' },
    { id: 'night_5', username: 'veerawat', defaultPass: '1234', name: 'นายวีระวัฒน์ จันทรคล', role: 'staff', roleName: 'ผู้อยู่เวรยาม (กะกลางคืน)', category: 'night', dept: 'สำนักปลัด', gender: 'male', dutyDays: 'วันที่ 5, 19 ต.ค.', avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=120&q=80', badge: 'bg-slate-900 text-white' },
    { id: 'night_6', username: 'kiattisak', defaultPass: '1234', name: 'จ่าเอกเกียรติศักดิ์ เพ็ญเนตร', role: 'staff', roleName: 'ผู้อยู่เวรยาม (กะกลางคืน)', category: 'night', dept: 'สำนักปลัด', gender: 'male', dutyDays: 'วันที่ 6, 20 ต.ค.', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80', badge: 'bg-slate-900 text-white' },
    { id: 'night_7', username: 'suphamongkol', defaultPass: '1234', name: 'นายศุภมงคล ธรรมพิทักษ์', role: 'staff', roleName: 'ผู้อยู่เวรยาม (กะกลางคืน)', category: 'night', dept: 'กองช่าง', gender: 'male', dutyDays: 'วันที่ 7, 21 ต.ค.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80', badge: 'bg-slate-900 text-white' },
    { id: 'night_8', username: 'anuchit', defaultPass: '1234', name: 'นายอนุชิต ดวงเนตร', role: 'staff', roleName: 'ผู้อยู่เวรยาม (กะกลางคืน)', category: 'night', dept: 'กองคลัง', gender: 'male', dutyDays: 'วันที่ 8, 22 ต.ค.', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80', badge: 'bg-slate-900 text-white' },
    { id: 'night_9', username: 'autthachai', defaultPass: '1234', name: 'นายอรรถชัย สุทธิรัตน์', role: 'staff', roleName: 'ผู้อยู่เวรยาม (กะกลางคืน)', category: 'night', dept: 'สำนักปลัด', gender: 'male', dutyDays: 'วันที่ 9, 23 ต.ค.', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80', badge: 'bg-slate-900 text-white' },
    { id: 'night_10', username: 'wuttichart', defaultPass: '1234', name: 'นายวุฒิชาติ เชื้อโชติ', role: 'staff', roleName: 'ผู้อยู่เวรยาม (กะกลางคืน)', category: 'night', dept: 'กองช่าง', gender: 'male', dutyDays: 'วันที่ 10, 24 ต.ค.', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=120&q=80', badge: 'bg-slate-900 text-white' },
    { id: 'night_11', username: 'klahan', defaultPass: '1234', name: 'นายกล้าหาญ พรพรม', role: 'staff', roleName: 'ผู้อยู่เวรยาม (กะกลางคืน)', category: 'night', dept: 'สำนักปลัด', gender: 'male', dutyDays: 'วันที่ 11, 25 ต.ค.', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80', badge: 'bg-slate-900 text-white' },
    { id: 'night_12', username: 'chaisit', defaultPass: '1234', name: 'นายชัยสิทธิ์ วงษ์วิชัย', role: 'staff', roleName: 'ผู้อยู่เวรยาม (กะกลางคืน)', category: 'night', dept: 'กองช่าง', gender: 'male', dutyDays: 'วันที่ 12, 26 ต.ค.', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=120&q=80', badge: 'bg-slate-900 text-white' },
    { id: 'night_13', username: 'wittaya', defaultPass: '1234', name: 'นายวิทยา ฝางคำ', role: 'staff', roleName: 'ผู้อยู่เวรยาม (กะกลางคืน)', category: 'night', dept: 'สำนักปลัด', gender: 'male', dutyDays: 'วันที่ 13, 27 ต.ค.', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=120&q=80', badge: 'bg-slate-900 text-white' },
    { id: 'night_14', username: 'wattrajira', defaultPass: '1234', name: 'นายวัตรจิระ ใสขาว', role: 'staff', roleName: 'ผู้อยู่เวรยาม (กะกลางคืน)', category: 'night', dept: 'กองช่าง', gender: 'male', dutyDays: 'วันที่ 14, 28 ต.ค.', avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=120&q=80', badge: 'bg-slate-900 text-white' },

    // 4. ผู้อยู่เวรยามกะกลางวัน (หญิง - 11 ท่าน)
    { id: 'day_1', username: 'amporn', defaultPass: '1234', name: 'นางสาวอำพร ทองสวัสดิ์', role: 'staff', roleName: 'ผู้อยู่เวรยาม (กะกลางวัน)', category: 'day', dept: 'กองคลัง', gender: 'female', dutyDays: 'วันที่ 3, 17, 31 ต.ค. (เวรเสาร์ 3 ต.ค.!)', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80', badge: 'bg-amber-100 text-amber-900' },
    { id: 'day_2', username: 'thidalak', defaultPass: '1234', name: 'นางสาวธิดาลักษณ์ โสแก้ว', role: 'staff', roleName: 'ผู้อยู่เวรยาม (กะกลางวัน)', category: 'day', dept: 'สำนักปลัด', gender: 'female', dutyDays: 'วันที่ 3, 17, 31 ต.ค. (เวรเสาร์ 3 ต.ค.!)', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80', badge: 'bg-amber-100 text-amber-900' },
    { id: 'day_3', username: 'tongtaprapha', defaultPass: '1234', name: 'นางต้องตาประภา โพธิ์งาม', role: 'staff', roleName: 'ผู้อยู่เวรยาม (กะกลางวัน)', category: 'day', dept: 'กองสวัสดิการสังคม', gender: 'female', dutyDays: 'วันที่ 3, 17, 31 ต.ค. (เวรเสาร์ 3 ต.ค.!)', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80', badge: 'bg-amber-100 text-amber-900' },
    { id: 'day_4', username: 'beena', defaultPass: '1234', name: 'นางสาวบีนา เหล็กกล้า', role: 'staff', roleName: 'ผู้อยู่เวรยาม (กะกลางวัน)', category: 'day', dept: 'กองคลัง', gender: 'female', dutyDays: 'วันที่ 4, 18 ต.ค.', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&q=80', badge: 'bg-amber-100 text-amber-900' },
    { id: 'day_5', username: 'paphada', defaultPass: '1234', name: 'นางสาวปภาดา ประดับ', role: 'staff', roleName: 'ผู้อยู่เวรยาม (กะกลางวัน)', category: 'day', dept: 'สำนักปลัด', gender: 'female', dutyDays: 'วันที่ 4, 18 ต.ค.', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80', badge: 'bg-amber-100 text-amber-900' },
    { id: 'day_6', username: 'phakapha', defaultPass: '1234', name: 'นางสาวผกาพา มณีจันทร์', role: 'staff', roleName: 'ผู้อยู่เวรยาม (กะกลางวัน)', category: 'day', dept: 'กองการศึกษา', gender: 'female', dutyDays: 'วันที่ 5, 13 ต.ค.', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80', badge: 'bg-amber-100 text-amber-900' },
    { id: 'day_7', username: 'sudarat', defaultPass: '1234', name: 'นางสาวสุดารัตน์ ริมทอง', role: 'staff', roleName: 'ผู้อยู่เวรยาม (กะกลางวัน)', category: 'day', dept: 'กองคลัง', gender: 'female', dutyDays: 'วันที่ 5, 13 ต.ค.', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80', badge: 'bg-amber-100 text-amber-900' },
    { id: 'day_8', username: 'niphaporn', defaultPass: '1234', name: 'นางสาวนิภาพร เที่ยงตรง', role: 'staff', roleName: 'ผู้อยู่เวรยาม (กะกลางวัน)', category: 'day', dept: 'สำนักปลัด', gender: 'female', dutyDays: 'วันที่ 10, 23 ต.ค.', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&q=80', badge: 'bg-amber-100 text-amber-900' },
    { id: 'day_9', username: 'nittaya', defaultPass: '1234', name: 'นางสาวนิตยา ชุมชัย', role: 'staff', roleName: 'ผู้อยู่เวรยาม (กะกลางวัน)', category: 'day', dept: 'กองสาธารณสุข', gender: 'female', dutyDays: 'วันที่ 10, 23 ต.ค.', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80', badge: 'bg-amber-100 text-amber-900' },
    { id: 'day_10', username: 'ratchanee', defaultPass: '1234', name: 'นางรัชนี สร้อยคำ', role: 'staff', roleName: 'ผู้อยู่เวรยาม (กะกลางวัน)', category: 'day', dept: 'กองคลัง', gender: 'female', dutyDays: 'วันที่ 11, 24 ต.ค.', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80', badge: 'bg-amber-100 text-amber-900' },
    { id: 'day_11', username: 'massupha', defaultPass: '1234', name: 'นางสาวมาสศุภา ดวงคำ', role: 'staff', roleName: 'ผู้อยู่เวรยาม (กะกลางวัน)', category: 'day', dept: 'สำนักปลัด', gender: 'female', dutyDays: 'วันที่ 11, 24 ต.ค.', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80', badge: 'bg-amber-100 text-amber-900' }
];

// ข้อมูลตารางเวรตามคำสั่งจริง ต.ค. 2569
const ROSTER_OCT_2569 = {
    day: {
        3:  { staff: ['นางสาวอำพร ทองสวัสดิ์', 'นางสาวธิดาลักษณ์ โสแก้ว', 'นางต้องตาประภา โพธิ์งาม'], inspector: 'นางวาสนา สินทรัพย์' },
        4:  { staff: ['นางสาวบีนา เหล็กกล้า', 'นางสาวปภาดา ประดับ'], inspector: 'นางอรุณรัตน์ บุญกอ' },
        5:  { staff: ['นางสาวผกาพา มณีจันทร์', 'นางสาวสุดารัตน์ ริมทอง'], inspector: 'นางวาสนา สินทรัพย์' },
        10: { staff: ['นางสาวนิภาพร เที่ยงตรง', 'นางสาวนิตยา ชุมชัย'], inspector: 'นางวาสนา สินทรัพย์' },
        11: { staff: ['นางรัชนี สร้อยคำ', 'นางสาวมาสศุภา ดวงคำ'], inspector: 'นางอรุณรัตน์ บุญกอ' },
        13: { staff: ['นางสาวผกาพา มณีจันทร์', 'นางสาวสุดารัตน์ ริมทอง'], inspector: 'นางวาสนา สินทรัพย์' },
        17: { staff: ['นางสาวอำพร ทองสวัสดิ์', 'นางสาวธิดาลักษณ์ โสแก้ว', 'นางต้องตาประภา โพธิ์งาม'], inspector: 'นางวาสนา สินทรัพย์' },
        18: { staff: ['นางสาวบีนา เหล็กกล้า', 'นางสาวปภาดา ประดับ'], inspector: 'นางอรุณรัตน์ บุญกอ' },
        23: { staff: ['นางสาวนิภาพร เที่ยงตรง', 'นางสาวนิตยา ชุมชัย'], inspector: 'นางวาสนา สินทรัพย์' },
        24: { staff: ['นางรัชนี สร้อยคำ', 'นางสาวมาสศุภา ดวงคำ'], inspector: 'นางอรุณรัตน์ บุญกอ' },
        31: { staff: ['นางสาวอำพร ทองสวัสดิ์', 'นางสาวธิดาลักษณ์ โสแก้ว', 'นางต้องตาประภา โพธิ์งาม'], inspector: 'นางวาสนา สินทรัพย์' }
    },
    nightCycle: [
        { staff: 'จ.ส.ท.มานิต ทองดวง', inspector: 'นายชาญชัย อักโข' },
        { staff: 'จ.ส.อ.เกียรติพล หาทรัพย์', inspector: 'นายวุฒิศักดิ์ บุตรสิงห์' },
        { staff: 'นายสิงหา ชุมชัย', inspector: 'นายชาญชัย อักโข' },
        { staff: 'นายทศพล โลมรัตน์', inspector: 'นายวุฒิศักดิ์ บุตรสิงห์' },
        { staff: 'นายวีระวัฒน์ จันทรคล', inspector: 'นายชาญชัย อักโข' },
        { staff: 'จ่าเอกเกียรติศักดิ์ เพ็ญเนตร', inspector: 'นายวุฒิศักดิ์ บุตรสิงห์' },
        { staff: 'นายศุภมงคล ธรรมพิทักษ์', inspector: 'นายชาญชัย อักโข' },
        { staff: 'นายอนุชิต ดวงเนตร', inspector: 'นายวุฒิศักดิ์ บุตรสิงห์' },
        { staff: 'นายอรรถชัย สุทธิรัตน์', inspector: 'นายชาญชัย อักโข' },
        { staff: 'นายวุฒิชาติ เชื้อโชติ', inspector: 'นายวุฒิศักดิ์ บุตรสิงห์' },
        { staff: 'นายกล้าหาญ พรพรม', inspector: 'นายชาญชัย อักโข' },
        { staff: 'นายชัยสิทธิ์ วงษ์วิชัย', inspector: 'นายวุฒิศักดิ์ บุตรสิงห์' },
        { staff: 'นายวิทยา ฝางคำ', inspector: 'นายชาญชัย อักโข' },
        { staff: 'นายวัตรจิระ ใสขาว', inspector: 'นายวุฒิศักดิ์ บุตรสิงห์' }
    ]
};

const DEFAULT_SETTINGS = {
    orgName: 'องค์การบริหารส่วนตำบลฝางคำ',
    subdistrict: 'ตำบลฝางคำ',
    district: 'อำเภอสิรินธร',
    province: 'จังหวัดอุบลราชธานี',
    phone: '045-789-123',
    emergencyPhone: '045-789-199',
    mayorName: 'นายกองค์การบริหารส่วนตำบลฝางคำ',
    clerkName: 'ปลัดองค์การบริหารส่วนตำบลฝางคำ',
    lat: 15.22850,
    lng: 104.38710,
    radius: 150,
    dayTime: '08.00 - 16.30 น.',
    nightTime: '16.30 - 08.00 น.',
    lineToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    lineGroupId: 'C894a73129fbc923847192837419',
    lineMorningTime: '07:30',
    lineEveningTime: '16:00'
};

const INITIAL_ATTACHED_PDFS = [
    {
        id: 'pdf-oct-2569',
        name: 'คำสั่ง_อบต_ฝางคำ_ที่_๒๕๖๙_แต่งตั้งเวรยาม_ตุลาคม_๒๕๖๙.pdf',
        size: '524 KB',
        uploadDate: '๑ ต.ค. ๒๕๖๙ ๐๙:๓๐ น.',
        uploader: 'นายชาญชัย อักโข (หน.สำนักปลัด)',
        note: 'คำสั่งแต่งตั้งผู้อยู่เวรยามและผู้ตรวจเวรยาม ประจำเดือน ตุลาคม ๒๕๖๙ อย่างเป็นทางการ ฉบับลงนามจริง',
        isDefault: true
    }
];

let appState = {
    currentUser: null, // เริ่มต้นแบบออกจากระบบ (Guest) ให้ผู้ใช้ล็อกอินเอง
    currentSystemDay: 2, // วันที่จำลองของระบบ: 2 ต.ค. 2569 (วันศุกร์)
    checkinActionType: 'checkin', // 'checkin' (เข้าเวร) หรือ 'checkout' (ออกเวร)
    settings: { ...DEFAULT_SETTINGS },
    attachedPdfs: [...INITIAL_ATTACHED_PDFS],
    currentLoginTab: 'login', // 'login', 'change_pwd', 'directory'
    currentCategory: 'all',
    currentTab: 'dashboard', // เริ่มต้นที่หน้า Dashboard เสมอ!
    selectedMonth: 9, // ต.ค. (index 9)
    selectedYear: 2026,
    schedules: [],
    todayCheckins: {
        'night_2_2026-10-02_night': {
            staffId: 'night_2',
            staffName: 'จ.ส.อ.เกียรติพล หาทรัพย์',
            shift: 'night',
            shiftTitle: 'กะกลางคืน (๑๖.๓๐ - ๐๘.๐๐ น.)',
            date: '2026-10-02',
            time: '16:25 น.',
            checkinTime: '16:25 น.',
            checkoutTime: null,
            distance: 28,
            verified: true,
            photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80',
            notes: 'รับมอบหน้าที่เรียบร้อย ประตูและหน้าต่างอาคาร อบต. ล็อกแน่นหนา',
            inspector: 'นายวุฒิศักดิ์ บุตรสิงห์'
        },
        'night_2_2026-10-02': {
            staffId: 'night_2',
            staffName: 'จ.ส.อ.เกียรติพล หาทรัพย์',
            shift: 'night',
            shiftTitle: 'กะกลางคืน (๑๖.๓๐ - ๐๘.๐๐ น.)',
            date: '2026-10-02',
            time: '16:25 น.',
            checkinTime: '16:25 น.',
            checkoutTime: null,
            distance: 28,
            verified: true,
            photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80',
            notes: 'รับมอบหน้าที่เรียบร้อย ประตูและหน้าต่างอาคาร อบต. ล็อกแน่นหนา',
            inspector: 'นายวุฒิศักดิ์ บุตรสิงห์'
        }
    },
    inspections: [
        {
            id: 'insp-1',
            inspector: 'นายวุฒิศักดิ์ บุตรสิงห์',
            date: '2026-10-02',
            time: '20:15 น.',
            staffPresent: true,
            premiseNormal: true,
            remark: 'ตรวจตราอาคารที่ทำการ อบต.ฝางคำ พบ จ.ส.อ.เกียรติพล อยู่ปฏิบัติหน้าที่เรียบร้อย ไฟส่องสว่างเปิดครบถ้วน',
            hasSig: true
        }
    ],
    swapRequests: [
        {
            id: 'sw-101',
            requester: 'นายศุภมงคล ธรรมพิทักษ์',
            substitute: 'นายอรรถชัย สุทธิรัตน์',
            date: '2026-10-07',
            status: 'approved',
            statusText: 'อนุมัติแล้ว',
            reason: 'ติดราชการฝึกอบรมงานป้องกันและบรรเทาสาธารณภัย'
        }
    ],
    userLocation: { lat: 15.22852, lng: 104.38712, isWithin: true, distance: 35 },
    currentCheckinPhoto: null
};

// -------------------------------------------------------------
// ระบบแจ้งเตือน Pop-up (Toast Notifications)
// -------------------------------------------------------------
function showToast(title, message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const colors = {
        success: 'bg-emerald-600 text-white border-emerald-700',
        info: 'bg-blue-600 text-white border-blue-700',
        warning: 'bg-amber-500 text-white border-amber-600',
        error: 'bg-rose-600 text-white border-rose-700'
    };

    const icons = {
        success: '✅',
        info: 'ℹ️',
        warning: '⚠️',
        error: '❌'
    };

    const toast = document.createElement('div');
    toast.className = `toast max-w-sm rounded-2xl p-4 shadow-xl border flex items-start space-x-3 ${colors[type] || colors.success}`;
    toast.innerHTML = `
        <span class="text-xl flex-shrink-0">${icons[type] || '🔔'}</span>
        <div class="flex-1 min-w-0">
            <div class="font-bold text-sm leading-tight">${title}</div>
            <div class="text-xs opacity-90 mt-0.5 leading-snug">${message}</div>
        </div>
        <button onclick="this.parentElement.remove()" class="text-white/80 hover:text-white text-xs font-bold ml-1">✕</button>
    `;

    container.appendChild(toast);
    setTimeout(() => {
        if (toast.parentElement) toast.remove();
    }, 4500);
}

// -------------------------------------------------------------
// ระบบ Authentication, Login, และ เปลี่ยนรหัสผ่าน
// -------------------------------------------------------------
function openLoginModal(initialView = 'login') {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.classList.remove('hidden');
        switchLoginView(initialView);
    }
}

function closeLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) modal.classList.add('hidden');
}

function switchLoginView(view) {
    appState.currentLoginTab = view;

    const viewLogin = document.getElementById('modal-view-login');
    const viewChangePwd = document.getElementById('modal-view-change-pwd');
    const viewDirectory = document.getElementById('modal-view-directory');

    if (viewLogin) viewLogin.classList.toggle('hidden', view !== 'login');
    if (viewChangePwd) viewChangePwd.classList.toggle('hidden', view !== 'change_pwd');
    if (viewDirectory) {
        viewDirectory.classList.toggle('hidden', view !== 'directory');
        if (view === 'directory') renderDirectoryUserList(appState.currentCategory || 'all', '');
    }

    // อัปเดตรูปแบบแท็บด้านบน
    document.querySelectorAll('.login-modal-tab-btn').forEach(btn => {
        const targetView = btn.getAttribute('data-view');
        if (targetView === view) {
            btn.classList.remove('bg-transparent', 'text-slate-600');
            btn.classList.add('bg-white', 'text-emerald-800', 'font-bold', 'shadow-xs');
        } else {
            btn.classList.remove('bg-white', 'text-emerald-800', 'font-bold', 'shadow-xs');
            btn.classList.add('bg-transparent', 'text-slate-600');
        }
    });

    // หากเปิดหน้าเปลี่ยนรหัสผ่าน และมีผู้ใช้อยู่ ให้กรอก username รอไว้
    if (view === 'change_pwd') {
        const chgUserEl = document.getElementById('chg-username');
        if (chgUserEl && appState.currentUser) {
            chgUserEl.value = appState.currentUser.username;
        }
    }
}

// 1. ตรวจสอบการเข้าสู่ระบบด้วย Username & Password
function handleUsernamePasswordLogin(event) {
    if (event) event.preventDefault();
    const usernameInputEl = document.getElementById('login-username');
    const passwordInputEl = document.getElementById('login-password');
    if (!usernameInputEl || !passwordInputEl) return;

    const usernameInput = usernameInputEl.value.trim().toLowerCase();
    const passwordInput = passwordInputEl.value;

    if (!usernameInput) {
        showToast('กรุณากรอก Username', 'โปรดระบุชื่อผู้ใช้งานของท่าน เช่น admin หรือ kiattiphon', 'warning');
        return;
    }

    const foundUser = ALL_SYSTEM_USERS.find(u => u.username.toLowerCase() === usernameInput || u.name.toLowerCase().includes(usernameInput));

    if (!foundUser) {
        showToast('ไม่พบบัญชีผู้ใช้', `ไม่พบชื่อผู้ใช้งาน "${usernameInput}" ในระบบ อบต.ฝางคำ (สามารถกดแท็บรายชื่อเพื่อเลือกได้)`, 'error');
        return;
    }

    const currentPass = getUserCurrentPassword(foundUser);

    if (passwordInput === currentPass || passwordInput === '1234') {
        appState.currentUser = foundUser;
        updateAuthUI();
        closeLoginModal();
        showToast('เข้าสู่ระบบสำเร็จ', `ยินดีต้อนรับ: ${foundUser.name} (${foundUser.roleName})`, 'success');

        if (foundUser.role === 'inspector') switchTab('inspection');
        else if (foundUser.role === 'staff') switchTab('checkin');
        else switchTab('dashboard');
    } else {
        showToast('รหัสผ่านไม่ถูกต้อง', 'รหัสผ่านเริ่มต้นคือ 1234 หรือรหัสผ่านใหม่ที่ท่านเคยบันทึกไว้', 'error');
    }
}

// 2. ระบบเปลี่ยนรหัสผ่าน (Change Password)
function handleChangePasswordSubmit(event) {
    if (event) event.preventDefault();

    const usernameInput = document.getElementById('chg-username').value.trim().toLowerCase();
    const oldPasswordInput = document.getElementById('chg-old-password').value;
    const newPasswordInput = document.getElementById('chg-new-password').value;
    const confirmPasswordInput = document.getElementById('chg-confirm-password').value;

    const foundUser = ALL_SYSTEM_USERS.find(u => u.username.toLowerCase() === usernameInput || u.name.toLowerCase().includes(usernameInput));

    if (!foundUser) {
        showToast('ไม่พบบัญชีผู้ใช้', `ไม่พบชื่อผู้ใช้งาน "${usernameInput}"`, 'error');
        return;
    }

    const currentPass = getUserCurrentPassword(foundUser);

    if (oldPasswordInput !== currentPass && oldPasswordInput !== '1234') {
        showToast('รหัสผ่านเดิมไม่ถูกต้อง', 'กรุณาระบุรหัสผ่านปัจจุบันให้ถูกต้อง (รหัสเริ่มต้น: 1234)', 'error');
        return;
    }

    if (newPasswordInput.length < 4) {
        showToast('รหัสผ่านสั้นเกินไป', 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร', 'warning');
        return;
    }

    if (newPasswordInput !== confirmPasswordInput) {
        showToast('รหัสผ่านใหม่ไม่ตรงกัน', 'กรุณากรอกรหัสผ่านใหม่และยืนยันรหัสผ่านให้ตรงกัน', 'warning');
        return;
    }

    // บันทึกรหัสผ่านใหม่ลง LocalStorage
    savePasswordForUser(foundUser.username, newPasswordInput);

    // เคลียร์ฟอร์ม
    document.getElementById('chg-old-password').value = '';
    document.getElementById('chg-new-password').value = '';
    document.getElementById('chg-confirm-password').value = '';

    showToast('เปลี่ยนรหัสผ่านสำเร็จ! 🎉', `รหัสผ่านใหม่ของ ${foundUser.name} ถูกบันทึกเรียบร้อยแล้ว`, 'success');
    switchLoginView('login');
    document.getElementById('login-username').value = foundUser.username;
    document.getElementById('login-password').value = newPasswordInput;
}

// 3. ตารางรายชื่อ Username ทั้ง 30 ท่าน สำหรับดูและกดเลือกได้ทันที
function renderDirectoryUserList(category = 'all', searchQuery = '') {
    const container = document.getElementById('directory-users-grid');
    if (!container) return;

    let filtered = ALL_SYSTEM_USERS;
    if (category !== 'all') {
        filtered = filtered.filter(u => u.category === category);
    }
    if (searchQuery && searchQuery.trim() !== '') {
        const q = searchQuery.trim().toLowerCase();
        filtered = filtered.filter(u => u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || u.dutyDays.toLowerCase().includes(q));
    }

    container.innerHTML = filtered.map(u => {
        return `
            <div class="p-3 bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 shadow-xs flex items-center justify-between gap-2">
                <div class="flex items-center space-x-2.5 min-w-0">
                    <img src="${u.avatar}" class="w-8 h-8 rounded-full object-cover border border-slate-200 flex-shrink-0" alt="${u.name}">
                    <div class="min-w-0">
                        <div class="font-bold text-xs text-slate-900 truncate">${u.name}</div>
                        <div class="text-[10px] text-slate-500">Username: <span class="font-mono font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">${u.username}</span></div>
                    </div>
                </div>
                <button onclick="pickUserToLogin('${u.username}')" class="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 text-[11px] font-bold transition flex-shrink-0">
                    เลือก ➔
                </button>
            </div>
        `;
    }).join('');
}

function pickUserToLogin(username) {
    const user = ALL_SYSTEM_USERS.find(u => u.username === username);
    if (!user) return;

    switchLoginView('login');
    document.getElementById('login-username').value = user.username;
    document.getElementById('login-password').value = getUserCurrentPassword(user);
    showToast('เลือกผู้ใช้เรียบร้อย', `เลือกบัญชี ${user.name} แล้ว กดเข้าสู่ระบบได้เลย`, 'info');
}

function filterLoginCategory(cat) {
    appState.currentCategory = cat;
    document.querySelectorAll('.login-cat-btn').forEach(btn => {
        btn.classList.remove('bg-emerald-600', 'text-white');
        btn.classList.add('bg-slate-100', 'text-slate-700');
    });
    const activeBtn = document.getElementById(`btn-logincat-${cat}`);
    if (activeBtn) {
        activeBtn.classList.remove('bg-slate-100', 'text-slate-700');
        activeBtn.classList.add('bg-emerald-600', 'text-white');
    }
    const searchVal = document.getElementById('login-search-input') ? document.getElementById('login-search-input').value : '';
    renderDirectoryUserList(cat, searchVal);
}

function searchLoginUsers(query) {
    renderDirectoryUserList(appState.currentCategory || 'all', query);
}

function updateAuthUI() {
    const u = appState.currentUser;
    const nameEl = document.getElementById('auth-user-name');
    const posEl = document.getElementById('auth-user-pos');
    const roleEl = document.getElementById('auth-user-role-badge');
    const avatarEl = document.getElementById('auth-user-avatar');
    const btnLogout = document.getElementById('btn-header-logout');
    const btnChangePwd = document.getElementById('btn-header-changepwd');
    const btnLoginHeader = document.getElementById('btn-header-login');
    const personalBanner = document.getElementById('personal-duty-banner');

    // กรณีที่ยังไม่ได้เข้าสู่ระบบ (Guest / ผู้เยี่ยมชม)
    if (!u) {
        if (nameEl) nameEl.textContent = 'ยังไม่ได้เข้าสู่ระบบ';
        if (posEl) posEl.textContent = 'กรุณาล็อกอินเพื่อลงเวลา/ตรวจเวร';
        if (roleEl) {
            roleEl.textContent = 'ผู้เยี่ยมชม';
            roleEl.className = 'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-slate-100 text-slate-600 border-slate-300';
        }
        if (avatarEl) avatarEl.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80';
        if (btnLogout) btnLogout.classList.add('hidden');
        if (btnChangePwd) btnChangePwd.classList.add('hidden');
        if (btnLoginHeader) {
            btnLoginHeader.innerHTML = `<span>🔑 เข้าสู่ระบบ</span>`;
            btnLoginHeader.className = 'text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center space-x-1.5 shadow-sm';
        }
        if (personalBanner) personalBanner.classList.add('hidden');
        renderCheckinTab();
        return;
    }

    // กรณีเข้าสู่ระบบแล้ว
    if (nameEl) nameEl.textContent = u.name;
    if (posEl) posEl.textContent = `User: ${u.username} • ${u.dept}`;
    if (roleEl) {
        roleEl.textContent = u.roleName;
        roleEl.className = `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${u.badge}`;
    }
    if (avatarEl) avatarEl.src = u.avatar;
    if (btnLogout) btnLogout.classList.remove('hidden');
    if (btnChangePwd) btnChangePwd.classList.remove('hidden');
    if (btnLoginHeader) {
        btnLoginHeader.innerHTML = `<span>🔄 สลับบัญชี</span>`;
        btnLoginHeader.className = 'text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition flex items-center space-x-1.5 border border-emerald-200 shadow-xs';
    }

    if (personalBanner) {
        if (u.id === 'night_2') {
            personalBanner.classList.remove('hidden');
            personalBanner.innerHTML = `
                <div class="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-3xl p-4 shadow-md flex flex-col sm:flex-row justify-between items-center gap-3">
                    <div class="flex items-center space-x-3">
                        <span class="text-3xl">🌙</span>
                        <div>
                            <div class="font-bold text-sm">แจ้งเตือนเวรคืนนี้! (๒ ตุลาคม ๒๕๖๙)</div>
                            <div class="text-xs opacity-90">ท่านมีหน้าที่อยู่เวรรักษาการณ์สถานที่ราชการ เวลา ๑๖.๓๐ - ๐๘.๐๐ น. ผู้ตรวจเวรคือ นายวุฒิศักดิ์ บุตรสิงห์</div>
                        </div>
                    </div>
                    <button onclick="switchTab('checkin')" class="px-4 py-2 rounded-2xl bg-white text-emerald-800 font-bold text-xs shadow-sm hover:bg-slate-100 transition whitespace-nowrap">
                        📍 ลงเวลาเข้าเวรเลย
                    </button>
                </div>
            `;
        } else if (u.category === 'day' && u.dutyDays.includes('3')) {
            personalBanner.classList.remove('hidden');
            personalBanner.innerHTML = `
                <div class="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-3xl p-4 shadow-md flex flex-col sm:flex-row justify-between items-center gap-3">
                    <div class="flex items-center space-x-3">
                        <span class="text-3xl">☀️</span>
                        <div>
                            <div class="font-bold text-sm">แจ้งเตือนเวรวันพรุ่งนี้! (เสาร์ ๓ ตุลาคม ๒๕๖๙)</div>
                            <div class="text-xs opacity-90">ท่านมีหน้าที่อยู่เวรกลางวัน เวลา ๐๘.๐๐ - ๑๖.๓๐ น. ผู้ตรวจเวรคือ นางวาสนา สินทรัพย์</div>
                        </div>
                    </div>
                    <button onclick="switchTab('checkin')" class="px-4 py-2 rounded-2xl bg-white text-amber-900 font-bold text-xs shadow-sm hover:bg-slate-100 transition whitespace-nowrap">
                        📍 ดูรายละเอียดและลงเวลา
                    </button>
                </div>
            `;
        } else {
            personalBanner.classList.add('hidden');
        }
    }

    renderCheckinTab();

    if (u.role === 'inspector') {
        const inspectSelect = document.getElementById('inspect-inspector-select');
        if (inspectSelect) {
            for (let i = 0; i < inspectSelect.options.length; i++) {
                if (inspectSelect.options[i].text.includes(u.name.split(' ')[0])) {
                    inspectSelect.selectedIndex = i;
                    break;
                }
            }
        }
    }
}

function logoutUser() {
    appState.currentUser = null;
    updateAuthUI();
    switchTab('dashboard');
    showToast('ออกจากระบบเรียบร้อย', 'ท่านออกจากระบบแล้ว สามารถดูตารางเวรยามได้ตามปกติ หรือกดเข้าสู่ระบบเมื่อต้องการลงเวลา', 'info');
}

// -------------------------------------------------------------
// สร้างข้อมูลตารางเวร 31 วัน ประจำเดือนตุลาคม 2569
// -------------------------------------------------------------
function buildOctober2569Schedules() {
    const schedules = [];
    const daysInMonth = 31;

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `2026-10-${String(day).padStart(2, '0')}`;
        // วันที่ 1 ต.ค. 2569 คือ วันพฤหัสบดี (Thursday = 4)
        const dateObj = new Date(2026, 9, day);
        const dayOfWeek = dateObj.getDay(); // 0 = Sun, 6 = Sat
        const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
        const isHoliday = isWeekend || day === 13 || day === 23; // 13 ต.ค. นวมินทรมหาราช, 23 ต.ค. ปิยมหาราช

        // เวรกลางวัน (เฉพาะวันหยุดเสาร์-อาทิตย์ และวันหยุดนักขัตฤกษ์)
        let dayDuty = null;
        if (ROSTER_OCT_2569.day[day]) {
            dayDuty = {
                shift: 'day',
                shiftName: 'กะกลางวัน (๐๘.๐๐ - ๑๖.๓๐ น.)',
                staff: ROSTER_OCT_2569.day[day].staff,
                inspector: ROSTER_OCT_2569.day[day].inspector,
                isHoliday: true
            };
        }

        // เวรกลางคืน (มีทุกคืน 1-31 ต.ค.)
        const nightIdx = (day - 1) % ROSTER_OCT_2569.nightCycle.length;
        const nightItem = ROSTER_OCT_2569.nightCycle[nightIdx];
        const nightDuty = {
            shift: 'night',
            shiftName: 'กะกลางคืน (๑๖.๓๐ - ๐๘.๐๐ น.)',
            staff: [nightItem.staff],
            inspector: nightItem.inspector,
            isHoliday: isHoliday
        };

        schedules.push({
            day,
            dateStr,
            dayOfWeek,
            isHoliday,
            dayDuty,
            nightDuty
        });
    }
    appState.schedules = schedules;
}

// -------------------------------------------------------------
// ระบบสลับหน้าเว็บ (Tab Navigation)
// -------------------------------------------------------------
function switchTab(tabId) {
    // หากเข้าหน้าลงเวลา, ตรวจเวร, สลับเวร, หรือตั้งค่า แต่ยังไม่ได้เข้าสู่ระบบ ให้แจ้งเตือนและเปิดหน้าต่างล็อกอิน
    if (!appState.currentUser && (tabId === 'checkin' || tabId === 'inspection' || tabId === 'swap' || tabId === 'settings')) {
        openLoginModal('login');
        showToast('กรุณาเข้าสู่ระบบก่อน', 'กรุณาระบุ Username และ Password ของท่านเพื่อดำเนินการ', 'info');
        return;
    }

    appState.currentTab = tabId;

    // ซ่อนเนื้อหาทุกแท็บ
    document.querySelectorAll('.tab-content').forEach(section => {
        section.classList.add('hidden');
    });

    // แสดงแท็บเป้าหมาย
    const targetSection = document.getElementById(`tab-${tabId}`);
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }

    // อัปเดตปุ่มเมนูด้านข้าง
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('bg-emerald-700', 'text-white', 'shadow-sm');
        btn.classList.add('text-slate-600', 'hover:bg-slate-100');
    });

    const activeBtn = document.getElementById(`btn-nav-${tabId}`);
    if (activeBtn) {
        activeBtn.classList.remove('text-slate-600', 'hover:bg-slate-100');
        activeBtn.classList.add('bg-emerald-700', 'text-white', 'shadow-sm');
    }

    // เรียกฟังก์ชันเรนเดอร์เฉพาะแท็บ
    if (tabId === 'calendar') renderCalendar();
    if (tabId === 'dashboard') renderDashboard();
    if (tabId === 'checkin') renderCheckinTab();
    if (tabId === 'print') renderAttachedPdfList();
    if (tabId === 'settings') loadSettingsToForm();

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// -------------------------------------------------------------
// หน้า Dashboard (ภาพรวม & จอแสดงเวรวันนี้)
// -------------------------------------------------------------
function renderDashboard() {
    const today = appState.currentSystemDay || 2; // วันที่ปัจจุบันของระบบ
    const todaySched = appState.schedules.find(s => s.day === today);

    // 1. เวรกลางวัน (แสดงตามตารางจริง หากไม่มีเวรจะแสดงผลัดถัดไป)
    const dayStaffEl = document.getElementById('dash-day-staff');
    const dayInspEl = document.getElementById('dash-day-inspector');
    const dayStatusEl = document.getElementById('dash-day-status');

    if (dayStaffEl && dayInspEl && dayStatusEl) {
        if (todaySched && todaySched.dayDuty) {
            dayStaffEl.innerHTML = todaySched.dayDuty.staff.map(s => `<div>• ${s}</div>`).join('');
            dayInspEl.textContent = todaySched.dayDuty.inspector;
            dayStatusEl.innerHTML = `<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">กำลังปฏิบัติหน้าที่</span>`;
        } else {
            dayStaffEl.innerHTML = `
                <div class="text-slate-500 font-normal text-xs">
                    วันนี้เป็นวันทำการปกติ (กะกลางวันปฏิบัติเฉพาะวันหยุดเสาร์-อาทิตย์)<br>
                    <span class="text-amber-800 font-bold mt-1 inline-block">☀️ ผลัดถัดไป (เสาร์ ๓ ต.ค.):</span><br>
                    นางสาวอำพร ทองสวัสดิ์, นางสาวธิดาลักษณ์ โสแก้ว, นางต้องตาประภา โพธิ์งาม
                </div>
            `;
            dayInspEl.textContent = 'นางวาสนา สินทรัพย์ (เสาร์ ๓ ต.ค.)';
            dayStatusEl.innerHTML = `<span class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white/20 text-white">วันทำการปกติ</span>`;
        }
    }

    // 2. เวรกลางคืน (มีทุกคืน 1-31 ต.ค.)
    const nightStaffEl = document.getElementById('dash-night-staff');
    const nightInspEl = document.getElementById('dash-night-inspector');
    const nightStatusEl = document.getElementById('dash-night-status');

    if (nightStaffEl && nightInspEl && nightStatusEl && todaySched) {
        const nightStaffName = todaySched.nightDuty.staff[0];
        nightStaffEl.innerHTML = `<div>• ${nightStaffName}</div>`;
        nightInspEl.textContent = todaySched.nightDuty.inspector;

        const dateStr = `2026-10-${String(today).padStart(2, '0')}`;
        const nightUser = findUserByName(nightStaffName);
        const nightKey = nightUser ? `${nightUser.id}_${dateStr}_night` : null;
        const isChecked = (nightKey && appState.todayCheckins[nightKey]) || appState.todayCheckins[`${nightUser ? nightUser.id : 'night_2'}_${dateStr}`] || (today === 2 ? (appState.todayCheckins['night_2_2026-10-02_night'] || appState.todayCheckins['night_2_2026-10-02']) : null);

        if (isChecked) {
            nightStatusEl.innerHTML = `<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500 text-white animate-pulse">● ลงเวลาแล้ว (${isChecked.checkinTime || isChecked.time})</span>`;
        } else {
            nightStatusEl.innerHTML = `<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-400 text-slate-900">รอเข้าเวร 16.30 น.</span>`;
        }
    }

    // 3. ตัวนับสถิติ
    const statTotal = document.getElementById('stat-total-shifts');
    const statFemale = document.getElementById('stat-female-shifts');
    const statMale = document.getElementById('stat-male-shifts');
    const statInsp = document.getElementById('stat-inspections');

    if (statTotal) statTotal.textContent = '42 ผลัด';
    if (statFemale) statFemale.textContent = '11 วัน';
    if (statMale) statMale.textContent = '31 คืน';
    if (statInsp) statInsp.textContent = `${appState.inspections.length} ครั้ง`;
}

// -------------------------------------------------------------
// ปฏิทินตารางเวร (Calendar View)
// -------------------------------------------------------------
function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    if (!grid) return;

    grid.innerHTML = '';

    // วันที่ 1 ต.ค. 2569 ตรงกับวันพฤหัสบดี (Thursday) ช่องว่างก่อนหน้า = 4 ช่อง (อาทิตย์=0, จันทร์=1, อังคาร=2, พุธ=3)
    const emptySlots = 4;
    for (let i = 0; i < emptySlots; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'min-h-[105px] rounded-2xl bg-slate-50/50 border border-dashed border-slate-200 p-2 hidden sm:block';
        grid.appendChild(emptyCell);
    }

    const curDay = appState.currentSystemDay || 2;

    appState.schedules.forEach(item => {
        const cell = document.createElement('div');
        const isToday = item.day === curDay;
        const isTomorrow = item.day === (curDay + 1);

        let borderClass = 'border-slate-200';
        let bgClass = item.isHoliday ? 'bg-amber-50/20' : 'bg-white';

        if (isToday) {
            borderClass = 'border-2 border-emerald-500 shadow-md ring-2 ring-emerald-200';
            bgClass = 'bg-emerald-50/30';
        } else if (isTomorrow) {
            borderClass = 'border-2 border-amber-400 shadow-xs';
        }

        cell.className = `min-h-[105px] rounded-2xl border ${borderClass} ${bgClass} p-2 flex flex-col justify-between transition hover:shadow-md cursor-pointer`;
        cell.onclick = () => showDayDetail(item.day);

        let dayDutyHtml = '';
        if (item.dayDuty) {
            const shortNames = item.dayDuty.staff.map(name => {
                return name.replace(/^(นางสาว|นาง|นาย)/, '').trim().split(' ')[0];
            }).join(', ');
            dayDutyHtml = `
                <div class="mt-1 p-1 rounded-lg bg-amber-100/90 text-amber-950 text-[10px] leading-tight border border-amber-200">
                    <span class="font-bold">☀️ กลางวัน:</span> ${shortNames}
                </div>
            `;
        }

        const nightStaffShort = item.nightDuty.staff[0].replace(/^(จ\.ส\.ท\.|จ\.ส\.อ\.|จ่าเอก|นาย)/, '').trim().split(' ')[0];
        const nightDutyHtml = `
            <div class="mt-1 p-1 rounded-lg bg-slate-900 text-white text-[10px] leading-tight">
                <span class="font-bold text-amber-300">🌙 ค่ำ:</span> ${nightStaffShort}
            </div>
        `;

        cell.innerHTML = `
            <div>
                <div class="flex justify-between items-center">
                    <span class="text-xs font-bold ${item.dayOfWeek === 0 || item.dayOfWeek === 6 ? 'text-rose-600' : 'text-slate-800'} ${isToday ? 'px-1.5 py-0.5 rounded-full bg-emerald-600 text-white' : ''}">
                        ${item.day} ${isToday ? '(วันนี้)' : ''}
                    </span>
                    ${item.isHoliday ? '<span class="text-[9px] px-1 py-0.2 rounded bg-rose-100 text-rose-700 font-bold">หยุด</span>' : ''}
                </div>
                ${dayDutyHtml}
                ${nightDutyHtml}
            </div>
            <div class="text-[9px] text-slate-400 mt-1 truncate">
                ตรวจ: ${item.dayDuty ? item.dayDuty.inspector.split(' ')[0] : item.nightDuty.inspector.split(' ')[0]}
            </div>
        `;

        grid.appendChild(cell);
    });
}

function showDayDetail(day) {
    const sched = appState.schedules.find(s => s.day === day);
    if (!sched) return;

    let content = `📅 รายละเอียดเวรยาม วันที่ ${day} ตุลาคม ๒๕๖๙\n\n`;
    if (sched.dayDuty) {
        content += `☀️ เวรกลางวัน (๐๘.๐๐ - ๑๖.๓๐ น.):\n`;
        content += `  • ผู้อยู่เวร: ${sched.dayDuty.staff.join(', ')}\n`;
        content += `  • ผู้ตรวจเวร: ${sched.dayDuty.inspector}\n\n`;
    } else {
        content += `☀️ เวรกลางวัน: วันทำการปกติ (ไม่มีเวรกลางวัน)\n\n`;
    }

    content += `🌙 เวรกลางคืน (๑๖.๓๐ - ๐๘.๐๐ น.):\n`;
    content += `  • ผู้อยู่เวร: ${sched.nightDuty.staff.join(', ')}\n`;
    content += `  • ผู้ตรวจเวร: ${sched.nightDuty.inspector}\n`;

    alert(content);
}

// -------------------------------------------------------------
// ระบบลงเวลาเข้าเวร (Check-in & Geofence)
// -------------------------------------------------------------
function toggleLocationSim(isInside) {
    if (isInside) {
        appState.userLocation = { lat: 15.22852, lng: 104.38712, isWithin: true, distance: 35 };
        const badge = document.getElementById('gps-status-badge');
        if (badge) {
            badge.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200';
            badge.innerHTML = '📍 พิกัดถูกต้อง: อยู่ในเขต อบต.ฝางคำ (ห่าง 35 ม.)';
        }
        showToast('พิกัดถูกต้อง', 'ท่านอยู่ในรัศมีที่ทำการ อบต.ฝางคำ สามารถลงเวลาได้', 'success');
    } else {
        appState.userLocation = { lat: 15.24500, lng: 104.41000, isWithin: false, distance: 2850 };
        const badge = document.getElementById('gps-status-badge');
        if (badge) {
            badge.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200';
            badge.innerHTML = '⚠️ อยู่นอกเขต: ห่างจาก อบต.ฝางคำ 2.85 กิโลเมตร';
        }
        showToast('อยู่นอกพื้นที่', 'ท่านอยู่นอกรัศมี 150 เมตร ไม่สามารถลงเวลาได้', 'error');
    }
}

function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        appState.currentCheckinPhoto = e.target.result;
        const preview = document.getElementById('checkin-photo-preview');
        const placeholder = document.getElementById('photo-placeholder');
        if (preview && placeholder) {
            preview.src = e.target.result;
            preview.classList.remove('hidden');
            placeholder.classList.add('hidden');
        }
        showToast('แนบภาพสำเร็จ', 'ภาพถ่ายของท่านพร้อมสำหรับการส่งรายงาน', 'info');
    };
    reader.readAsDataURL(file);
}

// -------------------------------------------------------------
// ระบบตรวจสอบสิทธิ์และลงเวลาเวรยาม (Duty Verification & Check-in/out)
// -------------------------------------------------------------
const THAI_DAY_NAMES = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
const THAI_NUMBERS = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];

function toThaiNum(num) {
    return String(num).split('').map(c => THAI_NUMBERS[parseInt(c)] || c).join('');
}

function getThaiDateLabel(day) {
    const d = new Date(2026, 9, day);
    const dayName = THAI_DAY_NAMES[d.getDay()];
    return `${dayName}ที่ ${toThaiNum(day)} ตุลาคม ๒๕๖๙`;
}

function findUserByName(nameStr) {
    if (!nameStr) return null;
    const clean = nameStr.replace(/^(นาย|นางสาว|นาง|จ\.ส\.ท\.|จ\.ส\.อ\.|จ่าเอก)\s*/, '').trim();
    return ALL_SYSTEM_USERS.find(u => {
        const uClean = u.name.replace(/^(นาย|นางสาว|นาง|จ\.ส\.ท\.|จ\.ส\.อ\.|จ่าเอก)\s*/, '').trim();
        return u.name === nameStr || uClean === clean || u.name.includes(clean);
    });
}

function getUserDutySchedules(user) {
    if (!user) return [];
    const cleanUser = user.name.replace(/^(นาย|นางสาว|นาง|จ\.ส\.ท\.|จ\.ส\.อ\.|จ่าเอก)\s*/, '').trim();
    const duties = [];

    appState.schedules.forEach(sched => {
        // กะกลางวัน (มีเฉพาะวันหยุด)
        if (sched.dayDuty && sched.dayDuty.staff) {
            const isMatch = sched.dayDuty.staff.some(st => {
                const cleanSt = st.replace(/^(นาย|นางสาว|นาง|จ\.ส\.ท\.|จ\.ส\.อ\.|จ่าเอก)\s*/, '').trim();
                return cleanSt === cleanUser || st === user.name;
            });
            if (isMatch) {
                duties.push({
                    day: sched.day,
                    dateStr: sched.dateStr,
                    shiftType: 'day',
                    shiftTitle: 'กะกลางวัน (๐๘.๐๐ - ๑๖.๓๐ น.)',
                    shiftBadge: 'bg-amber-100 text-amber-900 border-amber-300',
                    inspector: sched.dayDuty.inspector,
                    coStaff: sched.dayDuty.staff.filter(st => {
                        const cleanSt = st.replace(/^(นาย|นางสาว|นาง|จ\.ส\.ท\.|จ\.ส\.อ\.|จ่าเอก)\s*/, '').trim();
                        return cleanSt !== cleanUser;
                    }),
                    isHoliday: sched.isHoliday
                });
            }
        }

        // กะกลางคืน (มีทุกคืน 1-31 ต.ค.)
        if (sched.nightDuty && sched.nightDuty.staff) {
            const isMatch = sched.nightDuty.staff.some(st => {
                const cleanSt = st.replace(/^(นาย|นางสาว|นาง|จ\.ส\.ท\.|จ\.ส\.อ\.|จ่าเอก)\s*/, '').trim();
                return cleanSt === cleanUser || st === user.name;
            });
            if (isMatch) {
                duties.push({
                    day: sched.day,
                    dateStr: sched.dateStr,
                    shiftType: 'night',
                    shiftTitle: 'กะกลางคืน (๑๖.๓๐ - ๐๘.๐๐ น.)',
                    shiftBadge: 'bg-indigo-100 text-indigo-900 border-indigo-300',
                    inspector: sched.nightDuty.inspector,
                    coStaff: [],
                    isHoliday: sched.isHoliday
                });
            }
        }
    });

    return duties.sort((a, b) => a.day - b.day);
}

function setSystemDay(day) {
    appState.currentSystemDay = day;
    renderCheckinTab();
    renderDashboard();
    renderCalendar();
    showToast('เปลี่ยนวันที่ระบบจำลอง', `เปลี่ยนวันที่เป็น ${getThaiDateLabel(day)} สำหรับทดสอบการลงเวลา`, 'info');
}

function setCheckinActionType(type) {
    appState.checkinActionType = type; // 'checkin' | 'checkout'
    
    const btnIn = document.getElementById('btn-mode-checkin');
    const btnOut = document.getElementById('btn-mode-checkout');
    const formTitle = document.getElementById('checkin-form-title');
    const notesLabel = document.getElementById('checkin-notes-label');
    const notesInput = document.getElementById('checkin-notes');
    const btnSubmit = document.getElementById('btn-submit-checkin');
    const btnSubmitText = document.getElementById('btn-submit-checkin-text');

    if (type === 'checkin') {
        if (btnIn) btnIn.className = 'px-3 py-1 rounded-lg transition bg-white text-emerald-800 shadow-xs font-bold';
        if (btnOut) btnOut.className = 'px-3 py-1 rounded-lg transition text-white hover:bg-white/10 font-semibold';
        if (formTitle) formTitle.textContent = 'บันทึกการลงเวลาเข้าเวร';
        if (notesLabel) notesLabel.textContent = 'บันทึกเหตุการณ์ / สภาพทั่วไปก่อนรับเวร';
        if (notesInput) notesInput.placeholder = 'เช่น ทรัพย์สินราชการเรียบร้อย ปิดล็อกประตูหน้าต่าง รับมอบหน้าที่';
        if (btnSubmit && !btnSubmit.disabled) {
            btnSubmit.className = 'w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center space-x-2 cursor-pointer';
            if (btnSubmitText) btnSubmitText.textContent = '✅ ยืนยันการลงเวลาเข้าเวร';
        }
    } else {
        if (btnIn) btnIn.className = 'px-3 py-1 rounded-lg transition text-white hover:bg-white/10 font-semibold';
        if (btnOut) btnOut.className = 'px-3 py-1 rounded-lg transition bg-white text-rose-800 shadow-xs font-bold';
        if (formTitle) formTitle.textContent = 'บันทึกการส่งมอบเวรและออกเวร';
        if (notesLabel) notesLabel.textContent = 'บันทึกสรุปเหตุการณ์ตลอดผลัด / ส่งมอบเวร';
        if (notesInput) notesInput.placeholder = 'เช่น ปฏิบัติหน้าที่เรียบร้อยตลอดผลัด เหตุการณ์ปกติ ส่งมอบกุญแจและอาคารเรียบร้อย';
        if (btnSubmit && !btnSubmit.disabled) {
            btnSubmit.className = 'w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center space-x-2 cursor-pointer';
            if (btnSubmitText) btnSubmitText.textContent = '🚪 ยืนยันการส่งมอบเวรและออกเวร';
        }
    }
}

function renderCheckinTab() {
    const guestGate = document.getElementById('checkin-guest-gate');
    const authContainer = document.getElementById('checkin-auth-container');
    if (!guestGate || !authContainer) return;

    const user = appState.currentUser;
    if (!user) {
        guestGate.classList.remove('hidden');
        authContainer.classList.add('hidden');
        return;
    }

    guestGate.classList.add('hidden');
    authContainer.classList.remove('hidden');

    const currentDay = appState.currentSystemDay || 2;
    const dateLabelEl = document.getElementById('checkin-system-date-label');
    if (dateLabelEl) {
        dateLabelEl.textContent = getThaiDateLabel(currentDay);
    }

    // อัปเดตสีปุ่มเปลี่ยนวันจำลอง
    [2, 3, 4, 5].forEach(d => {
        const btn = document.getElementById(`btn-day-sim-${d}`);
        if (btn) {
            if (d === currentDay) {
                btn.className = 'text-[11px] px-2.5 py-1 rounded-lg font-bold transition border border-emerald-500 bg-emerald-50 text-emerald-700 shadow-2xs';
            } else {
                btn.className = 'text-[11px] px-2.5 py-1 rounded-lg font-bold transition border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100';
            }
        }
    });

    const userDuties = getUserDutySchedules(user);
    const todayDuty = userDuties.find(d => d.day === currentDay);
    const dateStr = `2026-10-${String(currentDay).padStart(2, '0')}`;
    const checkinRecordKey = todayDuty ? `${user.id}_${dateStr}_${todayDuty.shiftType}` : null;
    const record = checkinRecordKey ? appState.todayCheckins[checkinRecordKey] : null;

    const statusCard = document.getElementById('checkin-duty-status-card');
    const selectEl = document.getElementById('checkin-select-schedule');
    const btnSubmit = document.getElementById('btn-submit-checkin');
    const btnSubmitText = document.getElementById('btn-submit-checkin-text');
    const matchBadge = document.getElementById('shift-match-badge');
    const hintEl = document.getElementById('shift-select-hint');

    // 1. กรณี: วันนี้มีเวรเข้าจริง (อนุญาตให้ลงเวลาได้)
    if (todayDuty) {
        if (statusCard) {
            statusCard.className = 'rounded-3xl border border-emerald-300 p-5 shadow-sm transition bg-gradient-to-r from-emerald-600 to-teal-700 text-white';
            statusCard.innerHTML = `
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div class="flex items-start space-x-3.5">
                        <div class="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl shrink-0 backdrop-blur-xs shadow-inner">
                            ${todayDuty.shiftType === 'night' ? '🌙' : '☀️'}
                        </div>
                        <div>
                            <div class="flex items-center space-x-2">
                                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-emerald-800 shadow-2xs">✓ มีสิทธิ์ลงเวลา</span>
                                <span class="text-xs font-semibold text-emerald-100">ตรงตามคำสั่งราชการ</span>
                            </div>
                            <h4 class="text-base sm:text-lg font-bold mt-0.5">วันนี้ท่านมีเวรปฏิบัติหน้าที่!</h4>
                            <div class="text-xs text-white/95 mt-1 space-y-0.5">
                                <div>• <strong>${todayDuty.shiftTitle}</strong></div>
                                <div>• ผู้ตรวจเวร: <strong>${todayDuty.inspector}</strong></div>
                                ${todayDuty.coStaff.length > 0 ? `<div>• ผู้ร่วมปฏิบัติหน้าที่: ${todayDuty.coStaff.join(', ')}</div>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="sm:text-right shrink-0">
                        <div class="text-[11px] text-emerald-100 font-medium">สถานะวันนี้</div>
                        <div class="mt-1">
                            ${record 
                                ? (record.checkoutTime 
                                    ? `<span class="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 shadow-xs">🏁 ออกเวรแล้ว (${record.checkoutTime})</span>`
                                    : `<span class="px-3 py-1 rounded-full text-xs font-bold bg-white text-emerald-800 shadow-xs">✅ เข้าเวรแล้ว (${record.checkinTime || record.time})</span>`)
                                : `<span class="px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-slate-900 shadow-xs">⏳ รอลงเวลาเข้าเวร</span>`
                            }
                        </div>
                    </div>
                </div>
                ${record ? `
                    <div class="mt-4 pt-3 border-t border-white/20 flex flex-wrap items-center justify-between text-xs text-white/90 gap-2">
                        <div class="flex items-center space-x-2">
                            <span>🕒 เข้าเวร: <strong>${record.checkinTime || record.time}</strong></span>
                            ${record.checkoutTime ? `<span>• 🏁 ออกเวร: <strong>${record.checkoutTime}</strong></span>` : ''}
                            <span>• 📍 ห่าง อบต. ${record.distance} ม.</span>
                        </div>
                        ${!record.checkoutTime ? `
                            <button type="button" onclick="setCheckinActionType('checkout')" class="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold transition text-xs flex items-center space-x-1">
                                <span>🚪 คลิกเพื่อลงเวลาออกเวร (Check-out)</span>
                            </button>
                        ` : ''}
                    </div>
                ` : ''}
            `;
        }

        if (selectEl) {
            selectEl.disabled = false;
            selectEl.innerHTML = `
                <option value="${todayDuty.day}_${todayDuty.shiftType}" selected>
                    🟢 [วันนี้ ${toThaiNum(todayDuty.day)} ต.ค.] ${todayDuty.shiftTitle} - ผู้ตรวจเวร: ${todayDuty.inspector}
                </option>
                ${userDuties.filter(d => d.day !== currentDay).map(d => `
                    <option value="${d.day}_${d.shiftType}" disabled>
                        🔒 วันที่ ${toThaiNum(d.day)} ต.ค. (${d.shiftTitle}) - ยังไม่ถึงกำหนด
                    </option>
                `).join('')}
            `;
        }

        if (matchBadge) {
            matchBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800';
            matchBadge.textContent = '✓ ท่านมีเวรในวันนี้ พร้อมลงเวลา';
        }

        if (hintEl) {
            hintEl.textContent = 'เลือกรอบเวรของท่านในวันนี้โดยอัตโนมัติแล้ว';
            hintEl.className = 'text-[11px] text-emerald-600 font-medium mt-1';
        }

        if (btnSubmit) {
            btnSubmit.disabled = false;
            if (appState.checkinActionType === 'checkout') {
                btnSubmit.className = 'w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center space-x-2 cursor-pointer';
                if (btnSubmitText) btnSubmitText.textContent = '🚪 ยืนยันการส่งมอบเวรและออกเวร';
            } else {
                btnSubmit.className = 'w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center space-x-2 cursor-pointer';
                if (btnSubmitText) btnSubmitText.textContent = '✅ ยืนยันการลงเวลาเข้าเวร';
            }
        }
    } else {
        // 2. กรณี: วันนี้ไม่มีเวร (ถูกล็อค ห้ามลงเวลา)
        const nextDuty = userDuties.find(d => d.day > currentDay) || userDuties[0];

        if (statusCard) {
            statusCard.className = 'rounded-3xl border border-amber-200 p-5 shadow-sm transition bg-amber-50 text-amber-950';
            statusCard.innerHTML = `
                <div class="flex items-start space-x-3.5">
                    <div class="w-12 h-12 rounded-2xl bg-amber-200 text-amber-800 flex items-center justify-center text-2xl shrink-0 shadow-xs">
                        🔒
                    </div>
                    <div class="space-y-1.5 flex-1">
                        <div class="flex flex-wrap items-center justify-between gap-2">
                            <h4 class="text-base font-bold text-amber-950">วันนี้ท่านไม่มีเวรปฏิบัติหน้าที่</h4>
                            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 border border-amber-300">
                                🔒 ระบบล็อคการลงเวลา
                            </span>
                        </div>
                        <p class="text-xs text-amber-800 leading-relaxed">
                            ท่าน (${user.name}) ไม่มีรายชื่อในคำสั่งเวรยามประจำ${getThaiDateLabel(currentDay)} ระบบจำกัดให้ลงเวลาได้เฉพาะวันที่ตนเองได้รับมอบหมายจริงเท่านั้น
                        </p>
                        ${nextDuty ? `
                            <div class="mt-2.5 inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-xs font-medium text-amber-900 shadow-2xs">
                                <span>📅 เวรครั้งถัดไปของท่าน:</span>
                                <span class="font-bold text-emerald-700">วันที่ ${toThaiNum(nextDuty.day)} ต.ค. (${nextDuty.shiftTitle})</span>
                            </div>
                        ` : `
                            <div class="text-xs text-slate-500 mt-1">ท่านไม่มีเวรประจำการในเดือนนี้ (ผู้บริหาร/ฝ่ายอำนวยการ)</div>
                        `}
                    </div>
                </div>
            `;
        }

        if (selectEl) {
            selectEl.disabled = true;
            if (userDuties.length > 0) {
                selectEl.innerHTML = `
                    <option disabled selected>🔒 วันนี้ไม่มีเวร (เวรครั้งถัดไป: วันที่ ${toThaiNum(nextDuty.day)} ต.ค.)</option>
                    ${userDuties.map(d => `
                        <option disabled>🔒 วันที่ ${toThaiNum(d.day)} ต.ค. (${d.shiftTitle}) - ยังไม่ถึงกำหนด</option>
                    `).join('')}
                `;
            } else {
                selectEl.innerHTML = `<option disabled selected>🔒 ท่านไม่มีรายชื่อเวรยามในเดือนนี้</option>`;
            }
        }

        if (matchBadge) {
            matchBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700';
            matchBadge.textContent = '🔒 ไม่อนุญาตให้ลงเวลา (ไม่มีเวรวันนี้)';
        }

        if (hintEl) {
            hintEl.textContent = 'ระบบเปิดให้ลงเวลาเฉพาะวันที่ท่านมีเวรตามคำสั่งแต่งตั้งเท่านั้น';
            hintEl.className = 'text-[11px] text-amber-700 font-medium mt-1';
        }

        if (btnSubmit) {
            btnSubmit.disabled = true;
            btnSubmit.className = 'w-full py-3.5 rounded-2xl bg-slate-200 text-slate-400 font-bold text-sm shadow-none cursor-not-allowed flex items-center justify-center space-x-2 border border-slate-300';
            if (btnSubmitText) btnSubmitText.textContent = '🔒 ไม่อยู่ในเวรของท่านวันนี้ (ลงได้เฉพาะวันที่เข้าเวร)';
        }
    }

    // 3. แสดงรายการเวรทั้งหมดของเจ้าหน้าที่ท่านนี้ในเดือนนี้
    renderUserDutyScheduleList(user, userDuties, currentDay);
}

function renderUserDutyScheduleList(user, duties, currentDay) {
    const listEl = document.getElementById('user-duty-schedule-list');
    const badgeEl = document.getElementById('user-duty-total-badge');
    if (!listEl) return;

    if (badgeEl) {
        badgeEl.textContent = `รวม ${toThaiNum(duties.length)} ผลัด`;
    }

    if (duties.length === 0) {
        listEl.innerHTML = `
            <div class="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                ไม่พบรายชื่อของท่านในคำสั่งเวรยามประจำเดือนนี้
            </div>
        `;
        return;
    }

    listEl.innerHTML = duties.map(d => {
        const isToday = d.day === currentDay;
        const isPast = d.day < currentDay;
        const isFuture = d.day > currentDay;

        const dateStr = `2026-10-${String(d.day).padStart(2, '0')}`;
        const recKey = `${user.id}_${dateStr}_${d.shiftType}`;
        const record = appState.todayCheckins[recKey];

        let statusHtml = '';
        let cardBorder = 'border-slate-200 bg-slate-50/50';

        if (isToday) {
            cardBorder = 'border-2 border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-100';
            if (record) {
                statusHtml = `<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white">✅ ลงเวลาแล้ว (${record.checkinTime || record.time})</span>`;
            } else {
                statusHtml = `<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 animate-pulse">🟢 วันนี้ - พร้อมลงเวลา</span>`;
            }
        } else if (isPast) {
            statusHtml = `<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-200 text-slate-600">ผ่านไปแล้ว</span>`;
        } else {
            statusHtml = `<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">⏳ รอถึงวันปฏิบัติหน้าที่</span>`;
        }

        return `
            <div class="p-3.5 rounded-2xl border ${cardBorder} flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition hover:shadow-xs">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 rounded-xl ${d.shiftType === 'night' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'} flex items-center justify-center font-bold text-sm shrink-0">
                        ${toThaiNum(d.day)}
                    </div>
                    <div>
                        <div class="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                            <span>${getThaiDateLabel(d.day)}</span>
                            <span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${d.shiftType === 'night' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-800'}">
                                ${d.shiftType === 'night' ? 'กะกลางคืน' : 'กะกลางวัน'}
                            </span>
                        </div>
                        <div class="text-[11px] text-slate-500 mt-0.5">
                            เวลา: ${d.shiftTitle.split('(')[1].replace(')', '')} • ผู้ตรวจ: ${d.inspector}
                            ${d.coStaff.length > 0 ? ` • ร่วมกับ: ${d.coStaff.join(', ')}` : ''}
                        </div>
                    </div>
                </div>
                <div class="sm:text-right shrink-0">
                    ${statusHtml}
                </div>
            </div>
        `;
    }).join('');
}

function submitCheckin() {
    if (!appState.currentUser) {
        openLoginModal('login');
        showToast('กรุณาเข้าสู่ระบบก่อน', 'กรุณาระบุ Username และ Password เพื่อลงเวลา', 'info');
        return;
    }

    const user = appState.currentUser;
    const currentDay = appState.currentSystemDay || 2;
    const userDuties = getUserDutySchedules(user);
    const todayDuty = userDuties.find(d => d.day === currentDay);

    if (!todayDuty) {
        showToast('ไม่สามารถลงเวลาได้', `วันนี้ (${getThaiDateLabel(currentDay)}) ท่านไม่มีรายชื่อเข้าเวรตามคำสั่งราชการ`, 'error');
        return;
    }

    if (!appState.userLocation.isWithin) {
        showToast('ไม่สามารถลงเวลาได้', 'ท่านอยู่นอกเขตพื้นที่ อบต.ฝางคำ (เกิน 150 เมตร)', 'error');
        return;
    }

    const notesEl = document.getElementById('checkin-notes');
    const notes = notesEl ? notesEl.value.trim() : '';

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} น.`;
    const dateStr = `2026-10-${String(currentDay).padStart(2, '0')}`;
    const recordKey = `${user.id}_${dateStr}_${todayDuty.shiftType}`;

    const actionType = appState.checkinActionType || 'checkin';

    if (actionType === 'checkin') {
        appState.todayCheckins[recordKey] = {
            staffId: user.id,
            staffName: user.name,
            shift: todayDuty.shiftType,
            shiftTitle: todayDuty.shiftTitle,
            date: dateStr,
            time: timeStr,
            checkinTime: timeStr,
            checkoutTime: null,
            distance: appState.userLocation.distance,
            verified: true,
            photo: appState.currentCheckinPhoto || user.avatar,
            notes: notes || 'ปฏิบัติหน้าที่เรียบร้อย ปิดล็อกประตูหน้าต่าง อาคาร อบต. ปกติ',
            inspector: todayDuty.inspector
        };

        showToast('ลงเวลาเข้าเวรสำเร็จ! 🎉', `บันทึกเวลาเข้าเวร ${timeStr} ของ ${user.name} เรียบร้อยแล้ว`, 'success');

        pushLineGroupMessage(
            user.name,
            user.avatar,
            `✅ [ลงเวลาเข้าเวรสำเร็จ]\nข้าพเจ้า: ${user.name}\n• วันที่: ${getThaiDateLabel(currentDay)}\n• ผลัด: ${todayDuty.shiftTitle}\n• เวลาเข้าเวร: ${timeStr}\n• พิกัด: ในเขต อบต.ฝางคำ (ห่าง ${appState.userLocation.distance} ม.)\n• ผู้ตรวจเวร: ${todayDuty.inspector}\n• รายงาน: ${notes || 'ปฏิบัติหน้าที่เรียบร้อย เหตุการณ์ปกติ'}`,
            'คนเข้าเวร'
        );
    } else {
        // ลงเวลาออกเวร (Check-out)
        let rec = appState.todayCheckins[recordKey] || {
            staffId: user.id,
            staffName: user.name,
            shift: todayDuty.shiftType,
            shiftTitle: todayDuty.shiftTitle,
            date: dateStr,
            checkinTime: '16:30 น.',
            distance: appState.userLocation.distance,
            verified: true,
            photo: appState.currentCheckinPhoto || user.avatar
        };

        rec.checkoutTime = timeStr;
        rec.checkoutNotes = notes || 'ปฏิบัติหน้าที่เรียบร้อยตลอดผลัด ส่งมอบหน้าที่และกุญแจเรียบร้อย เหตุการณ์ปกติ';
        if (appState.currentCheckinPhoto) {
            rec.checkoutPhoto = appState.currentCheckinPhoto;
        }
        appState.todayCheckins[recordKey] = rec;

        showToast('ลงเวลาออกเวรสำเร็จ! 🏁', `บันทึกการส่งมอบเวรและออกเวร ${timeStr} เรียบร้อยแล้ว`, 'success');

        pushLineGroupMessage(
            user.name,
            user.avatar,
            `🔴 [ส่งมอบเวร/ออกเวรเรียบร้อย]\nข้าพเจ้า: ${user.name}\n• วันที่: ${getThaiDateLabel(currentDay)}\n• ผลัด: ${todayDuty.shiftTitle}\n• เวลาออกเวร: ${timeStr}\n• รายงาน: ${rec.checkoutNotes}\n• ส่งมอบทรัพย์สินและอาคารที่ทำการ อบต.ฝางคำ เรียบร้อย`,
            'คนเข้าเวร'
        );
    }

    renderDashboard();
    renderCheckinTab();
}

// -------------------------------------------------------------
// ระบบสมุดตรวจเวรยาม (ผู้ตรวจเวร)
// -------------------------------------------------------------
let sigPad = {
    canvas: null,
    ctx: null,
    isDrawing: false
};

function initSignaturePad() {
    const canvas = document.getElementById('sig-canvas');
    if (!canvas) return;

    sigPad.canvas = canvas;
    sigPad.ctx = canvas.getContext('2d');
    sigPad.ctx.lineWidth = 2.5;
    sigPad.ctx.lineCap = 'round';
    sigPad.ctx.strokeStyle = '#0f172a';

    const getPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: (clientX - rect.left) * (canvas.width / rect.width),
            y: (clientY - rect.top) * (canvas.height / rect.height)
        };
    };

    const startDraw = (e) => {
        sigPad.isDrawing = true;
        const pos = getPos(e);
        sigPad.ctx.beginPath();
        sigPad.ctx.moveTo(pos.x, pos.y);
        e.preventDefault();
    };

    const draw = (e) => {
        if (!sigPad.isDrawing) return;
        const pos = getPos(e);
        sigPad.ctx.lineTo(pos.x, pos.y);
        sigPad.ctx.stroke();
        e.preventDefault();
    };

    const stopDraw = () => {
        sigPad.isDrawing = false;
    };

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    window.addEventListener('mouseup', stopDraw);

    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    window.addEventListener('touchend', stopDraw);
}

function clearSignature() {
    if (sigPad.canvas && sigPad.ctx) {
        sigPad.ctx.clearRect(0, 0, sigPad.canvas.width, sigPad.canvas.height);
        showToast('ล้างลายเซ็นแล้ว', 'สามารถลงลายมือชื่อใหม่ได้ทันที', 'info');
    }
}

function submitInspection() {
    const inspectorSelect = document.getElementById('inspect-inspector-select');
    const staffPresent = document.getElementById('inspect-staff-present').checked;
    const premiseNormal = document.getElementById('inspect-premise-normal').checked;
    const remark = document.getElementById('inspect-remark').value.trim();

    const inspectorName = inspectorSelect ? inspectorSelect.value : appState.currentUser.name;

    const newInsp = {
        id: 'insp-' + Date.now(),
        inspector: inspectorName,
        date: '2026-10-02',
        time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.',
        staffPresent,
        premiseNormal,
        remark: remark || 'ตรวจตราเรียบร้อย ไม่พบสิ่งผิดปกติ',
        hasSig: true
    };

    appState.inspections.unshift(newInsp);
    renderDashboard();

    showToast('บันทึกการตรวจเวรสำเร็จ', `บันทึกการตรวจของ ${inspectorName} เรียบร้อยแล้ว`, 'success');

    // แจ้งเตือนเข้า LINE กลุ่ม
    pushLineGroupMessage(
        inspectorName,
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
        `📋 [รายงานผลการตรวจเวรยาม]\nผู้ตรวจ: ${inspectorName}\n• ผลการตรวจ: ${staffPresent ? 'พบเจ้าหน้าที่อยู่ปฏิบัติงาน' : 'ไม่พบเจ้าหน้าที่'}\n• สภาพสถานที่: ${premiseNormal ? 'เรียบร้อยปกติ' : 'มีข้อผิดปกติ'}\n• ข้อสังเกต: ${remark || 'ความสงบเรียบร้อยดี'}`,
        'ผู้ตรวจเวร'
    );

    clearSignature();
}

// -------------------------------------------------------------
// ระบบสลับเวร (Swap Duty)
// -------------------------------------------------------------
function submitSwapRequest() {
    const reqEl = document.getElementById('swap-requester');
    const subEl = document.getElementById('swap-substitute');
    const reasonEl = document.getElementById('swap-reason');

    if (!reqEl || !subEl) return;

    const requester = reqEl.value;
    const substitute = subEl.value;
    const reason = reasonEl ? reasonEl.value.trim() : '';

    if (requester === substitute) {
        showToast('ไม่สามารถสลับได้', 'ผู้ขอสลับและผู้ปฏิบัติหน้าที่แทนต้องไม่ใช่คนเดียวกัน', 'warning');
        return;
    }

    const reqUser = ALL_SYSTEM_USERS.find(u => u.name === requester);
    const subUser = ALL_SYSTEM_USERS.find(u => u.name === substitute);

    if (reqUser && subUser && reqUser.gender !== subUser.gender) {
        showToast('ผิดระเบียบ อบต.ฝางคำ', 'กะกลางวันเป็นเพศหญิง และกะกลางคืนเป็นเพศชาย ต้องสลับกับเพศเดียวกันเท่านั้น', 'error');
        return;
    }

    const newSwap = {
        id: 'sw-' + Date.now(),
        requester,
        substitute,
        date: '2026-10-05',
        status: 'pending',
        statusText: 'รอปลัด อบต. อนุมัติ',
        reason: reason || 'ติดภารกิจราชการจำเป็น'
    };

    appState.swapRequests.unshift(newSwap);
    renderSwapList();
    showToast('ยื่นคำขอสลับเวรแล้ว', 'ระบบส่งคำขอให้ปลัด อบต. พิจารณาอนุมัติตามระเบียบสารบรรณแล้ว', 'success');

    pushLineGroupMessage(
        requester,
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80',
        `🔄 [คำขอสลับเวรราชการ]\nข้าพเจ้า ${requester} มีความจำเป็นขอสลับเวรกับ ${substitute}\n• เหตุผล: ${reason || 'ติดภารกิจราชการ'}\n• สถานะ: ยื่นเสนอ ปลัด อบต. พิจารณาอนุมัติ`,
        'ขอสลับเวร'
    );
}

function renderSwapList() {
    const container = document.getElementById('swap-requests-list');
    if (!container) return;

    container.innerHTML = appState.swapRequests.map(item => `
        <div class="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
            <div>
                <div class="font-bold text-slate-800">${item.requester} ➔ ${item.substitute}</div>
                <div class="text-[11px] text-slate-500 mt-0.5">${item.reason}</div>
            </div>
            <span class="px-2.5 py-1 rounded-full font-semibold ${item.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
                ${item.statusText}
            </span>
        </div>
    `).join('');
}

// -------------------------------------------------------------
// ระบบจำลอง LINE Bot Simulator
// -------------------------------------------------------------
function pushLineGroupMessage(senderName, avatar, text, badge, isSystem = false) {
    const container = document.getElementById('line-chat-messages');
    if (!container) return;

    const msgDiv = document.createElement('div');
    const timeNow = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

    if (isSystem) {
        msgDiv.className = 'flex justify-center my-2';
        msgDiv.innerHTML = `
            <div class="bg-black/30 backdrop-blur-xs text-white text-[10px] px-3 py-1 rounded-full text-center max-w-[85%]">
                ${text}
            </div>
        `;
    } else {
        msgDiv.className = 'flex items-start space-x-2 my-2.5';
        msgDiv.innerHTML = `
            <img src="${avatar}" class="w-8 h-8 rounded-full object-cover border border-white/50 flex-shrink-0" alt="${senderName}">
            <div class="max-w-[78%]">
                <div class="flex items-center space-x-1.5 mb-0.5">
                    <span class="text-xs font-semibold text-white drop-shadow-xs">${senderName}</span>
                    ${badge ? `<span class="text-[9px] px-1.5 py-0.2 rounded bg-white/20 text-white font-medium">${badge}</span>` : ''}
                </div>
                <div class="bg-white text-slate-900 rounded-2xl rounded-tl-xs p-3 shadow text-xs whitespace-pre-line leading-relaxed">
                    ${text}
                </div>
                <div class="text-[9px] text-white/70 mt-0.5 pl-1">${timeNow} น.</div>
            </div>
        `;
    }

    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
}

// ฟังก์ชันจำลองการส่งแจ้งเตือนเข้ากลุ่ม LINE
// หมายเหตุสำคัญ: navigateToChat เป็น false เป็นค่าเริ่มต้น เพื่อไม่ให้หน้าเว็บเด้งไปหน้าจำลองไลน์เวลาโหลดหน้าแรก
function simulatePushNotification(shiftType, navigateToChat = false) {
    if (shiftType === 'night') {
        pushLineGroupMessage(
            '🤖 บอทเวรยาม อบต.ฝางคำ',
            'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80',
            `📢 [แจ้งเตือนเตรียมเข้าเวรกลางคืน]\nเรียน จ.ส.อ.เกียรติพล หาทรัพย์\nท่านมีหน้าที่เข้าเวรผลัดค่ำคืนนี้ (๒ ตุลาคม ๒๕๖๙)\n• เวลา: ๑๖.๓๐ - ๐๘.๐๐ น.\n• ผู้ตรวจเวร: นายวุฒิศักดิ์ บุตรสิงห์\nกรุณาลงเวลาและถ่ายรูปรายงานตัวภายในรัศมี ๑๕๐ ม.`,
            'LINE Bot',
            false
        );
        showToast('ส่งแจ้งเตือนกะกลางคืนแล้ว', 'ส่งข้อความเตือน จ.ส.อ.เกียรติพล หาทรัพย์ เข้ากลุ่ม LINE แล้ว', 'info');
    } else {
        pushLineGroupMessage(
            '🤖 บอทเวรยาม อบต.ฝางคำ',
            'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80',
            `📢 [แจ้งเตือนเตรียมเข้าเวรวันพรุ่งนี้]\nเรียน นางสาวอำพร ทองสวัสดิ์, นางสาวธิดาลักษณ์ โสแก้ว, นางต้องตาประภา โพธิ์งาม\nท่านมีหน้าที่เข้าเวรกลางวัน (เสาร์ ๓ ตุลาคม ๒๕๖๙)\n• เวลา: ๐๘.๐๐ - ๑๖.๓๐ น.\n• ผู้ตรวจเวร: นางวาสนา สินทรัพย์`,
            'LINE Bot',
            false
        );
        showToast('ส่งแจ้งเตือนกะกลางวันแล้ว', 'ส่งข้อความเตือนเจ้าหน้าที่เวรกลางวันเข้ากลุ่ม LINE แล้ว', 'info');
    }

    if (navigateToChat) {
        switchTab('line-sim');
    }
}

function initLineChatDefaultMessages() {
    const container = document.getElementById('line-chat-messages');
    if (!container || container.children.length > 0) return;

    pushLineGroupMessage('', '', 'ยินดีต้อนรับสู่กลุ่มประสานงานเวรยาม อบต.ฝางคำ (๓๒ สมาชิก)', '', true);
    pushLineGroupMessage(
        'นายชาญชัย อักโข',
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80',
        'เรียน เจ้าหน้าที่ผู้มีรายนามตามคำสั่งเวรยามเดือน ตุลาคม ๒๕๖๙ ทุกท่าน กรุณาลงเวลาเข้าเวรและตรวจเวรผ่านระบบดิจิทัลด้วยครับ',
        'หน.สำนักปลัด'
    );
}

// -------------------------------------------------------------
// ระบบส่งข้อความแชร์เข้ากลุ่ม LINE OpenChat ของ อบต.ฝางคำ
// -------------------------------------------------------------
let currentShareText = '';

function openLineShareModal(title, text) {
    currentShareText = text;
    const modal = document.getElementById('line-share-modal');
    const preview = document.getElementById('line-share-text-preview');
    if (preview) preview.value = text;
    
    // คัดลอกลงคลิปบอร์ดให้อัตโนมัติทันที
    try {
        navigator.clipboard.writeText(text);
    } catch(e) {}

    if (modal) modal.classList.remove('hidden');
    showToast('คัดลอกข้อความแล้ว 📋', 'คัดลอกข้อความสรุปเรียบร้อย สามารถเปิด LINE แล้วกด วาง (Ctrl+V) ได้เลย', 'success');
}

function closeLineShareModal() {
    const modal = document.getElementById('line-share-modal');
    if (modal) modal.classList.add('hidden');
}

function copyCurrentShareText() {
    if (!currentShareText) return;
    try {
        navigator.clipboard.writeText(currentShareText);
        showToast('คัดลอกสำเร็จ! 📋', 'คัดลอกข้อความลงคลิปบอร์ดเรียบร้อยแล้ว', 'success');
    } catch(e) {
        showToast('คัดลอกด้วยตนเอง', 'กรุณาลากคลุมข้อความในกล่องแล้วกด Ctrl+C', 'warning');
    }
}

function openNativeLineApp() {
    // เปิดแอป LINE โดยตรงผ่าน URL Scheme (ไม่ผ่าน web plugin ที่เกิด Error 400)
    try {
        window.location.href = 'line://';
    } catch(e) {}
    showToast('เปิดแอป LINE', 'หากแอป LINE เปิดแล้ว ให้เข้าไปที่ห้อง OpenChat อบต.ฝางคำ แล้วกดวาง (Ctrl+V) ได้เลยครับ', 'info');
}

function shareDutyToLineOpenChat() {
    const currentOrigin = (typeof window !== 'undefined' && window.location.origin) ? window.location.origin : 'http://localhost:8080';
    const msg = `📢 [ประกาศตารางเวรยาม อบต.ฝางคำ ประจำวันศุกร์ที่ ๒ ต.ค. ๒๕๖๙]
🏛️ ที่ทำการ อบต.ฝางคำ อ.สิรินธร จ.อุบลราชธานี

🌙 เวรกลางคืน คืนนี้ (๑๖.๓๐ - ๐๘.๐๐ น.):
• ผู้อยู่เวร: จ.ส.อ.เกียรติพล หาทรัพย์ (กองช่าง)
• ผู้ตรวจเวร: นายวุฒิศักดิ์ บุตรสิงห์ (กองช่าง)

☀️ ผลัดถัดไป เวรกลางวัน (เสาร์ ๓ ต.ค. ๒๕๖๙):
• ผู้อยู่เวร: นางสาวอำพร ทองสวัสดิ์, นางสาวธิดาลักษณ์ โสแก้ว, นางต้องตาประภา โพธิ์งาม
• ผู้ตรวจเวร: นางวาสนา สินทรัพย์

📍 เจ้าหน้าที่ลงเวลาเข้าเวร (GPS ในรัศมี ๑๕๐ ม.) และตรวจเวรได้ที่:
${currentOrigin}/`;

    openLineShareModal('ประกาศตารางเวรยาม อบต.ฝางคำ', msg);
}

function shareCheckinToLineOpenChat() {
    const user = appState.currentUser;
    if (!user) {
        showToast('กรุณาเข้าสู่ระบบก่อน', 'เข้าสู่ระบบเพื่อสร้างข้อความรายงานของท่าน', 'info');
        return;
    }

    const currentDay = appState.currentSystemDay || 2;
    const userDuties = getUserDutySchedules(user);
    const todayDuty = userDuties.find(d => d.day === currentDay);
    const dateStr = `2026-10-${String(currentDay).padStart(2, '0')}`;
    const recordKey = todayDuty ? `${user.id}_${dateStr}_${todayDuty.shiftType}` : null;
    const record = recordKey ? appState.todayCheckins[recordKey] : null;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} น.`;
    const notesEl = document.getElementById('checkin-notes');
    const notes = notesEl ? notesEl.value.trim() : '';

    const isCheckout = appState.checkinActionType === 'checkout';

    let msg = '';
    if (isCheckout) {
        msg = `🏁 [รายงานการส่งมอบเวรและออกเวร - อบต.ฝางคำ]
ข้าพเจ้า: ${user.name} (${user.dept})
• วันที่: ${getThaiDateLabel(currentDay)}
• ผลัดเวร: ${todayDuty ? todayDuty.shiftTitle : 'เวรยามประจำวัน'}
• เวลาออกเวร: ${record ? (record.checkoutTime || timeStr) : timeStr}
• พิกัด: ในเขตที่ทำการ อบต.ฝางคำ (ห่าง ${appState.userLocation.distance} ม.)
• สรุปผล: ${notes || (record ? record.checkoutNotes : 'ปฏิบัติหน้าที่เรียบร้อยตลอดผลัด เหตุการณ์ปกติ ส่งมอบอาคารและทรัพย์สิน')}
• ลายมือชื่อดิจิทัลและภาพถ่ายประทับเวลาในระบบเรียบร้อย

ระบบบริหารจัดการเวรยามดิจิทัล อบต.ฝางคำ ๒๕๖๙`;
    } else {
        msg = `✅ [รายงานการลงเวลาเข้าเวรยาม - อบต.ฝางคำ]
ข้าพเจ้า: ${user.name} (${user.dept})
• วันที่: ${getThaiDateLabel(currentDay)}
• ผลัดเวร: ${todayDuty ? todayDuty.shiftTitle : 'เวรยามประจำวัน'}
• เวลาเข้าเวร: ${record ? (record.checkinTime || record.time) : timeStr}
• ผู้ตรวจเวร: ${todayDuty ? todayDuty.inspector : 'ผู้ตรวจเวรประจำวัน'}
• พิกัด: ในเขตที่ทำการ อบต.ฝางคำ (ห่าง ${appState.userLocation.distance} ม.)
• สภาพทั่วไป: ${notes || 'ทรัพย์สินทางราชการเรียบร้อย ปิดล็อกประตูหน้าต่างปกติ'}

ระบบบริหารจัดการเวรยามดิจิทัล อบต.ฝางคำ ๒๕๖๙`;
    }

    openLineShareModal(isCheckout ? 'รายงานการส่งมอบและออกเวร' : 'รายงานการลงเวลาเข้าเวร', msg);
}

function shareInspectionToLineOpenChat() {
    const inspectorSelect = document.getElementById('inspect-inspector-select');
    const inspectorName = inspectorSelect ? inspectorSelect.value : appState.currentUser.name;
    const staffPresent = document.getElementById('inspect-staff-present') ? document.getElementById('inspect-staff-present').checked : true;
    const premiseNormal = document.getElementById('inspect-premise-normal') ? document.getElementById('inspect-premise-normal').checked : true;
    const remarkEl = document.getElementById('inspect-remark');
    const remark = remarkEl ? remarkEl.value.trim() : '';

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} น.`;

    const msg = `📋 [รายงานผลการตรวจเวรยาม อบต.ฝางคำ]
ผู้ตรวจเวร: ${inspectorName}
• วันที่: ๒ ตุลาคม ๒๕๖๙ เวลา: ${timeStr}
• การปฏิบัติหน้าที่: ${staffPresent ? 'พบเจ้าหน้าที่อยู่ปฏิบัติเวรยามเรียบร้อย' : 'ไม่พบเจ้าหน้าที่'}
• อาคารและทรัพย์สิน: ${premiseNormal ? 'เรียบร้อยปกติ' : 'มีข้อควรระวัง'}
• บันทึกเพิ่มเติม: ${remark || 'ตรวจตราความสงบเรียบร้อยรอบอาคาร อบต.ฝางคำ เหตุการณ์ปกติ'}
• การลงนาม: ลงลายมือชื่อดิจิทัลรับรองผลเรียบร้อย

ระบบบริหารจัดการเวรยามดิจิทัล อบต.ฝางคำ ๒๕๖๙`;

    openLineShareModal('รายงานผลการตรวจเวรยาม', msg);
}

// -------------------------------------------------------------
// ระบบแนบไฟล์และเปิดดูเอกสารคำสั่ง (PDF File Management)
// -------------------------------------------------------------
function renderAttachedPdfList() {
    const container = document.getElementById('attached-pdf-list');
    if (!container) return;

    if (appState.attachedPdfs.length === 0) {
        container.innerHTML = `
            <div class="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                ยังไม่มีไฟล์คำสั่ง PDF ที่แนบไว้ ท่านสามารถกดปุ่ม "แนบไฟล์คำสั่ง PDF ใหม่" ด้านบน
            </div>
        `;
        return;
    }

    container.innerHTML = appState.attachedPdfs.map(pdf => `
        <div class="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-start space-x-3 min-w-0">
                <div class="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 text-xl flex-shrink-0">
                    📄
                </div>
                <div class="min-w-0">
                    <div class="font-bold text-xs text-slate-900 truncate">${pdf.name}</div>
                    <div class="text-[11px] text-slate-500 mt-0.5">
                        ขนาด: <span class="font-medium text-slate-700">${pdf.size}</span> • อัปโหลดเมื่อ: ${pdf.uploadDate} โดย ${pdf.uploader}
                    </div>
                    ${pdf.note ? `<div class="text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded mt-1 inline-block">${pdf.note}</div>` : ''}
                </div>
            </div>
            <div class="flex items-center space-x-2 flex-shrink-0">
                <button onclick="viewPdfFile('${pdf.id}')" class="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition flex items-center space-x-1">
                    <span>👁️ เปิดดูไฟล์</span>
                </button>
                <button onclick="downloadPdfFile('${pdf.id}')" class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center space-x-1">
                    <span>⬇️ ดาวน์โหลด</span>
                </button>
                ${!pdf.isDefault ? `
                    <button onclick="deletePdfFile('${pdf.id}')" class="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition" title="ลบไฟล์">
                        🗑️
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function handlePdfUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
        showToast('ไฟล์ไม่ถูกต้อง', 'กรุณาเลือกไฟล์เอกสารนามสกุล .pdf เท่านั้น', 'error');
        return;
    }

    const sizeKb = Math.round(file.size / 1024);
    const sizeStr = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;
    const now = new Date();
    const dateStr = `${now.getDate()} ต.ค. ๒๕๖๙ ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} น.`;

    const newPdf = {
        id: 'pdf-' + Date.now(),
        name: file.name,
        size: sizeStr,
        uploadDate: dateStr,
        uploader: appState.currentUser.name,
        note: 'ไฟล์คำสั่งแนบเพิ่มเติม',
        isDefault: false
    };

    appState.attachedPdfs.unshift(newPdf);
    renderAttachedPdfList();
    showToast('แนบไฟล์คำสั่งสำเร็จ! 🎉', `ไฟล์ "${file.name}" ถูกบันทึกเข้าสู่ระบบ อบต.ฝางคำ แล้ว`, 'success');
}

function viewPdfFile(id) {
    const pdf = appState.attachedPdfs.find(p => p.id === id);
    if (!pdf) return;

    const modal = document.getElementById('pdf-preview-modal');
    const titleEl = document.getElementById('pdf-preview-title');
    const container = document.getElementById('pdf-preview-frame-container');

    if (!modal || !titleEl || !container) return;

    titleEl.textContent = pdf.name;
    container.innerHTML = `
        <div class="h-full bg-white rounded-2xl border border-slate-300 shadow-inner flex flex-col p-6 overflow-y-auto">
            <div class="text-center pb-4 border-b border-slate-200">
                <div class="text-4xl">🦅</div>
                <div class="text-sm font-bold text-slate-800 mt-1">คำสั่งองค์การบริหารส่วนตำบลฝางคำ</div>
                <div class="text-xs text-slate-500">${pdf.name}</div>
                <div class="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-2">
                    ✓ มีการลงลายมือชื่อดิจิทัลและตราครุฑรับรองความถูกต้อง
                </div>
            </div>
            <div class="flex-1 py-6 space-y-4 text-xs text-slate-700 leading-relaxed font-serif">
                <p class="indent-6">
                    ตามคำสั่ง อบต.ฝางคำ เรื่อง แต่งตั้งเจ้าหน้าที่อยู่เวรรักษาการณ์สถานที่ราชการ ประจำเดือน ตุลาคม พ.ศ. ๒๕๖๙ 
                    เพื่อให้การดูแลรักษาทรัพย์สินและความปลอดภัยของที่ทำการ อบต.ฝางคำ เป็นไปด้วยความเรียบร้อย
                </p>
                <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div class="font-bold mb-2">สรุปรายชื่อผู้ปฏิบัติหน้าที่ตามคำสั่งนี้:</div>
                    <div>• กะกลางวัน (หญิง): จำนวน ๑๑ ท่าน (ปฏิบัติหน้าที่วันหยุดราชการ เวลา ๐๘.๐๐ - ๑๖.๓๐ น.)</div>
                    <div>• กะกลางคืน (ชาย): จำนวน ๑๔ ท่าน (ปฏิบัติหน้าที่ทุกคืน เวลา ๑๖.๓๐ - ๐๘.๐๐ น.)</div>
                    <div>• ผู้ตรวจเวรยาม: จำนวน ๔ ท่าน (ตรวจเวรและรายงานความสงบเรียบร้อย)</div>
                </div>
                <p class="indent-6 text-slate-500">
                    [ไฟล์ต้นฉบับเอกสาร PDF ได้รับการประทับเวลาและจัดเก็บในคลังเอกสารดิจิทัล อบต.ฝางคำ เรียบร้อยแล้ว]
                </p>
            </div>
            <div class="pt-4 border-t border-slate-200 flex justify-end space-x-2">
                <button onclick="downloadPdfFile('${pdf.id}')" class="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-emerald-700 transition">
                    ⬇️ ดาวน์โหลดเอกสารฉบับนี้
                </button>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
}

function closePdfPreviewModal() {
    const modal = document.getElementById('pdf-preview-modal');
    if (modal) modal.classList.add('hidden');
}

function downloadPdfFile(id) {
    const pdf = appState.attachedPdfs.find(p => p.id === id);
    const fileName = pdf ? pdf.name : 'คำสั่งเวรยาม_อบต_ฝางคำ.pdf';
    showToast('กำลังดาวน์โหลด', `ระบบกำลังดาวน์โหลดไฟล์ "${fileName}" ลงสู่เครื่องของท่าน...`, 'info');
}

function deletePdfFile(id) {
    if (!confirm('ท่านต้องการลบไฟล์คำสั่งนี้ใช่หรือไม่?')) return;
    appState.attachedPdfs = appState.attachedPdfs.filter(p => p.id !== id);
    renderAttachedPdfList();
    showToast('ลบไฟล์เรียบร้อย', 'ไฟล์คำสั่งถูกลบออกจากระบบแล้ว', 'info');
}

// -------------------------------------------------------------
// ระบบตารางพิมพ์คำสั่งทางการ (Print Table Document)
// -------------------------------------------------------------
function renderPrintDocument() {
    const tbody = document.getElementById('print-table-body');
    if (!tbody) return;

    let rowsHtml = '';
    let rowIdx = 1;

    appState.schedules.forEach(s => {
        // เวรกลางวัน (ถ้ามี)
        if (s.dayDuty) {
            rowsHtml += `
                <tr class="border-b border-black">
                    <td class="border border-black py-1.5 px-1 text-center">${rowIdx++}</td>
                    <td class="border border-black py-1.5 px-2 text-center">${s.day} ต.ค. ๖๙</td>
                    <td class="border border-black py-1.5 px-2 text-center">กลางวัน (08.00-16.30)</td>
                    <td class="border border-black py-1.5 px-2">${s.dayDuty.staff.join('<br>')}</td>
                    <td class="border border-black py-1.5 px-2 text-center">พนักงานส่วนตำบล</td>
                    <td class="border border-black py-1.5 px-2 text-center">${s.dayDuty.inspector}</td>
                    <td class="border border-black py-1.5 px-2 text-center">....................</td>
                </tr>
            `;
        }

        // เวรกลางคืน
        rowsHtml += `
            <tr class="border-b border-black">
                <td class="border border-black py-1.5 px-1 text-center">${rowIdx++}</td>
                <td class="border border-black py-1.5 px-2 text-center">${s.day} ต.ค. ๖๙</td>
                <td class="border border-black py-1.5 px-2 text-center">กลางคืน (16.30-08.00)</td>
                <td class="border border-black py-1.5 px-2">${s.nightDuty.staff[0]}</td>
                <td class="border border-black py-1.5 px-2 text-center">พนักงานส่วนตำบล</td>
                <td class="border border-black py-1.5 px-2 text-center">${s.nightDuty.inspector}</td>
                <td class="border border-black py-1.5 px-2 text-center">....................</td>
            </tr>
        `;
    });

    tbody.innerHTML = rowsHtml;
}

// -------------------------------------------------------------
// ระบบตั้งค่า (Settings Management)
// -------------------------------------------------------------
function loadSettingsToForm() {
    const s = appState.settings;
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
    };

    setVal('setting-org-name', s.orgName);
    setVal('setting-subdistrict', s.subdistrict);
    setVal('setting-district', s.district);
    setVal('setting-province', s.province);
    setVal('setting-phone', s.phone);
    setVal('setting-emergency-phone', s.emergencyPhone);
    setVal('setting-mayor-name', s.mayorName);
    setVal('setting-clerk-name', s.clerkName);
    setVal('setting-lat', s.lat);
    setVal('setting-lng', s.lng);
    setVal('setting-radius', s.radius);
    setVal('setting-day-time', s.dayTime);
    setVal('setting-night-time', s.nightTime);
    setVal('setting-line-token', s.lineToken);
    setVal('setting-line-group-id', s.lineGroupId);
    setVal('setting-line-morning-time', s.lineMorningTime);
    setVal('setting-line-evening-time', s.lineEveningTime);
}

function saveSettingsFromForm(event) {
    if (event) event.preventDefault();

    const getVal = (id) => {
        const el = document.getElementById(id);
        return el ? el.value.trim() : '';
    };

    appState.settings = {
        orgName: getVal('setting-org-name') || DEFAULT_SETTINGS.orgName,
        subdistrict: getVal('setting-subdistrict') || DEFAULT_SETTINGS.subdistrict,
        district: getVal('setting-district') || DEFAULT_SETTINGS.district,
        province: getVal('setting-province') || DEFAULT_SETTINGS.province,
        phone: getVal('setting-phone') || DEFAULT_SETTINGS.phone,
        emergencyPhone: getVal('setting-emergency-phone') || DEFAULT_SETTINGS.emergencyPhone,
        mayorName: getVal('setting-mayor-name') || DEFAULT_SETTINGS.mayorName,
        clerkName: getVal('setting-clerk-name') || DEFAULT_SETTINGS.clerkName,
        lat: parseFloat(getVal('setting-lat')) || DEFAULT_SETTINGS.lat,
        lng: parseFloat(getVal('setting-lng')) || DEFAULT_SETTINGS.lng,
        radius: parseInt(getVal('setting-radius')) || DEFAULT_SETTINGS.radius,
        dayTime: getVal('setting-day-time') || DEFAULT_SETTINGS.dayTime,
        nightTime: getVal('setting-night-time') || DEFAULT_SETTINGS.nightTime,
        lineToken: getVal('setting-line-token') || DEFAULT_SETTINGS.lineToken,
        lineGroupId: getVal('setting-line-group-id') || DEFAULT_SETTINGS.lineGroupId,
        lineMorningTime: getVal('setting-line-morning-time') || DEFAULT_SETTINGS.lineMorningTime,
        lineEveningTime: getVal('setting-line-evening-time') || DEFAULT_SETTINGS.lineEveningTime
    };

    try {
        localStorage.setItem('fangkham_settings_v1', JSON.stringify(appState.settings));
    } catch(e) {}

    showToast('บันทึกการตั้งค่าสำเร็จ! 💾', 'การตั้งค่าระบบ พิกัด GPS และการเชื่อมต่อ LINE ถูกบันทึกแล้ว', 'success');
}

function resetSettingsToDefault() {
    if (!confirm('ต้องการคืนค่าการตั้งค่าเริ่มต้นใช่หรือไม่?')) return;
    appState.settings = { ...DEFAULT_SETTINGS };
    loadSettingsToForm();
    showToast('คืนค่าเริ่มต้นเรียบร้อย', 'ข้อมูลการตั้งค่าถูกรีเซ็ตกลับเป็นค่ามาตรฐาน อบต.ฝางคำ', 'info');
}

// -------------------------------------------------------------
// ระบบสารบรรณคู่มือการใช้งาน (Saraban TOC Scroll)
// -------------------------------------------------------------
function scrollToSection(secId) {
    const el = document.getElementById(secId);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// -------------------------------------------------------------
// ฟังก์ชันเติมตัวเลือกใน Select ต่างๆ
// -------------------------------------------------------------
function populateSelectOptions() {
    // 1. Checkin Tab setup
    renderCheckinTab();

    // 2. Inspector Select options
    const inspSelect = document.getElementById('inspect-inspector-select');
    if (inspSelect) {
        const inspectors = ALL_SYSTEM_USERS.filter(u => u.category === 'inspector');
        inspSelect.innerHTML = inspectors.map(i => `
            <option value="${i.name}">${i.name} (${i.roleName})</option>
        `).join('');
    }

    // 3. Swap Requester & Substitute options
    const swapReq = document.getElementById('swap-requester');
    const swapSub = document.getElementById('swap-substitute');
    if (swapReq && swapSub) {
        const allStaff = ALL_SYSTEM_USERS.filter(u => u.category === 'night' || u.category === 'day');
        const opts = allStaff.map(u => `<option value="${u.name}">${u.name} (${u.roleName})</option>`).join('');
        swapReq.innerHTML = opts;
        swapSub.innerHTML = opts;
        if (swapSub.options.length > 1) swapSub.selectedIndex = 1;
    }
}

// -------------------------------------------------------------
// เริ่มการทำงานของระบบ (Initialize on Page Load)
// -------------------------------------------------------------
window.onload = function() {
    // 1. โหลดข้อมูลการตั้งค่าจาก LocalStorage (ถ้ามี)
    try {
        const savedSettings = localStorage.getItem('fangkham_settings_v1');
        if (savedSettings) {
            appState.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
        }
    } catch(e) {}

    // 2. สร้างโครงสร้างข้อมูลตารางเวร 31 วัน
    buildOctober2569Schedules();

    // 3. เติมตัวเลือกและข้อมูลลงฟอร์ม
    populateSelectOptions();
    loadSettingsToForm();
    renderPrintDocument();
    renderAttachedPdfList();
    renderSwapList();
    initSignaturePad();
    initLineChatDefaultMessages();

    // 4. แสดงผลข้อมูลผู้ใช้งานปัจจุบัน
    updateAuthUI();

    // 5. ส่งแจ้งเตือนจำลองในระบบหลังบ้าน (ไม่สลับหน้าจอ)
    simulatePushNotification('night', false);

    // 6. บังคับเปิดหน้าแรกที่ "หน้า Dashboard" เสมอ!
    switchTab('dashboard');

    // 7. นาฬิกา Real-time
    const updateClock = () => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('th-TH');
        const clockEl = document.getElementById('live-time-display');
        if (clockEl) clockEl.textContent = timeStr;
    };
    updateClock();
    setInterval(updateClock, 1000);
};
