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
// -------------------------------------------------------------
// บัญชีผู้ใช้งานระบบ อบต.ฝางคำ ทั้งหมด 30 ท่าน (อ้างอิงคำสั่ง ต.ค. 2569)
// พร้อมตำแหน่งราชการ สังกัดกอง เบอร์โทรศัพท์ และสิทธิ์การใช้งาน
// -------------------------------------------------------------
const INITIAL_SYSTEM_USERS = [
    // 1. ผู้ดูแลระบบ & ผู้บริหาร
    { id: 'admin', username: 'admin', defaultPass: '1234', name: 'นายชาญชัย อักโข', position: 'หัวหน้าสำนักปลัด', role: 'admin', roleName: 'ผู้ดูแลระบบ (Admin) / หัวหน้าสำนักปลัด', category: 'admin', dept: 'สำนักปลัด', gender: 'male', phone: '089-111-2233', dutyDays: 'จัดการระบบ / ตรวจเวร', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80', badge: 'bg-purple-100 text-purple-800 border-purple-200' },
    { id: 'exec', username: 'palad', defaultPass: '1234', name: 'ปลัด อบต.ฝางคำ', position: 'ปลัด อบต.ฝางคำ', role: 'executive', roleName: 'ผู้บริหาร (Executive)', category: 'admin', dept: 'ผู้บริหาร อบต.ฝางคำ', gender: 'male', phone: '081-999-8877', dutyDays: 'อนุมัติคำสั่งราชการ', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=120&q=80', badge: 'bg-rose-100 text-rose-800 border-rose-200' },

    // 2. ผู้ตรวจเวรยาม (4 ท่าน)
    { id: 'insp_1', username: 'chanchai', defaultPass: '1234', name: 'นายชาญชัย อักโข', position: 'หัวหน้าสำนักปลัด', role: 'inspector', roleName: 'ผู้ตรวจเวร / หัวหน้าสำนักปลัด', category: 'inspector', dept: 'สำนักปลัด', gender: 'male', phone: '089-111-2233', dutyDays: 'ตรวจเวรวันที่ 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31 ต.ค.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80', badge: 'bg-blue-100 text-blue-800 border-blue-200' },
    { id: 'insp_2', username: 'wuttisak', defaultPass: '1234', name: 'นายวุฒิศักดิ์ บุตรสิงห์', position: 'ผู้อำนวยการกองช่าง', role: 'inspector', roleName: 'ผู้ตรวจเวร / ผอ.กองช่าง', category: 'inspector', dept: 'กองช่าง', gender: 'male', phone: '084-222-3344', dutyDays: 'ตรวจเวรวันที่ 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30 ต.ค.', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80', badge: 'bg-blue-100 text-blue-800 border-blue-200' },
    { id: 'insp_3', username: 'vasana', defaultPass: '1234', name: 'นางวาสนา สินทรัพย์', position: 'ผู้อำนวยการกองคลัง', role: 'inspector', roleName: 'ผู้ตรวจเวร / ผอ.กองคลัง', category: 'inspector', dept: 'กองคลัง', gender: 'female', phone: '086-333-4455', dutyDays: 'ตรวจเวรวันที่ 3, 10, 13, 17, 23, 31 ต.ค.', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80', badge: 'bg-blue-100 text-blue-800 border-blue-200' },
    { id: 'insp_4', username: 'arunrat', defaultPass: '1234', name: 'นางอรุณรัตน์ บุญกอ', position: 'ผู้อำนวยการกองการศึกษา', role: 'inspector', roleName: 'ผู้ตรวจเวร / ผอ.กองการศึกษา', category: 'inspector', dept: 'กองการศึกษา', gender: 'female', phone: '087-444-5566', dutyDays: 'ตรวจเวรวันที่ 4, 11, 18, 24 ต.ค.', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&q=80', badge: 'bg-blue-100 text-blue-800 border-blue-200' },

    // 3. ผู้อยู่เวรยามกะกลางคืน (ชาย - 14 ท่าน)
    { id: 'night_1', username: 'manit', defaultPass: '1234', name: 'จ.ส.ท.มานิต ทองดวง', position: 'เจ้าพนักงานป้องกันและบรรเทาสาธารณภัย', role: 'staff', roleName: 'เจ้าพนักงานป้องกันฯ', category: 'night', dept: 'สำนักปลัด', gender: 'male', phone: '081-101-0001', dutyDays: 'วันที่ 1, 15, 29 ต.ค.', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80', badge: 'bg-slate-900 text-white' },
    { id: 'night_2', username: 'kiattiphon', defaultPass: '1234', name: 'จ.ส.อ.เกียรติพล หาทรัพย์', position: 'นายช่างโยธาชำนาญงาน', role: 'staff', roleName: 'นายช่างโยธาชำนาญงาน', category: 'night', dept: 'กองช่าง', gender: 'male', phone: '081-101-0002', dutyDays: 'วันที่ 2, 16, 30 ต.ค.', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=120&q=80', badge: 'bg-slate-900 text-white' },
    { id: 'night_3', username: 'singha', defaultPass: '1234', name: 'นายสิงหา ชุมชัย', position: 'เจ้าพนักงานธุรการ', role: 'staff', roleName: 'เจ้าพนักงานธุรการ', category: 'night', dept: 'สำนักปลัด', gender: 'male', phone: '081-101-0003', dutyDays: 'วันที่ 3, 17, 31 ต.ค.', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=120&q=80', badge: 'bg-slate-900 text-white' },
    { id: 'night_4', username: 'thosapol', defaultPass: '1234', name: 'นายทศพล โลมรัตน์', position: 'นายช่างไฟฟ้า', role: 'staff', roleName: 'นายช่างไฟฟ้า', category: 'night', dept: 'กองช่าง', gender: 'male', phone: '081-101-0004', dutyDays: 'วันที่ 4, 18 ต.ค.', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=120&q=80', badge: 'bg-slate-900 text-white' },
    { id: 'night_5', username: 'veerawat', defaultPass: '1234', name: 'นายวีระวัฒน์ จันทรคล', position: 'เจ้าพนักงานเทศกิจ', role: 'staff', roleName: 'เจ้าพนักงานเทศกิจ', category: 'night', dept: 'สำนักปลัด', gender: 'male', phone: '081-101-0005', dutyDays: 'วันที่ 5, 19 ต.ค.', avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=120&q=80', badge: 'bg-slate-900 text-white' },
    { id: 'night_6', username: 'kiattisak', defaultPass: '1234', name: 'จ่าเอกเกียรติศักดิ์ เพ็ญเนตร', position: 'เจ้าพนักงานป้องกันและบรรเทาสาธารณภัย', role: 'staff', roleName: 'เจ้าพนักงานป้องกันฯ', category: 'night', dept: 'สำนักปลัด', gender: 'male', phone: '081-101-0006', dutyDays: 'วันที่ 6, 20 ต.ค.', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80', badge: 'bg-slate-900 text-white' },
    { id: 'night_7', username: 'suphamongkol', defaultPass: '1234', name: 'นายศุภมงคล ธรรมพิทักษ์', position: 'นายช่างเครื่องกล', role: 'staff', roleName: 'นายช่างเครื่องกล', category: 'night', dept: 'กองช่าง', gender: 'male', phone: '081-101-0007', dutyDays: 'วันที่ 7, 21 ต.ค.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80', badge: 'bg-slate-900 text-white' },
    { id: 'night_8', username: 'anuchit', defaultPass: '1234', name: 'นายอนุชิต ดวงเนตร', position: 'นักวิชาการเงินและบัญชี', role: 'staff', roleName: 'นักวิชาการเงินและบัญชี', category: 'night', dept: 'กองคลัง', gender: 'male', phone: '081-101-0008', dutyDays: 'วันที่ 8, 22 ต.ค.', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80', badge: 'bg-slate-900 text-white' },
    { id: 'night_9', username: 'autthachai', defaultPass: '1234', name: 'นายอรรถชัย สุทธิรัตน์', position: 'นิติกรปฏิบัติการ', role: 'staff', roleName: 'นิติกรปฏิบัติการ', category: 'night', dept: 'สำนักปลัด', gender: 'male', phone: '081-101-0009', dutyDays: 'วันที่ 9, 23 ต.ค.', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80', badge: 'bg-slate-900 text-white' },
    { id: 'night_10', username: 'wuttichart', defaultPass: '1234', name: 'นายวุฒิชาติ เชื้อโชติ', position: 'นายช่างสำรวจ', role: 'staff', roleName: 'นายช่างสำรวจ', category: 'night', dept: 'กองช่าง', gender: 'male', phone: '081-101-0010', dutyDays: 'วันที่ 10, 24 ต.ค.', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=120&q=80', badge: 'bg-slate-900 text-white' },
    { id: 'night_11', username: 'klahan', defaultPass: '1234', name: 'นายกล้าหาญ พรพรม', position: 'พนักงานขับรถยนต์', role: 'staff', roleName: 'พนักงานขับรถยนต์', category: 'night', dept: 'สำนักปลัด', gender: 'male', phone: '081-101-0011', dutyDays: 'วันที่ 11, 25 ต.ค.', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80', badge: 'bg-slate-900 text-white' },
    { id: 'night_12', username: 'chaisit', defaultPass: '1234', name: 'นายชัยสิทธิ์ วงษ์วิชัย', position: 'นายช่างโยธา', role: 'staff', roleName: 'นายช่างโยธา', category: 'night', dept: 'กองช่าง', gender: 'male', phone: '081-101-0012', dutyDays: 'วันที่ 12, 26 ต.ค.', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=120&q=80', badge: 'bg-slate-900 text-white' },
    { id: 'night_13', username: 'wittaya', defaultPass: '1234', name: 'นายวิทยา ฝางคำ', position: 'เจ้าพนักงานพัฒนาชุมชน', role: 'staff', roleName: 'เจ้าพนักงานพัฒนาชุมชน', category: 'night', dept: 'สำนักปลัด', gender: 'male', phone: '081-101-0013', dutyDays: 'วันที่ 13, 27 ต.ค.', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=120&q=80', badge: 'bg-slate-900 text-white' },
    { id: 'night_14', username: 'wattrajira', defaultPass: '1234', name: 'นายวัตรจิระ ใสขาว', position: 'ผู้ช่วยนายช่างโยธา', role: 'staff', roleName: 'ผู้ช่วยนายช่างโยธา', category: 'night', dept: 'กองช่าง', gender: 'male', phone: '081-101-0014', dutyDays: 'วันที่ 14, 28 ต.ค.', avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=120&q=80', badge: 'bg-slate-900 text-white' },

    // 4. ผู้อยู่เวรยามกะกลางวัน (หญิง - 11 ท่าน)
    { id: 'day_1', username: 'amporn', defaultPass: '1234', name: 'นางสาวอำพร ทองสวัสดิ์', position: 'นักวิชาการพัสดุชำนาญการ', role: 'staff', roleName: 'นักวิชาการพัสดุ', category: 'day', dept: 'กองคลัง', gender: 'female', phone: '082-202-0001', dutyDays: 'วันที่ 3, 17 ต.ค.', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80', badge: 'bg-amber-100 text-amber-900' },
    { id: 'day_2', username: 'thidalak', defaultPass: '1234', name: 'นางสาวธิดาลักษณ์ โสแก้ว', position: 'เจ้าพนักงานธุรการชำนาญงาน', role: 'staff', roleName: 'เจ้าพนักงานธุรการ', category: 'day', dept: 'สำนักปลัด', gender: 'female', phone: '082-202-0002', dutyDays: 'วันที่ 3, 17 ต.ค.', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80', badge: 'bg-amber-100 text-amber-900' },
    { id: 'day_3', username: 'tongtaprapha', defaultPass: '1234', name: 'นางต้องตาประภา โพธิ์งาม', position: 'นักสังคมสงเคราะห์ปฏิบัติการ', role: 'staff', roleName: 'นักสังคมสงเคราะห์', category: 'day', dept: 'กองสวัสดิการสังคม', gender: 'female', phone: '082-202-0003', dutyDays: 'วันที่ 3, 17 ต.ค.', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80', badge: 'bg-amber-100 text-amber-900' },
    { id: 'day_4', username: 'beena', defaultPass: '1234', name: 'นางสาวบีนา เหล็กกล้า', position: 'เจ้าพนักงานจัดเก็บรายได้', role: 'staff', roleName: 'เจ้าพนักงานจัดเก็บรายได้', category: 'day', dept: 'กองคลัง', gender: 'female', phone: '082-202-0004', dutyDays: 'วันที่ 4, 18 ต.ค.', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&q=80', badge: 'bg-amber-100 text-amber-900' },
    { id: 'day_5', username: 'paphada', defaultPass: '1234', name: 'นางสาวปภาดา ประดับ', position: 'นักจัดการงานทั่วไปปฏิบัติการ', role: 'staff', roleName: 'นักจัดการงานทั่วไป', category: 'day', dept: 'สำนักปลัด', gender: 'female', phone: '082-202-0005', dutyDays: 'วันที่ 4, 18 ต.ค.', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80', badge: 'bg-amber-100 text-amber-900' },
    { id: 'day_6', username: 'phakapha', defaultPass: '1234', name: 'นางสาวผกาพา มณีจันทร์', position: 'นักวิชาการศึกษาปฏิบัติการ', role: 'staff', roleName: 'นักวิชาการศึกษา', category: 'day', dept: 'กองการศึกษา', gender: 'female', phone: '082-202-0006', dutyDays: 'วันที่ 13, 31 ต.ค.', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80', badge: 'bg-amber-100 text-amber-900' },
    { id: 'day_7', username: 'sudarat', defaultPass: '1234', name: 'นางสาวสุดารัตน์ ริมทอง', position: 'เจ้าพนักงานการเงินและบัญชี', role: 'staff', roleName: 'เจ้าพนักงานการเงินฯ', category: 'day', dept: 'กองคลัง', gender: 'female', phone: '082-202-0007', dutyDays: 'วันที่ 13, 31 ต.ค.', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80', badge: 'bg-amber-100 text-amber-900' },
    { id: 'day_8', username: 'niphaporn', defaultPass: '1234', name: 'นางสาวนิภาพร เที่ยงตรง', position: 'เจ้าพนักงานธุรการ', role: 'staff', roleName: 'เจ้าพนักงานธุรการ', category: 'day', dept: 'สำนักปลัด', gender: 'female', phone: '082-202-0008', dutyDays: 'วันที่ 10, 23 ต.ค.', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&q=80', badge: 'bg-amber-100 text-amber-900' },
    { id: 'day_9', username: 'nittaya', defaultPass: '1234', name: 'นางสาวนิตยา ชุมชัย', position: 'นักวิชาการสาธารณสุขปฏิบัติการ', role: 'staff', roleName: 'นักวิชาการสาธารณสุข', category: 'day', dept: 'กองสาธารณสุข', gender: 'female', phone: '082-202-0009', dutyDays: 'วันที่ 10, 23 ต.ค.', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80', badge: 'bg-amber-100 text-amber-900' },
    { id: 'day_10', username: 'ratchanee', defaultPass: '1234', name: 'นางรัชนี สร้อยคำ', position: 'นักวิชาการคลังชำนาญการ', role: 'staff', roleName: 'นักวิชาการคลัง', category: 'day', dept: 'กองคลัง', gender: 'female', phone: '082-202-0010', dutyDays: 'วันที่ 11, 24 ต.ค.', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80', badge: 'bg-amber-100 text-amber-900' },
    { id: 'day_11', username: 'massupha', defaultPass: '1234', name: 'นางสาวมาสศุภา ดวงคำ', position: 'นักวิเคราะห์นโยบายและแผน', role: 'staff', roleName: 'นักวิเคราะห์นโยบายฯ', category: 'day', dept: 'สำนักปลัด', gender: 'female', phone: '082-202-0011', dutyDays: 'วันที่ 11, 24 ต.ค.', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80', badge: 'bg-amber-100 text-amber-900' }
];

function getSavedSystemUsers() {
    try {
        let saved = localStorage.getItem('fangkham_system_users_v2');
        if (!saved) {
            saved = localStorage.getItem('fangkham_system_users_v1');
        }
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch(e) {}
    return JSON.parse(JSON.stringify(INITIAL_SYSTEM_USERS));
}

function saveSystemUsers(users) {
    ALL_SYSTEM_USERS = users;
    try {
        localStorage.setItem('fangkham_system_users_v2', JSON.stringify(users));
        localStorage.setItem('fangkham_system_users_v1', JSON.stringify(users));
    } catch(e) {}
}

function getSavedLoggedInUser() {
    try {
        const savedId = localStorage.getItem('fangkham_logged_user_id');
        if (savedId) {
            const users = getSavedSystemUsers();
            const found = users.find(u => u.id === savedId || (u.username && u.username.toLowerCase() === savedId.toLowerCase()));
            if (found) return found;
        }
    } catch(e) {}
    return null;
}

function setLoggedInUserSession(user) {
    if (!user) {
        if (typeof appState !== 'undefined') appState.currentUser = null;
        try {
            localStorage.removeItem('fangkham_logged_user_id');
        } catch(e) {}
    } else {
        if (typeof appState !== 'undefined') appState.currentUser = user;
        try {
            localStorage.setItem('fangkham_logged_user_id', user.id);
        } catch(e) {}
    }
}

function isCurrentUserAdmin() {
    if (!appState || !appState.currentUser) return false;
    const u = appState.currentUser;
    return u.role === 'admin' || 
           u.role === 'executive' || 
           u.category === 'admin' ||
           (u.username && (u.username.toLowerCase() === 'admin' || u.username.toLowerCase() === 'palad'));
}

let ALL_SYSTEM_USERS = getSavedSystemUsers();

const PRESET_AVATARS = [
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=120&q=80',
    'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=120&q=80',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&q=80'
];

// ข้อมูลตารางเวรตามคำสั่งจริง ต.ค. 2569 (แก้ไขใหม่ล่าสุด 10 ผลัดวันหยุด)
const ROSTER_OCT_2569 = {
    day: {
        3:  { staff: ['นางสาวอำพร ทองสวัสดิ์', 'นางสาวธิดาลักษณ์ โสแก้ว', 'นางต้องตาประภา โพธิ์งาม'], inspector: 'นางวาสนา สินทรัพย์' },
        4:  { staff: ['นางสาวบีนา เหล็กกล้า', 'นางสาวปภาดา ประดับ'], inspector: 'นางอรุณรัตน์ บุญกอ' },
        10: { staff: ['นางสาวนิภาพร เที่ยงตรง', 'นางสาวนิตยา ชุมชัย'], inspector: 'นางวาสนา สินทรัพย์' },
        11: { staff: ['นางรัชนี สร้อยคำ', 'นางสาวมาสศุภา ดวงคำ'], inspector: 'นางอรุณรัตน์ บุญกอ' },
        13: { staff: ['นางสาวผกาพา มณีจันทร์', 'นางสาวสุดารัตน์ ริมทอง'], inspector: 'นางวาสนา สินทรัพย์' },
        17: { staff: ['นางสาวอำพร ทองสวัสดิ์', 'นางสาวธิดาลักษณ์ โสแก้ว', 'นางต้องตาประภา โพธิ์งาม'], inspector: 'นางวาสนา สินทรัพย์' },
        18: { staff: ['นางสาวบีนา เหล็กกล้า', 'นางสาวปภาดา ประดับ'], inspector: 'นางอรุณรัตน์ บุญกอ' },
        23: { staff: ['นางสาวนิภาพร เที่ยงตรง', 'นางสาวนิตยา ชุมชัย'], inspector: 'นางวาสนา สินทรัพย์' },
        24: { staff: ['นางรัชนี สร้อยคำ', 'นางสาวมาสศุภา ดวงคำ'], inspector: 'นางอรุณรัตน์ บุญกอ' },
        31: { staff: ['นางสาวผกาพา มณีจันทร์', 'นางสาวสุดารัตน์ ริมทอง'], inspector: 'นางวาสนา สินทรัพย์' }
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

// -------------------------------------------------------------
// ระบบจัดเก็บข้อมูลการลงเวลาและผลการตรวจเวร (LocalStorage)
// -------------------------------------------------------------
function getInitialSeedCheckins() {
    return {
        // วันที่ 1 ต.ค. 2569: กะกลางคืน (จ.ส.ท.มานิต ทองดวง) - เข้าและออกเวรครบ
        'night_1_2026-10-01_night': {
            staffId: 'night_1',
            staffName: 'จ.ส.ท.มานิต ทองดวง',
            shift: 'night',
            shiftTitle: 'กะกลางคืน (16.30 - 08.00 น.)',
            date: '2026-10-01',
            time: '16:25 น.',
            checkinTime: '16:25 น.',
            checkoutTime: '08:02 น.',
            distance: 18,
            verified: true,
            photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80',
            notes: 'เข้าเวรตรงเวลา เหตุการณ์ปกติ ปิดล็อกประตูอาคารสำนักงานและเปิดไฟส่องสว่างครบถ้วน',
            checkoutNotes: 'ส่งมอบหน้าที่เวรยามและกุญแจอาคาร อบต.ฝางคำ เรียบร้อย เหตุการณ์ปกติ',
            inspector: 'นายชาญชัย อักโข'
        },
        'manit_2026-10-01_night': {
            staffId: 'night_1',
            staffName: 'จ.ส.ท.มานิต ทองดวง',
            shift: 'night',
            shiftTitle: 'กะกลางคืน (16.30 - 08.00 น.)',
            date: '2026-10-01',
            time: '16:25 น.',
            checkinTime: '16:25 น.',
            checkoutTime: '08:02 น.',
            distance: 18,
            verified: true,
            photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80',
            notes: 'เข้าเวรตรงเวลา เหตุการณ์ปกติ ปิดล็อกประตูอาคารสำนักงานและเปิดไฟส่องสว่างครบถ้วน',
            checkoutNotes: 'ส่งมอบหน้าที่เวรยามและกุญแจอาคาร อบต.ฝางคำ เรียบร้อย เหตุการณ์ปกติ',
            inspector: 'นายชาญชัย อักโข'
        },

        // วันที่ 2 ต.ค. 2569: กะกลางคืน (จ.ส.อ.เกียรติพล หาทรัพย์) - เข้าและออกเวรครบ
        'night_2_2026-10-02_night': {
            staffId: 'night_2',
            staffName: 'จ.ส.อ.เกียรติพล หาทรัพย์',
            shift: 'night',
            shiftTitle: 'กะกลางคืน (16.30 - 08.00 น.)',
            date: '2026-10-02',
            time: '16:28 น.',
            checkinTime: '16:28 น.',
            checkoutTime: '08:05 น.',
            distance: 25,
            verified: true,
            photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=120&q=80',
            notes: 'เข้าเวรเรียบร้อย ตรวจตราความปลอดภัยรอบบริเวณ อบต. อาคารและทรัพย์สินปกติ',
            checkoutNotes: 'ส่งมอบเวรและอาคารที่ทำการ อบต.ฝางคำ เรียบร้อย ทรัพย์สินปกติ',
            inspector: 'นายวุฒิศักดิ์ บุตรสิงห์'
        },
        'kiattiphon_2026-10-02_night': {
            staffId: 'night_2',
            staffName: 'จ.ส.อ.เกียรติพล หาทรัพย์',
            shift: 'night',
            shiftTitle: 'กะกลางคืน (16.30 - 08.00 น.)',
            date: '2026-10-02',
            time: '16:28 น.',
            checkinTime: '16:28 น.',
            checkoutTime: '08:05 น.',
            distance: 25,
            verified: true,
            photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=120&q=80',
            notes: 'เข้าเวรเรียบร้อย ตรวจตราความปลอดภัยรอบบริเวณ อบต. อาคารและทรัพย์สินปกติ',
            checkoutNotes: 'ส่งมอบเวรและอาคารที่ทำการ อบต.ฝางคำ เรียบร้อย ทรัพย์สินปกติ',
            inspector: 'นายวุฒิศักดิ์ บุตรสิงห์'
        },

        // วันที่ 3 ต.ค. 2569: กะกลางวัน (3 ท่าน) - เข้าและออกเวรครบ
        'day_1_2026-10-03_day': {
            staffId: 'day_1',
            staffName: 'นางสาวอำพร ทองสวัสดิ์',
            shift: 'day',
            shiftTitle: 'กะกลางวัน (08.00 - 16.30 น.)',
            date: '2026-10-03',
            time: '08:18 น.',
            checkinTime: '08:18 น.',
            checkoutTime: '16:32 น.',
            distance: 15,
            verified: true,
            photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80',
            notes: 'เข้าเวรวันหยุดราชการเรียบร้อย ปฏิบัติหน้าที่และอำนวยความสะดวกประชาชน เหตุการณ์ปกติ',
            checkoutNotes: 'ส่งมอบหน้าที่เวรวันหยุดให้เวรกลางคืนเรียบร้อย ปิดสำนักงานปกติ',
            inspector: 'นางวาสนา สินทรัพย์'
        },
        'amporn_2026-10-03_day': {
            staffId: 'day_1',
            staffName: 'นางสาวอำพร ทองสวัสดิ์',
            shift: 'day',
            shiftTitle: 'กะกลางวัน (08.00 - 16.30 น.)',
            date: '2026-10-03',
            time: '08:18 น.',
            checkinTime: '08:18 น.',
            checkoutTime: '16:32 น.',
            distance: 15,
            verified: true,
            photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80',
            notes: 'เข้าเวรวันหยุดราชการเรียบร้อย ปฏิบัติหน้าที่และอำนวยความสะดวกประชาชน เหตุการณ์ปกติ',
            checkoutNotes: 'ส่งมอบหน้าที่เวรวันหยุดให้เวรกลางคืนเรียบร้อย ปิดสำนักงานปกติ',
            inspector: 'นางวาสนา สินทรัพย์'
        },
        'day_2_2026-10-03_day': {
            staffId: 'day_2',
            staffName: 'นางสาวธิดาลักษณ์ โสแก้ว',
            shift: 'day',
            shiftTitle: 'กะกลางวัน (08.00 - 16.30 น.)',
            date: '2026-10-03',
            time: '08:22 น.',
            checkinTime: '08:22 น.',
            checkoutTime: '16:30 น.',
            distance: 20,
            verified: true,
            photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
            notes: 'ร่วมปฏิบัติหน้าที่เวรกลางวัน เหตุการณ์ปกติ เรียบร้อย',
            checkoutNotes: 'ส่งมอบเวรเรียบร้อย อาคารสำนักงานปกติ',
            inspector: 'นางวาสนา สินทรัพย์'
        },
        'thidalak_2026-10-03_day': {
            staffId: 'day_2',
            staffName: 'นางสาวธิดาลักษณ์ โสแก้ว',
            shift: 'day',
            shiftTitle: 'กะกลางวัน (08.00 - 16.30 น.)',
            date: '2026-10-03',
            time: '08:22 น.',
            checkinTime: '08:22 น.',
            checkoutTime: '16:30 น.',
            distance: 20,
            verified: true,
            photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
            notes: 'ร่วมปฏิบัติหน้าที่เวรกลางวัน เหตุการณ์ปกติ เรียบร้อย',
            checkoutNotes: 'ส่งมอบเวรเรียบร้อย อาคารสำนักงานปกติ',
            inspector: 'นางวาสนา สินทรัพย์'
        },
        'day_3_2026-10-03_day': {
            staffId: 'day_3',
            staffName: 'นางต้องตาประภา โพธิ์งาม',
            shift: 'day',
            shiftTitle: 'กะกลางวัน (08.00 - 16.30 น.)',
            date: '2026-10-03',
            time: '08:25 น.',
            checkinTime: '08:25 น.',
            checkoutTime: '16:35 น.',
            distance: 22,
            verified: true,
            photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80',
            notes: 'ร่วมปฏิบัติหน้าที่เวรกลางวัน ดูแลความเรียบร้อยสถานที่ราชการ',
            checkoutNotes: 'ส่งมอบเวรเรียบร้อย เหตุการณ์ปกติ',
            inspector: 'นางวาสนา สินทรัพย์'
        },
        'tongtaprapha_2026-10-03_day': {
            staffId: 'day_3',
            staffName: 'นางต้องตาประภา โพธิ์งาม',
            shift: 'day',
            shiftTitle: 'กะกลางวัน (08.00 - 16.30 น.)',
            date: '2026-10-03',
            time: '08:25 น.',
            checkinTime: '08:25 น.',
            checkoutTime: '16:35 น.',
            distance: 22,
            verified: true,
            photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80',
            notes: 'ร่วมปฏิบัติหน้าที่เวรกลางวัน ดูแลความเรียบร้อยสถานที่ราชการ',
            checkoutNotes: 'ส่งมอบเวรเรียบร้อย เหตุการณ์ปกติ',
            inspector: 'นางวาสนา สินทรัพย์'
        },

        // วันที่ 3 ต.ค. 2569: กะกลางคืน (นายสิงหา ชุมชัย) - กำลังปฏิบัติหน้าที่
        'night_3_2026-10-03_night': {
            staffId: 'night_3',
            staffName: 'นายสิงหา ชุมชัย',
            shift: 'night',
            shiftTitle: 'กะกลางคืน (16.30 - 08.00 น.)',
            date: '2026-10-03',
            time: '16:20 น.',
            checkinTime: '16:20 น.',
            checkoutTime: null,
            distance: 19,
            verified: true,
            photo: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=120&q=80',
            notes: 'เข้าเวรผลัดกลางคืนเรียบร้อย ตรวจอาคารและเปิดไฟส่องสว่าง เหตุการณ์ปกติ',
            checkoutNotes: '',
            inspector: 'นายชาญชัย อักโข'
        },
        'singha_2026-10-03_night': {
            staffId: 'night_3',
            staffName: 'นายสิงหา ชุมชัย',
            shift: 'night',
            shiftTitle: 'กะกลางคืน (16.30 - 08.00 น.)',
            date: '2026-10-03',
            time: '16:20 น.',
            checkinTime: '16:20 น.',
            checkoutTime: null,
            distance: 19,
            verified: true,
            photo: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=120&q=80',
            notes: 'เข้าเวรผลัดกลางคืนเรียบร้อย ตรวจอาคารและเปิดไฟส่องสว่าง เหตุการณ์ปกติ',
            checkoutNotes: '',
            inspector: 'นายชาญชัย อักโข'
        }
    };
}

function getSavedCheckins() {
    const seed = getInitialSeedCheckins();
    try {
        const saved = localStorage.getItem('fangkham_checkins_v1');
        if (saved) {
            const parsed = JSON.parse(saved);
            return { ...seed, ...parsed };
        }
    } catch(e) {}
    return seed;
}

function saveCheckinRecord(recordKey, recordData) {
    appState.todayCheckins[recordKey] = recordData;
    try {
        localStorage.setItem('fangkham_checkins_v1', JSON.stringify(appState.todayCheckins));
    } catch(e) {}
}

function getSavedInspections() {
    try {
        const saved = localStorage.getItem('fangkham_inspections_v1');
        if (saved) return JSON.parse(saved);
    } catch(e) {}
    return [
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
    ];
}

function saveInspectionRecord(newInsp) {
    appState.inspections.unshift(newInsp);
    try {
        localStorage.setItem('fangkham_inspections_v1', JSON.stringify(appState.inspections));
    } catch(e) {}
}

// ฟังก์ชันหา "วันที่ตามเวลาจริงของเครื่อง" แบบอัตโนมัติ (1 - 31 ต.ค.)
function getRealTodayDay() {
    const now = new Date();
    const day = now.getDate();
    return Math.min(Math.max(day, 1), 31);
}

let appState = {
    currentUser: getSavedLoggedInUser(), // โหลดเซสชันเดิมอัตโนมัติหากเคยล็อกอินไว้ (ไม่หลุดเมื่อรีเฟรชหน้าเว็บ)
    currentSystemDay: getRealTodayDay(), // วันที่ปัจจุบันตามเวลาจริงอัตโนมัติ (อัปเดตเองทุกวัน)
    isRealtimeMode: true, // กำลังเกาะติดเวลาจริง Real-time (เปลี่ยนวันใหม่อัตโนมัติเมื่อข้ามเที่ยงคืน)
    checkinActionType: 'checkin', // 'checkin' (เข้าเวร) หรือ 'checkout' (ออกเวร)
    settings: { ...DEFAULT_SETTINGS },
    attachedPdfs: [...INITIAL_ATTACHED_PDFS],
    currentLoginTab: 'login', // 'login', 'change_pwd', 'directory'
    currentCategory: 'all',
    currentTab: 'dashboard', // เริ่มต้นที่หน้า Dashboard เสมอ!
    selectedMonth: 9, // ต.ค. (index 9)
    selectedYear: 2026,
    schedules: [],
    todayCheckins: getSavedCheckins(),
    inspections: getSavedInspections(),
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
    currentCheckinPhoto: null,
    reportPeriodMode: 'day', // 'day' (เฉพาะวัน) หรือ 'month' (สรุปทั้งเดือน)
    reportSelectedDay: 3, // เริ่มต้นที่วันปัจจุบัน (3 ต.ค.)
    reportFilterShift: 'all', // 'all', 'day', 'night'
    reportFilterStatus: 'all', // 'all', 'completed', 'active', 'pending'
    reportSearchQuery: ''
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
        setLoggedInUserSession(foundUser);
        updateAuthUI();
        closeLoginModal();
        showToast('เข้าสู่ระบบสำเร็จ', `ยินดีต้อนรับ: ${foundUser.name} (${foundUser.position || foundUser.roleName})`, 'success');

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
        const isAdminUser = (u.category === 'admin' || u.role === 'admin' || u.role === 'executive');
        const rolePill = isAdminUser 
            ? `<span class="inline-flex items-center px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-purple-100 text-purple-800 border border-purple-200">👑 แอดมิน</span>`
            : (u.category === 'inspector' 
                ? `<span class="inline-flex items-center px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-blue-100 text-blue-800 border border-blue-200">🛡️ ผู้ตรวจ</span>`
                : `<span class="inline-flex items-center px-1.5 py-0.2 rounded-md text-[9px] font-medium bg-slate-100 text-slate-600">เจ้าหน้าที่</span>`);

        return `
            <div class="p-3 bg-white rounded-2xl border ${isAdminUser ? 'border-purple-200 bg-purple-50/20' : 'border-slate-200'} hover:border-emerald-300 shadow-xs flex items-center justify-between gap-2">
                <div class="flex items-center space-x-2.5 min-w-0">
                    <img src="${u.avatar}" class="w-8 h-8 rounded-full object-cover border border-slate-200 flex-shrink-0" alt="${u.name}">
                    <div class="min-w-0">
                        <div class="flex items-center space-x-1.5">
                            <span class="font-bold text-xs text-slate-900 truncate">${u.name}</span>
                            ${rolePill}
                        </div>
                        <div class="text-[10px] text-slate-500 truncate">${u.position || u.roleName} • <span class="font-mono font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">@${u.username}</span></div>
                    </div>
                </div>
                <button onclick="pickUserToLogin('${u.username}')" class="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 text-[11px] font-bold transition flex-shrink-0 cursor-pointer">
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
    const drawerName = document.getElementById('drawer-user-name');
    const drawerRole = document.getElementById('drawer-user-role');
    const drawerAvatar = document.getElementById('drawer-user-avatar');
    const drawerLogout = document.getElementById('drawer-btn-logout');
    const drawerLogin = document.getElementById('drawer-btn-login');
    const drawerEdit = document.getElementById('drawer-btn-edit');

    const isAdmin = isCurrentUserAdmin();

    // 1. Sidebar & Drawer Settings Badges (Lock for non-admin)
    const navSettingsBadge = document.getElementById('btn-nav-settings-badge');
    const mnavSettingsBadge = document.getElementById('btn-mnav-settings-badge');
    if (navSettingsBadge) {
        navSettingsBadge.classList.remove('hidden');
        navSettingsBadge.textContent = isAdmin ? '👑 Admin' : '🔒 ล็อค';
        navSettingsBadge.className = isAdmin 
            ? 'text-[10px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded border border-purple-200' 
            : 'text-[10px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded border border-slate-200';
    }
    if (mnavSettingsBadge) {
        mnavSettingsBadge.classList.remove('hidden');
        mnavSettingsBadge.textContent = isAdmin ? '👑 Admin' : '🔒 ล็อค';
        mnavSettingsBadge.className = isAdmin 
            ? 'text-[10px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded border border-purple-200' 
            : 'text-[10px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded border border-slate-200';
    }

    // 2. Edit Roster Buttons Labels (Indicate Admin Only)
    const navEditRosterLabel = document.getElementById('btn-nav-edit-roster-label');
    const dashEditRosterLabel = document.getElementById('btn-dash-edit-roster-label');
    const mnavEditRosterLabel = document.getElementById('btn-mnav-edit-roster-label');
    const dayDetailEditBtn = document.getElementById('day-detail-btn-edit');

    if (navEditRosterLabel) navEditRosterLabel.textContent = isAdmin ? 'แก้ไข/ปรับเปลี่ยนเวร' : 'ปรับเปลี่ยนเวร (Admin)';
    if (dashEditRosterLabel) dashEditRosterLabel.textContent = isAdmin ? 'แก้ไขเวรวันนี้' : '🔒 แก้ไขเวร (Admin)';
    if (mnavEditRosterLabel) mnavEditRosterLabel.textContent = isAdmin ? 'แก้ไข/ปรับเปลี่ยนตารางเวร' : 'ปรับเปลี่ยนตารางเวร (Admin)';
    if (dayDetailEditBtn) {
        if (isAdmin) dayDetailEditBtn.classList.remove('hidden');
        else dayDetailEditBtn.classList.add('hidden');
    }

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
            btnLoginHeader.className = 'text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center space-x-1 shadow-sm';
        }
        if (drawerName) drawerName.textContent = 'ยังไม่ได้เข้าสู่ระบบ';
        if (drawerRole) drawerRole.textContent = 'ผู้เยี่ยมชม (กรุณาล็อกอิน)';
        if (drawerAvatar) drawerAvatar.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80';
        if (drawerLogout) drawerLogout.classList.add('hidden');
        if (drawerEdit) drawerEdit.classList.add('hidden');
        if (drawerLogin) drawerLogin.classList.remove('hidden');
        if (personalBanner) personalBanner.classList.add('hidden');
        renderCheckinTab();
        return;
    }

    // กรณีเข้าสู่ระบบแล้ว
    const displayTitle = u.position || u.roleName || 'เจ้าหน้าที่';
    if (nameEl) nameEl.textContent = u.name;
    if (posEl) posEl.textContent = `${displayTitle} • @${u.username}`;
    if (roleEl) {
        roleEl.textContent = isAdmin ? `👑 ${displayTitle}` : displayTitle;
        roleEl.className = `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${u.badge || (isAdmin ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200')}`;
    }
    if (avatarEl) avatarEl.src = u.avatar;
    if (btnLogout) btnLogout.classList.remove('hidden');
    if (btnChangePwd) btnChangePwd.classList.remove('hidden');
    if (btnLoginHeader) {
        btnLoginHeader.innerHTML = `<span>🔄 สลับบัญชี</span>`;
        btnLoginHeader.className = 'text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition flex items-center space-x-1 border border-emerald-200 shadow-xs cursor-pointer';
    }
    if (drawerName) drawerName.textContent = u.name;
    if (drawerRole) drawerRole.textContent = `${displayTitle} • ${u.dept}`;
    if (drawerAvatar) drawerAvatar.src = u.avatar;
    if (drawerLogout) drawerLogout.classList.remove('hidden');
    if (drawerEdit) drawerEdit.classList.remove('hidden');
    if (drawerLogin) drawerLogin.classList.add('hidden');

    if (personalBanner) {
        if (!u) {
            personalBanner.classList.add('hidden');
        } else {
            const today = appState.currentSystemDay || getRealTodayDay();
            const sched = appState.schedules.find(s => s.day === today);
            let userDutyToday = null;

            if (sched) {
                if (sched.dayDuty && sched.dayDuty.staff.some(s => s.includes(u.name) || u.name.includes(s))) {
                    userDutyToday = { type: 'day', role: 'staff', time: '08.00 - 16.30 น.', inspector: sched.dayDuty.inspector };
                } else if (sched.nightDuty && sched.nightDuty.staff.some(s => s.includes(u.name) || u.name.includes(s))) {
                    userDutyToday = { type: 'night', role: 'staff', time: '16.30 - 08.00 น.', inspector: sched.nightDuty.inspector };
                } else if (sched.dayDuty && sched.dayDuty.inspector && (sched.dayDuty.inspector.includes(u.name) || u.name.includes(sched.dayDuty.inspector))) {
                    userDutyToday = { type: 'day', role: 'inspector', time: '08.00 - 16.30 น.', staff: sched.dayDuty.staff };
                } else if (sched.nightDuty && sched.nightDuty.inspector && (sched.nightDuty.inspector.includes(u.name) || u.name.includes(sched.nightDuty.inspector))) {
                    userDutyToday = { type: 'night', role: 'inspector', time: '16.30 - 08.00 น.', staff: sched.nightDuty.staff };
                }
            }

            if (userDutyToday) {
                personalBanner.classList.remove('hidden');
                const isDay = userDutyToday.type === 'day';
                const grad = isDay ? 'from-amber-500 to-orange-600' : 'from-slate-900 to-indigo-950 border border-indigo-900';
                const icon = isDay ? '☀️' : '🌙';
                const title = userDutyToday.role === 'staff' 
                    ? `ท่านมีหน้าที่อยู่เวร ${isDay ? 'กะกลางวัน' : 'กะกลางคืน'} วันนี้ (${getThaiDateLabel(today)})`
                    : `ท่านมีหน้าที่ตรวจเวร ${isDay ? 'กะกลางวัน' : 'กะกลางคืน'} วันนี้ (${getThaiDateLabel(today)})`;
                const subtitle = userDutyToday.role === 'staff'
                    ? `เวลาปฏิบัติหน้าที่ ${userDutyToday.time} • ผู้ตรวจเวรประจำผลัด: ${userDutyToday.inspector}`
                    : `เวลาตรวจเวร ${userDutyToday.time} • เจ้าหน้าที่ผู้เข้าเวร: ${userDutyToday.staff ? userDutyToday.staff.join(', ') : '-'}`;
                const targetTab = userDutyToday.role === 'staff' ? 'checkin' : 'inspection';
                const btnText = userDutyToday.role === 'staff' ? '📍 ลงเวลาเข้าเวร' : '🔍 บันทึกตรวจเวร';

                personalBanner.innerHTML = `
                    <div class="bg-gradient-to-r ${grad} text-white rounded-3xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3.5">
                        <div class="flex items-center space-x-3.5">
                            <div class="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-2xl shrink-0">
                                ${icon}
                            </div>
                            <div>
                                <div class="font-bold text-sm sm:text-base leading-tight">${title}</div>
                                <div class="text-xs opacity-90 mt-1">${subtitle}</div>
                            </div>
                        </div>
                        <button onclick="switchTab('${targetTab}')" class="px-4 py-2.5 rounded-2xl bg-white text-slate-900 font-bold text-xs shadow-sm hover:bg-slate-100 transition whitespace-nowrap cursor-pointer">
                            ${btnText}
                        </button>
                    </div>
                `;
            } else {
                personalBanner.classList.add('hidden');
            }
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
function logoutUser() {
    setLoggedInUserSession(null);
    updateAuthUI();
    switchTab('dashboard');
    showToast('ออกจากระบบเรียบร้อย', 'ท่านออกจากระบบแล้ว สามารถดูตารางเวรยามได้ตามปกติ หรือกดเข้าสู่ระบบเมื่อต้องการลงเวลา', 'info');
}

function handleHeaderProfileClick() {
    if (appState.currentUser) {
        openEditUserModal(appState.currentUser.id);
    } else {
        openLoginModal('login');
    }
}


// -------------------------------------------------------------
// ระบบจัดเก็บข้อมูลการปรับเปลี่ยนเวรยาม (Custom Roster Storage)
// -------------------------------------------------------------
function getCustomRoster() {
    try {
        // ล้างแคชเวอร์ชันเก่า (ถ้ามี) เพื่อให้ตารางเวรทางการใหม่แสดงผลทันที
        if (localStorage.getItem('fangkham_custom_roster_v1')) {
            localStorage.removeItem('fangkham_custom_roster_v1');
        }
        const saved = localStorage.getItem('fangkham_custom_roster_v2');
        return saved ? JSON.parse(saved) : {};
    } catch(e) {
        return {};
    }
}

function saveCustomRoster(customData) {
    try {
        localStorage.setItem('fangkham_custom_roster_v2', JSON.stringify(customData));
    } catch(e) {
        console.error('Failed to save custom roster', e);
    }
}

// -------------------------------------------------------------
// สร้างข้อมูลตารางเวร 31 วัน ประจำเดือนตุลาคม 2569 (พร้อมข้อมูลปรับแต่ง)
// -------------------------------------------------------------
function buildOctober2569Schedules() {
    const schedules = [];
    const daysInMonth = 31;
    const customRoster = getCustomRoster();

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `2026-10-${String(day).padStart(2, '0')}`;
        // วันที่ 1 ต.ค. 2569 คือ วันพฤหัสบดี (Thursday = 4)
        const dateObj = new Date(2026, 9, day);
        const dayOfWeek = dateObj.getDay(); // 0 = Sun, 6 = Sat
        const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
        const isHoliday = isWeekend || day === 13 || day === 23; // 13 ต.ค. นวมินทรมหาราช, 23 ต.ค. ปิยมหาราช

        // 1. ค่าเริ่มต้นเวรกลางวัน (เฉพาะวันหยุดเสาร์-อาทิตย์ และวันหยุดนักขัตฤกษ์)
        let dayDuty = null;
        if (ROSTER_OCT_2569.day[day]) {
            dayDuty = {
                shift: 'day',
                shiftName: 'กะกลางวัน (๐๘.๐๐ - ๑๖.๓๐ น.)',
                staff: [...ROSTER_OCT_2569.day[day].staff],
                inspector: ROSTER_OCT_2569.day[day].inspector,
                isHoliday: true
            };
        }

        // 2. ค่าเริ่มต้นเวรกลางคืน (มีทุกคืน 1-31 ต.ค.)
        const nightIdx = (day - 1) % ROSTER_OCT_2569.nightCycle.length;
        const nightItem = ROSTER_OCT_2569.nightCycle[nightIdx];
        let nightDuty = {
            shift: 'night',
            shiftName: 'กะกลางคืน (๑๖.๓๐ - ๐๘.๐๐ น.)',
            staff: [nightItem.staff],
            inspector: nightItem.inspector,
            isHoliday: isHoliday
        };

        // 3. นำข้อมูลที่มีการปรับแก้ (Custom Roster) มาทับค่าเริ่มต้น
        let isCustomized = false;
        let customReason = null;
        if (customRoster[day]) {
            isCustomized = true;
            const c = customRoster[day];
            if (c.dayDuty !== undefined) {
                dayDuty = c.dayDuty;
            }
            if (c.nightDuty !== undefined) {
                nightDuty = c.nightDuty;
            }
            if (c.reason) {
                customReason = c.reason;
            }
        }

        schedules.push({
            day,
            dateStr,
            dayOfWeek,
            isHoliday,
            dayDuty,
            nightDuty,
            isCustomized,
            customReason
        });
    }
    appState.schedules = schedules;
}

// -------------------------------------------------------------
// ระบบสลับหน้าเว็บ (Tab Navigation)
// -------------------------------------------------------------
function switchTab(tabId) {
    // หากเข้าหน้าลงเวลา, ตรวจเวร หรือสลับเวร แต่ยังไม่ได้เข้าสู่ระบบ ให้แจ้งเตือนและเปิดหน้าต่างล็อกอิน
    if (!appState.currentUser && (tabId === 'checkin' || tabId === 'inspection' || tabId === 'swap')) {
        openLoginModal('login');
        showToast('กรุณาเข้าสู่ระบบก่อน', 'กรุณาระบุ Username และ Password ของท่านเพื่อดำเนินการ', 'info');
        return;
    }

    if (tabId === 'settings') {
        if (!isCurrentUserAdmin()) {
            showToast('สงวนสิทธิ์เฉพาะแอดมิน 🔒', 'หน้าตั้งค่าระบบและจัดการบุคลากร อนุญาตให้เฉพาะผู้ดูแลระบบ (Admin: @admin) หรือผู้บริหาร (@palad) เท่านั้น', 'warning');
            openLoginModal('login');
            return;
        }
        renderSettingsUserList();
    }
    if (tabId === 'report') {
        initReportTab();
        renderAttendanceReport();
    }

    appState.currentTab = tabId;

    // ปิดเมนูสไลด์บนมือถือทันทีเมื่อเลือกแท็บ
    closeMobileDrawer();

    // ซ่อนเนื้อหาทุกแท็บ
    document.querySelectorAll('.tab-content').forEach(section => {
        section.classList.add('hidden');
    });

    // แสดงแท็บเป้าหมาย
    const targetSection = document.getElementById(`tab-${tabId}`);
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }

    // 1. อัปเดตปุ่มเมนูด้านข้าง (Sidebar - Desktop)
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('bg-emerald-700', 'text-white', 'shadow-sm');
        btn.classList.add('text-slate-600', 'hover:bg-slate-100');
    });
    const activeBtn = document.getElementById(`btn-nav-${tabId}`);
    if (activeBtn) {
        activeBtn.classList.remove('text-slate-600', 'hover:bg-slate-100');
        activeBtn.classList.add('bg-emerald-700', 'text-white', 'shadow-sm');
    }

    // 2. อัปเดตปุ่มเมนูด้านล่างบนมือถือ (Bottom Navigation Bar)
    document.querySelectorAll('.bnav-btn').forEach(btn => {
        if (!btn.id.includes('checkin')) {
            btn.classList.remove('text-emerald-600', 'font-bold');
            btn.classList.add('text-slate-500', 'font-medium');
        }
    });
    const activeBnav = document.getElementById(`btn-bnav-${tabId}`);
    if (activeBnav && !activeBnav.id.includes('checkin')) {
        activeBnav.classList.remove('text-slate-500', 'font-medium');
        activeBnav.classList.add('text-emerald-600', 'font-bold');
    }

    // 3. อัปเดตปุ่มใน Mobile Drawer
    document.querySelectorAll('.mnav-btn').forEach(btn => {
        btn.classList.remove('bg-emerald-50', 'text-emerald-700', 'font-bold');
        btn.classList.add('text-slate-700', 'hover:bg-slate-50', 'font-medium');
    });
    const activeMnav = document.getElementById(`btn-mnav-${tabId}`);
    if (activeMnav) {
        activeMnav.classList.remove('text-slate-700', 'hover:bg-slate-50', 'font-medium');
        activeMnav.classList.add('bg-emerald-50', 'text-emerald-700', 'font-bold');
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
// ระบบควบคุม Mobile Drawer Menu
// -------------------------------------------------------------
function openMobileDrawer() {
    const drawer = document.getElementById('mobile-drawer-modal');
    if (drawer) {
        drawer.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
    }
}

function closeMobileDrawer() {
    const drawer = document.getElementById('mobile-drawer-modal');
    if (drawer) {
        drawer.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
    }
}

// -------------------------------------------------------------
// หน้า Dashboard (ภาพรวม & จอแสดงเวรวันนี้)
// -------------------------------------------------------------
function renderDashboard() {
    const today = appState.currentSystemDay || getRealTodayDay();
    const todaySched = appState.schedules.find(s => s.day === today);

    // อัปเดตป้ายวันที่และสถานะเวลาจริง
    updateDateBadges();

    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentTimeVal = currentHour * 60 + currentMin; // จำนวนนาทีนับจาก 00:00

    // 1. เวรกลางวัน (แสดงตามตารางจริง หากไม่มีเวรจะค้นหาผลัดวันหยุดถัดไปให้อัตโนมัติ)
    const dayStaffEl = document.getElementById('dash-day-staff');
    const dayInspEl = document.getElementById('dash-day-inspector');
    const dayStatusEl = document.getElementById('dash-day-status');

    if (dayStaffEl && dayInspEl && dayStatusEl) {
        if (todaySched && todaySched.dayDuty) {
            // วันนี้เป็นวันหยุดที่มีเวรกลางวัน
            const staffList = todaySched.dayDuty.staff;
            const dateStr = `2026-10-${String(today).padStart(2, '0')}`;
            let anyStaffCheckedIn = false;

            dayStaffEl.innerHTML = staffList.map(s => {
                const u = findUserByName(s);
                const avatar = u && u.avatar ? u.avatar : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80';
                const dept = u ? (u.position ? `${u.position} • ${u.dept}` : u.dept) : 'อบต.ฝางคำ';
                const key = u ? `${u.id}_${dateStr}_day` : null;
                const checkData = (key && appState.todayCheckins[key]) || (u ? appState.todayCheckins[`${u.id}_${dateStr}`] : null);

                let checkBadge = '';
                if (checkData) {
                    anyStaffCheckedIn = true;
                    const cTime = checkData.checkinTime || checkData.time || 'เรียบร้อย';
                    checkBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">✓ ลงเวลา ${cTime}</span>`;
                } else if (currentTimeVal >= 480 && currentTimeVal <= 990) {
                    checkBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse whitespace-nowrap">● ปฏิบัติหน้าที่</span>`;
                } else {
                    checkBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 whitespace-nowrap">รอลงเวลา</span>`;
                }

                return `
                    <div class="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 hover:bg-amber-50/40 border border-slate-100 transition gap-2">
                        <div class="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
                            <img src="${avatar}" class="w-9 h-9 rounded-full object-cover border-2 border-white shadow-xs shrink-0" alt="${s}">
                            <div class="min-w-0">
                                <div class="font-bold text-slate-900 text-xs sm:text-sm truncate">${s}</div>
                                <div class="text-[10px] text-slate-500 mt-0.5 truncate">${dept}</div>
                            </div>
                        </div>
                        <div class="shrink-0">
                            ${checkBadge}
                        </div>
                    </div>
                `;
            }).join('');

            // Inspector Card
            const inspName = todaySched.dayDuty.inspector;
            const inspUser = findUserByName(inspName);
            const inspAvatar = inspUser && inspUser.avatar ? inspUser.avatar : 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80';
            const inspDept = inspUser ? inspUser.dept : 'อบต.ฝางคำ';

            dayInspEl.innerHTML = `
                <div class="flex items-center justify-between p-2.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 gap-2">
                    <div class="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
                        <img src="${inspAvatar}" class="w-9 h-9 rounded-full object-cover border-2 border-white shadow-xs shrink-0" alt="${inspName}">
                        <div class="min-w-0">
                            <div class="font-bold text-slate-900 text-xs sm:text-sm truncate">${inspName}</div>
                            <div class="text-[10px] text-amber-800 font-medium mt-0.5 truncate">${inspDept} • ผู้ตรวจเวร</div>
                        </div>
                    </div>
                    <span class="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap">
                        🔍 ตรวจเวร
                    </span>
                </div>
            `;

            // Status Badge in Day Card Header (Non-wrapping, concise)
            if (currentTimeVal < 480) {
                dayStatusEl.innerHTML = `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30 backdrop-blur-xs whitespace-nowrap">⏳ รอเข้าเวร 08:00</span>`;
            } else if (currentTimeVal <= 990) {
                if (anyStaffCheckedIn) {
                    dayStatusEl.innerHTML = `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-white text-emerald-800 shadow-xs whitespace-nowrap">✓ ลงเวลาแล้ว</span>`;
                } else {
                    dayStatusEl.innerHTML = `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-white text-amber-700 shadow-xs animate-pulse whitespace-nowrap">● กำลังปฏิบัติหน้าที่</span>`;
                }
            } else {
                dayStatusEl.innerHTML = `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/20 text-white/90 whitespace-nowrap">ครบผลัด 16.30 น.</span>`;
            }
        } else {
            // วันทำการปกติ ไม่มีเวรกลางวัน (ค้นหาผลัดวันหยุดถัดไปแบบอัตโนมัติ)
            const nextDaySched = appState.schedules.find(s => s.day > today && s.dayDuty);
            let nextInfoHtml = '';
            if (nextDaySched) {
                nextInfoHtml = `
                    <div class="mt-2.5 p-3 rounded-2xl bg-amber-50/80 border border-amber-200/90 text-xs space-y-1">
                        <div class="font-bold text-amber-900 flex items-center space-x-1.5">
                            <span>☀️</span>
                            <span>ผลัดถัดไป: ${getThaiDateLabel(nextDaySched.day)}</span>
                        </div>
                        <div class="text-amber-800 font-medium">${nextDaySched.dayDuty.staff.join(', ')}</div>
                        <div class="text-[11px] text-amber-700">ผู้ตรวจเวร: ${nextDaySched.dayDuty.inspector}</div>
                    </div>
                `;
                dayInspEl.innerHTML = `
                    <div class="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                        <span class="font-medium text-slate-800">${nextDaySched.dayDuty.inspector}</span> <span class="text-slate-400">(ตรวจเวร ${getThaiDateLabel(nextDaySched.day)})</span>
                    </div>
                `;
            } else {
                dayInspEl.innerHTML = `<div class="text-xs text-slate-400">ไม่มีผลัดเวรกลางวันคงเหลือในเดือนนี้</div>`;
            }

            dayStaffEl.innerHTML = `
                <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                    <div class="flex items-center space-x-2 text-slate-800 font-bold text-xs sm:text-sm">
                        <span>🏢</span>
                        <span>วันทำการปกติ (เวลาราชการ 08.30 - 16.30 น.)</span>
                    </div>
                    <p class="text-[11px] text-slate-500 leading-relaxed">กะกลางวันจัดเฉพาะวันหยุดเสาร์-อาทิตย์ และวันหยุดนักขัตฤกษ์</p>
                    ${nextInfoHtml}
                </div>
            `;
            dayStatusEl.innerHTML = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white whitespace-nowrap">วันทำการปกติ</span>`;
        }
    }

    // 2. เวรกลางคืน (มีทุกคืน 1-31 ต.ค.)
    const nightStaffEl = document.getElementById('dash-night-staff');
    const nightInspEl = document.getElementById('dash-night-inspector');
    const nightStatusEl = document.getElementById('dash-night-status');

    if (nightStaffEl && nightInspEl && nightStatusEl && todaySched && todaySched.nightDuty) {
        const nightStaffName = todaySched.nightDuty.staff[0];
        const u = findUserByName(nightStaffName);
        const avatar = u && u.avatar ? u.avatar : 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80';
        const dept = u ? (u.position ? `${u.position} • ${u.dept}` : u.dept) : 'อบต.ฝางคำ';

        const dateStr = `2026-10-${String(today).padStart(2, '0')}`;
        const nightKey = u ? `${u.id}_${dateStr}_night` : null;
        const isChecked = (nightKey && appState.todayCheckins[nightKey]) || (u ? appState.todayCheckins[`${u.id}_${dateStr}`] : null);

        // เวรกลางคืน 16:30 - 08:00 น. วันรุ่งขึ้น (นาที >= 990 หรือ < 480)
        const isDuringNightShift = (currentTimeVal >= 990 || currentTimeVal < 480);

        let checkBadge = '';
        if (isChecked) {
            const cTime = isChecked.checkinTime || isChecked.time || 'เรียบร้อย';
            checkBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">✓ ลงเวลา ${cTime}</span>`;
        } else if (isDuringNightShift) {
            checkBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse whitespace-nowrap">● ปฏิบัติหน้าที่</span>`;
        } else {
            checkBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 whitespace-nowrap">รอลงเวลา</span>`;
        }

        nightStaffEl.innerHTML = `
            <div class="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 hover:bg-indigo-50/40 border border-slate-100 transition gap-2">
                <div class="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
                    <img src="${avatar}" class="w-9 h-9 rounded-full object-cover border-2 border-white shadow-xs shrink-0" alt="${nightStaffName}">
                    <div class="min-w-0">
                        <div class="font-bold text-slate-900 text-xs sm:text-sm truncate">${nightStaffName}</div>
                        <div class="text-[10px] text-slate-500 mt-0.5 truncate">${dept}</div>
                    </div>
                </div>
                <div class="shrink-0">
                    ${checkBadge}
                </div>
            </div>
        `;

        // Inspector Card
        const inspName = todaySched.nightDuty.inspector;
        const inspUser = findUserByName(inspName);
        const inspAvatar = inspUser && inspUser.avatar ? inspUser.avatar : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80';
        const inspDept = inspUser ? inspUser.dept : 'สำนักปลัด';

        nightInspEl.innerHTML = `
            <div class="flex items-center justify-between p-2.5 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 gap-2">
                <div class="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
                    <img src="${inspAvatar}" class="w-9 h-9 rounded-full object-cover border-2 border-white shadow-xs shrink-0" alt="${inspName}">
                    <div class="min-w-0">
                        <div class="font-bold text-slate-900 text-xs sm:text-sm truncate">${inspName}</div>
                        <div class="text-[10px] text-indigo-900 font-medium mt-0.5 truncate">${inspDept} • ผู้ตรวจเวร</div>
                    </div>
                </div>
                <span class="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200 whitespace-nowrap">
                    🔍 ตรวจเวร
                </span>
            </div>
        `;

        // Status Badge in Night Card Header
        if (isChecked) {
            nightStatusEl.innerHTML = `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-400 text-slate-950 shadow-xs whitespace-nowrap">✓ ลงเวลาแล้ว</span>`;
        } else if (isDuringNightShift) {
            nightStatusEl.innerHTML = `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-400 text-slate-950 shadow-xs animate-pulse whitespace-nowrap">● กำลังปฏิบัติหน้าที่</span>`;
        } else {
            nightStatusEl.innerHTML = `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/10 text-slate-200 border border-white/20 whitespace-nowrap">⏳ รอเข้าเวร 16:30</span>`;
        }
    }

    // 3. ตัวนับสถิติ
    const statTotal = document.getElementById('stat-total-shifts');
    const statFemale = document.getElementById('stat-female-shifts');
    const statMale = document.getElementById('stat-male-shifts');
    const statInsp = document.getElementById('stat-inspections');

    const dayDutyCount = appState.schedules.filter(s => s.dayDuty).length;
    const nightDutyCount = appState.schedules.filter(s => s.nightDuty).length;

    if (statTotal) statTotal.textContent = `${dayDutyCount + nightDutyCount} ผลัด`;
    if (statFemale) statFemale.textContent = `${dayDutyCount} วัน`;
    if (statMale) statMale.textContent = `${nightDutyCount} คืน`;
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

        let customTagHtml = '';
        if (item.isCustomized) {
            customTagHtml = '<span class="text-[9px] px-1 py-0.2 rounded bg-purple-100 text-purple-700 font-bold ml-1" title="มีการปรับปรุงเวร">✏️ ปรับแก้</span>';
        }

        cell.innerHTML = `
            <div>
                <div class="flex justify-between items-center">
                    <div class="flex items-center">
                        <span class="text-xs font-bold ${item.dayOfWeek === 0 || item.dayOfWeek === 6 ? 'text-rose-600' : 'text-slate-800'} ${isToday ? 'px-1.5 py-0.5 rounded-full bg-emerald-600 text-white' : ''}">
                            ${item.day} ${isToday ? '(วันนี้)' : ''}
                        </span>
                        ${customTagHtml}
                    </div>
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

// -------------------------------------------------------------
// หน้าต่างแสดงรายละเอียดเวรยามประจำวัน (Day Duty Detail Modal)
// -------------------------------------------------------------
let currentDetailDay = 2;
let currentEditingDay = 2;

function showDayDetail(day) {
    openDayDetailModal(day);
}

function openDayDetailModal(day) {
    currentDetailDay = day;
    const sched = appState.schedules.find(s => s.day === day);
    if (!sched) return;

    const modal = document.getElementById('day-detail-modal');
    if (!modal) return;

    const titleEl = document.getElementById('day-detail-title');
    const subTitleEl = document.getElementById('day-detail-subtitle');
    const badgesEl = document.getElementById('day-detail-badges');
    const customTagEl = document.getElementById('day-detail-custom-tag');
    const customReasonBox = document.getElementById('day-detail-custom-reason-box');
    const customReasonText = document.getElementById('day-detail-custom-reason-text');
    const dayPillEl = document.getElementById('day-detail-day-status-pill');
    const dayContentEl = document.getElementById('day-detail-day-content');
    const nightContentEl = document.getElementById('day-detail-night-content');

    const dayName = THAI_DAY_NAMES[sched.dayOfWeek];
    if (titleEl) titleEl.textContent = `ข้อมูลเวรยาม: ${dayName}ที่ ${sched.day} ต.ค. ๒๕๖๙`;
    if (subTitleEl) subTitleEl.textContent = `คำสั่ง อบต.ฝางคำ ที่ ๕๑๒/๒๕๖๙ ประจำเดือน ตุลาคม ๒๕๖๙`;

    if (badgesEl) {
        let badgeHtml = '';
        if (sched.isHoliday) {
            badgeHtml += `<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">วันหยุดราชการ</span>`;
        } else {
            badgeHtml += `<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">วันทำการปกติ</span>`;
        }
        if (sched.day === (appState.currentSystemDay || 2)) {
            badgeHtml += `<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">วันนี้</span>`;
        }
        badgesEl.innerHTML = badgeHtml;
    }

    if (sched.isCustomized) {
        if (customTagEl) customTagEl.classList.remove('hidden');
        if (customReasonBox && customReasonText) {
            customReasonBox.classList.remove('hidden');
            customReasonText.textContent = sched.customReason || 'คำสั่งปรับเปลี่ยนเวรปฏิบัติหน้าที่เฉพาะกรณี';
        }
    } else {
        if (customTagEl) customTagEl.classList.add('hidden');
        if (customReasonBox) customReasonBox.classList.add('hidden');
    }

    // Day duty details
    if (sched.dayDuty && sched.dayDuty.staff && sched.dayDuty.staff.length > 0) {
        if (dayPillEl) {
            dayPillEl.className = 'text-[11px] px-2 py-0.5 rounded-full font-semibold bg-amber-200 text-amber-900';
            dayPillEl.textContent = 'มีเวรปฏิบัติหน้าที่';
        }
        if (dayContentEl) {
            dayContentEl.innerHTML = `
                <div><span class="font-bold text-slate-800">เจ้าหน้าที่ผู้อยู่เวร:</span> ${sched.dayDuty.staff.join(', ')}</div>
                <div><span class="font-bold text-slate-800">ผู้ตรวจเวรประจำผลัด:</span> ${sched.dayDuty.inspector}</div>
            `;
        }
    } else {
        if (dayPillEl) {
            dayPillEl.className = 'text-[11px] px-2 py-0.5 rounded-full font-semibold bg-slate-200 text-slate-700';
            dayPillEl.textContent = 'วันทำการปกติ';
        }
        if (dayContentEl) {
            dayContentEl.innerHTML = `
                <div class="text-slate-500 italic">วันทำการปกติ (ไม่มีเวรยามกะกลางวัน ปฏิบัติเฉพาะวันหยุด)</div>
            `;
        }
    }

    // Night duty details
    if (nightContentEl) {
        nightContentEl.innerHTML = `
            <div><span class="font-bold text-white">เจ้าหน้าที่ผู้อยู่เวร:</span> ${sched.nightDuty.staff.join(', ')}</div>
            <div><span class="font-bold text-white">ผู้ตรวจเวรประจำผลัด:</span> ${sched.nightDuty.inspector}</div>
        `;
    }

    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
}

function closeDayDetailModal() {
    const modal = document.getElementById('day-detail-modal');
    if (modal) modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
}

function openEditFromDayDetail() {
    const day = currentDetailDay;
    closeDayDetailModal();
    openEditRosterModal(day);
}

function jumpToCurrentDayCheckin() {
    const day = currentDetailDay;
    closeDayDetailModal();
    setSystemDay(day);
    switchTab('checkin');
}

// -------------------------------------------------------------
// ระบบแก้ไขและปรับปรุงตารางเวรยาม (Roster Editor Modal)
// -------------------------------------------------------------
function openEditRosterModal(day) {
    if (!isCurrentUserAdmin()) {
        showToast('สงวนสิทธิ์เฉพาะแอดมิน 🔒', 'การแก้ไขและปรับเปลี่ยนตารางเวรยามราชการ อนุญาตเฉพาะผู้ดูแลระบบ (Admin: @admin) หรือผู้บริหาร (@palad) เท่านั้น', 'warning');
        openLoginModal('login');
        return;
    }
    currentEditingDay = typeof day === 'number' ? day : (appState.currentSystemDay || 2);
    const modal = document.getElementById('edit-roster-modal');
    if (!modal) return;

    // Populate day select options (1-31) if needed
    const daySelect = document.getElementById('edit-roster-day-select');
    if (daySelect && daySelect.options.length < 31) {
        daySelect.innerHTML = '';
        for (let d = 1; d <= 31; d++) {
            const dateObj = new Date(2026, 9, d);
            const dayName = THAI_DAY_NAMES[dateObj.getDay()];
            const isHoliday = (dateObj.getDay() === 0 || dateObj.getDay() === 6 || d === 13 || d === 23);
            const opt = document.createElement('option');
            opt.value = d;
            opt.textContent = `วันที่ ${d} ตุลาคม ๒๕๖๙ (${dayName}${isHoliday ? ' - วันหยุด' : ''})`;
            daySelect.appendChild(opt);
        }
    }

    loadEditFormDataForDay(currentEditingDay);

    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
}

function closeEditRosterModal() {
    const modal = document.getElementById('edit-roster-modal');
    if (modal) modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
}

function navigateEditDay(delta) {
    let nextDay = currentEditingDay + delta;
    if (nextDay < 1) nextDay = 31;
    if (nextDay > 31) nextDay = 1;
    currentEditingDay = nextDay;
    loadEditFormDataForDay(currentEditingDay);
}

function handleEditDaySelectChange(day) {
    currentEditingDay = parseInt(day);
    loadEditFormDataForDay(currentEditingDay);
}

function loadEditFormDataForDay(day) {
    const sched = appState.schedules.find(s => s.day === day);
    if (!sched) return;

    // 1. Sync dropdown selector
    const daySelect = document.getElementById('edit-roster-day-select');
    if (daySelect) daySelect.value = day;

    // 2. Custom status badge
    const customBadge = document.getElementById('edit-roster-is-custom-badge');
    if (customBadge) {
        if (sched.isCustomized) {
            customBadge.className = 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-600 text-white shadow-2xs shrink-0';
            customBadge.textContent = '✏️ มีการปรับปรุงเวรแล้ว';
        } else {
            customBadge.className = 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-purple-700 border border-purple-200 shrink-0';
            customBadge.textContent = 'ค่าเริ่มต้นตามคำสั่ง';
        }
    }

    // 3. Populate Night Staff options
    const nightSelect = document.getElementById('edit-night-staff-select');
    const nightCustomInput = document.getElementById('edit-night-staff-custom');
    if (nightSelect) {
        const nightStaffUsers = ALL_SYSTEM_USERS.filter(u => u.category === 'night');
        let optionsHtml = '';
        let foundInList = false;
        const currentNightStaff = (sched.nightDuty && sched.nightDuty.staff && sched.nightDuty.staff[0]) ? sched.nightDuty.staff[0] : '';

        nightStaffUsers.forEach(u => {
            const isSelected = (u.name === currentNightStaff);
            if (isSelected) foundInList = true;
            optionsHtml += `<option value="${u.name}" ${isSelected ? 'selected' : ''}>${u.name} (${u.dept})</option>`;
        });

        // Other male/all users
        const otherStaff = ALL_SYSTEM_USERS.filter(u => u.category !== 'night' && u.category !== 'day');
        if (otherStaff.length > 0) {
            optionsHtml += `<optgroup label="ผู้บริหาร / เจ้าหน้าที่อื่นๆ">`;
            otherStaff.forEach(u => {
                const isSelected = (u.name === currentNightStaff);
                if (isSelected) foundInList = true;
                optionsHtml += `<option value="${u.name}" ${isSelected ? 'selected' : ''}>${u.name}</option>`;
            });
            optionsHtml += `</optgroup>`;
        }

        optionsHtml += `<option value="__custom__" ${!foundInList && currentNightStaff ? 'selected' : ''}>✍️ ระบุชื่ออื่นด้วยตนเอง...</option>`;
        nightSelect.innerHTML = optionsHtml;

        if (!foundInList && currentNightStaff) {
            if (nightCustomInput) {
                nightCustomInput.classList.remove('hidden');
                nightCustomInput.value = currentNightStaff;
            }
        } else {
            if (nightCustomInput) {
                nightCustomInput.classList.add('hidden');
                nightCustomInput.value = '';
            }
        }
    }

    // 4. Populate Night Inspector options
    const nightInspSelect = document.getElementById('edit-night-inspector-select');
    if (nightInspSelect) {
        const inspectors = ALL_SYSTEM_USERS.filter(u => u.category === 'inspector');
        const currentInsp = (sched.nightDuty && sched.nightDuty.inspector) ? sched.nightDuty.inspector : 'นายชาญชัย อักโข';
        nightInspSelect.innerHTML = inspectors.map(i => `
            <option value="${i.name}" ${i.name === currentInsp ? 'selected' : ''}>${i.name} (${i.roleName})</option>
        `).join('');
    }

    // 5. Day Shift Toggle & Checkboxes
    const dayToggle = document.getElementById('edit-day-shift-toggle');
    const hasDayShift = Boolean(sched.dayDuty);
    if (dayToggle) {
        dayToggle.checked = hasDayShift;
    }
    handleDayShiftToggle(hasDayShift);

    // Populate female staff checkboxes
    const dayCheckboxesContainer = document.getElementById('edit-day-staff-checkboxes');
    const dayCustomInput = document.getElementById('edit-day-staff-custom');
    const dayInspSelect = document.getElementById('edit-day-inspector-select');

    if (dayCheckboxesContainer) {
        const femaleStaff = ALL_SYSTEM_USERS.filter(u => u.category === 'day');
        const activeStaffList = (sched.dayDuty && sched.dayDuty.staff) ? sched.dayDuty.staff : [];
        const extraNames = [];

        dayCheckboxesContainer.innerHTML = femaleStaff.map((u, idx) => {
            const isChecked = activeStaffList.some(name => name.includes(u.name.split(' ')[0]) || u.name.includes(name.split(' ')[0]));
            return `
                <label class="flex items-center space-x-2 text-xs text-slate-700 hover:bg-amber-50/70 p-1.5 rounded-lg cursor-pointer">
                    <input type="checkbox" name="edit-day-staff-cb" value="${u.name}" ${isChecked ? 'checked' : ''} class="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500">
                    <span class="truncate font-medium">${u.name}</span>
                </label>
            `;
        }).join('');

        // Find any extra names not in standard female list
        activeStaffList.forEach(name => {
            const inList = femaleStaff.some(u => name.includes(u.name.split(' ')[0]) || u.name.includes(name.split(' ')[0]));
            if (!inList) extraNames.push(name);
        });

        if (dayCustomInput) {
            dayCustomInput.value = extraNames.join(', ');
        }
    }

    // Populate Day Inspector options
    if (dayInspSelect) {
        const inspectors = ALL_SYSTEM_USERS.filter(u => u.category === 'inspector');
        const currentDayInsp = (sched.dayDuty && sched.dayDuty.inspector) ? sched.dayDuty.inspector : 'นางวาสนา สินทรัพย์';
        dayInspSelect.innerHTML = inspectors.map(i => `
            <option value="${i.name}" ${i.name === currentDayInsp ? 'selected' : ''}>${i.name} (${i.roleName})</option>
        `).join('');
    }

    // 6. Reason field
    const reasonInput = document.getElementById('edit-roster-reason');
    if (reasonInput) {
        reasonInput.value = sched.customReason || '';
    }
}

function handleNightStaffSelectChange(val) {
    const customInput = document.getElementById('edit-night-staff-custom');
    if (!customInput) return;
    if (val === '__custom__') {
        customInput.classList.remove('hidden');
        customInput.focus();
    } else {
        customInput.classList.add('hidden');
    }
}

function handleDayShiftToggle(isChecked) {
    const container = document.getElementById('edit-day-shift-container');
    const disabledMsg = document.getElementById('edit-day-shift-disabled-msg');
    const label = document.getElementById('edit-day-shift-toggle-label');

    if (isChecked) {
        if (container) container.classList.remove('hidden');
        if (disabledMsg) disabledMsg.classList.add('hidden');
        if (label) {
            label.textContent = 'มีเวรกลางวัน';
            label.className = 'text-xs font-bold text-amber-700';
        }
    } else {
        if (container) container.classList.add('hidden');
        if (disabledMsg) disabledMsg.classList.remove('hidden');
        if (label) {
            label.textContent = 'ไม่มีเวร (วันปกติ)';
            label.className = 'text-xs font-bold text-slate-500';
        }
    }
}

function saveRosterEditSubmit() {
    if (!isCurrentUserAdmin()) {
        showToast('ปฏิเสธการดำเนินการ 🔒', 'เฉพาะผู้ดูแลระบบ (Admin) หรือผู้บริหารเท่านั้นที่สามารถบันทึกตารางเวรได้', 'error');
        return;
    }
    const day = currentEditingDay;
    const sched = appState.schedules.find(s => s.day === day);
    if (!sched) return;

    // 1. Get Night Duty details
    const nightSelect = document.getElementById('edit-night-staff-select');
    const nightCustom = document.getElementById('edit-night-staff-custom');
    const nightInspSelect = document.getElementById('edit-night-inspector-select');

    let nightStaff = nightSelect ? nightSelect.value : '';
    if (nightStaff === '__custom__') {
        nightStaff = (nightCustom && nightCustom.value.trim()) ? nightCustom.value.trim() : '';
    }
    const nightInspector = nightInspSelect ? nightInspSelect.value : 'นายชาญชัย อักโข';

    if (!nightStaff) {
        showToast('กรุณาระบุเจ้าหน้าที่', 'กรุณาเลือกหรือระบุเจ้าหน้าที่ผู้อยู่เวรยามกะกลางคืน', 'error');
        return;
    }

    // 2. Get Day Duty details
    const dayToggle = document.getElementById('edit-day-shift-toggle');
    const hasDayShift = dayToggle ? dayToggle.checked : false;

    let dayDuty = null;
    if (hasDayShift) {
        const checkedStaff = [];
        document.querySelectorAll('input[name="edit-day-staff-cb"]:checked').forEach(cb => {
            checkedStaff.push(cb.value);
        });

        const dayCustom = document.getElementById('edit-day-staff-custom');
        if (dayCustom && dayCustom.value.trim()) {
            const extra = dayCustom.value.split(',').map(s => s.trim()).filter(s => s.length > 0);
            checkedStaff.push(...extra);
        }

        if (checkedStaff.length === 0) {
            showToast('กรุณาระบุเจ้าหน้าที่กะกลางวัน', 'เมื่อเปิดใช้งานเวรกลางวัน กรุณาเลือกเจ้าหน้าที่อย่างน้อย ๑ ท่าน', 'error');
            return;
        }

        const dayInspSelect = document.getElementById('edit-day-inspector-select');
        const dayInspector = dayInspSelect ? dayInspSelect.value : 'นางวาสนา สินทรัพย์';

        dayDuty = {
            shift: 'day',
            shiftName: 'กะกลางวัน (๐๘.๐๐ - ๑๖.๓๐ น.)',
            staff: checkedStaff,
            inspector: dayInspector,
            isHoliday: true
        };
    }

    const nightDuty = {
        shift: 'night',
        shiftName: 'กะกลางคืน (๑๖.๓๐ - ๐๘.๐๐ น.)',
        staff: [nightStaff],
        inspector: nightInspector,
        isHoliday: sched.isHoliday
    };

    const reasonInput = document.getElementById('edit-roster-reason');
    const reason = reasonInput ? reasonInput.value.trim() : '';

    // 3. Save to localStorage
    const customRoster = getCustomRoster();
    customRoster[day] = {
        dayDuty,
        nightDuty,
        reason: reason || 'คำสั่งปรับปรุงตารางเวร อบต.ฝางคำ'
    };
    saveCustomRoster(customRoster);

    // 4. Rebuild schedules & update all views
    buildOctober2569Schedules();
    renderDashboard();
    renderCalendar();
    renderCheckinTab();
    renderPrintDocument();

    // 5. Broadcast to LINE simulator
    const thaiDate = getThaiDateLabel(day);
    pushLineGroupMessage(
        'ระบบตารางเวร อบต.ฝางคำ',
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80',
        `📢 [ปรับปรุงคำสั่งเวรยามประจำเดือน]\nมีการปรับเปลี่ยนเวร: วันที่ ${thaiDate}\n• เวรกลางคืน: ${nightStaff} (ตรวจ: ${nightInspector})\n${hasDayShift ? `• เวรกลางวัน: ${dayDuty.staff.join(', ')} (ตรวจ: ${dayDuty.inspector})\n` : '• เวรกลางวัน: วันทำการปกติ\n'}• หมายเหตุ: ${reason || 'คำสั่งเฉพาะกรณี'}`
    );

    // 6. Close modal & show toast
    closeEditRosterModal();
    showToast('บันทึกการแก้ไขเรียบร้อย', `ปรับปรุงตารางเวรวันที่ ${thaiDate} เรียบร้อยแล้ว ข้อมูลอัปเดตทุกระบบทันที`, 'success');
}

function resetCurrentDayRoster() {
    if (!isCurrentUserAdmin()) {
        showToast('ปฏิเสธการดำเนินการ 🔒', 'เฉพาะผู้ดูแลระบบ (Admin) หรือผู้บริหารเท่านั้นที่สามารถคืนค่าตารางเวรได้', 'error');
        return;
    }
    const day = currentEditingDay;
    const customRoster = getCustomRoster();
    if (!customRoster[day]) {
        showToast('ข้อมูลปกติ', `วันที่ ${day} ตุลาคม เป็นค่าเริ่มต้นตามคำสั่งอยู่แล้ว`, 'info');
        return;
    }

    delete customRoster[day];
    saveCustomRoster(customRoster);

    buildOctober2569Schedules();
    renderDashboard();
    renderCalendar();
    renderCheckinTab();
    renderPrintDocument();
    loadEditFormDataForDay(day);

    showToast('คืนค่าเริ่มต้น', `คืนค่าตารางเวรวันที่ ${day} ตุลาคม ๒๕๖๙ เรียบร้อยแล้ว`, 'success');
}

function confirmResetAllRoster() {
    if (!isCurrentUserAdmin()) {
        showToast('ปฏิเสธการดำเนินการ 🔒', 'เฉพาะผู้ดูแลระบบ (Admin) หรือผู้บริหารเท่านั้นที่สามารถคืนค่าตารางเวรทั้งหมดได้', 'error');
        return;
    }
    if (confirm('ท่านต้องการคืนค่าเริ่มต้นทั้งหมด 31 วัน ใช่หรือไม่? ข้อมูลการแก้ไขทั้งหมดจะถูกล้างกลับไปเป็นคำสั่งเดิมของ อบต.ฝางคำ')) {
        localStorage.removeItem('fangkham_custom_roster_v2');
        localStorage.removeItem('fangkham_custom_roster_v1');
        buildOctober2569Schedules();
        renderDashboard();
        renderCalendar();
        renderCheckinTab();
        renderPrintDocument();
        loadEditFormDataForDay(currentEditingDay);
        showToast('คืนค่าเริ่มต้นทั้งหมด', 'คืนค่าตารางเวรตามคำสั่งเดิมทั้ง 31 วันเรียบร้อยแล้ว', 'success');
    }
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

function getThaiDateLabel(day, formal = false) {
    const d = new Date(2026, 9, day);
    const dayName = THAI_DAY_NAMES[d.getDay()];
    return formal ? `${dayName}ที่ ${toThaiNum(day)} ตุลาคม ๒๕๖๙` : `${dayName}ที่ ${day} ตุลาคม 2569`;
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

function setSystemDay(day, isManual = true) {
    const targetDay = parseInt(day, 10);
    if (isNaN(targetDay) || targetDay < 1 || targetDay > 31) return;
    
    appState.currentSystemDay = targetDay;
    const realDay = getRealTodayDay();
    if (isManual) {
        appState.isRealtimeMode = (targetDay === realDay);
    }

    renderCheckinTab();
    renderDashboard();
    renderCalendar();
    updateDateBadges();

    if (isManual) {
        if (targetDay === realDay) {
            showToast('กลับสู่เวลาจริง ✅', `ระบบแสดงผลตามเวลาจริง: ${getThaiDateLabel(targetDay)}`, 'success');
        } else {
            showToast('เลือกดูตารางเวร 📅', `แสดงข้อมูลตารางเวรของ ${getThaiDateLabel(targetDay)}`, 'info');
        }
    }
}

function resetToRealtimeToday() {
    appState.isRealtimeMode = true;
    const realDay = getRealTodayDay();
    setSystemDay(realDay, false);
    showToast('กลับสู่เวลาจริง ✅', `ระบบกลับมาแสดงข้อมูลของ ${getThaiDateLabel(realDay)} ตามเวลาจริงเรียบร้อย`, 'success');
}

function updateDateBadges() {
    const today = appState.currentSystemDay || getRealTodayDay();
    const realToday = getRealTodayDay();
    const isReal = (today === realToday && appState.isRealtimeMode);

    // 1. Header / Navbar
    const headerDate = document.getElementById('header-live-date');
    if (headerDate) {
        headerDate.textContent = getThaiDateLabel(realToday);
    }

    // 2. Dashboard badge
    const dashTodayLabel = document.getElementById('dash-today-label');
    if (dashTodayLabel) {
        if (isReal) {
            dashTodayLabel.className = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-700 text-white shadow-xs';
            dashTodayLabel.innerHTML = `<span class="w-2 h-2 rounded-full bg-white mr-1.5 animate-pulse"></span> ${getThaiDateLabel(today)}`;
        } else {
            dashTodayLabel.className = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-xs';
            dashTodayLabel.innerHTML = `⚠️ แสดงข้อมูลวันที่ ${today} ต.ค. (โหมดเลือกดู) <button type="button" onclick="resetToRealtimeToday()" class="ml-2 underline text-white font-bold hover:text-amber-100">↺ กลับสู่วันนี้</button>`;
        }
    }

    // 3. Checkin badge & label
    const checkinDateLabel = document.getElementById('checkin-system-date-label');
    if (checkinDateLabel) {
        checkinDateLabel.textContent = getThaiDateLabel(today);
    }
    const checkinRealtimeBadge = document.getElementById('checkin-realtime-badge');
    if (checkinRealtimeBadge) {
        if (isReal) {
            checkinRealtimeBadge.className = 'inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300';
            checkinRealtimeBadge.innerHTML = '● เวลาจริง Real-time';
        } else {
            checkinRealtimeBadge.className = 'inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300';
            checkinRealtimeBadge.innerHTML = '⚠️ โหมดเลือกดูวันที่';
        }
    }

    // 4. Dropdown picker sync
    const picker = document.getElementById('checkin-date-picker');
    if (picker && picker.value !== String(today)) {
        picker.value = String(today);
    }

    // 5. Reset button visibility
    const btnReset = document.getElementById('btn-reset-realtime');
    if (btnReset) {
        if (isReal) {
            btnReset.classList.add('hidden');
        } else {
            btnReset.classList.remove('hidden');
        }
    }
}

function initCheckinDatePicker() {
    const picker = document.getElementById('checkin-date-picker');
    if (!picker) return;

    picker.innerHTML = '';
    const realDay = getRealTodayDay();

    for (let day = 1; day <= 31; day++) {
        const dObj = new Date(2026, 9, day);
        const dayName = THAI_DAY_NAMES[dObj.getDay()];
        const isReal = (day === realDay);
        const opt = document.createElement('option');
        opt.value = String(day);
        opt.textContent = `${day} ต.ค. ๒๕๖๙ (${dayName})${isReal ? ' ★ วันนี้' : ''}`;
        if (day === (appState.currentSystemDay || realDay)) {
            opt.selected = true;
        }
        picker.appendChild(opt);
    }
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

    const currentDay = appState.currentSystemDay || getRealTodayDay();
    updateDateBadges();

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
    const currentDay = appState.currentSystemDay || getRealTodayDay();
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
        saveCheckinRecord(recordKey, {
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
        });

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
        saveCheckinRecord(recordKey, rec);

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
    if (typeof renderAttendanceReport === 'function') {
        renderAttendanceReport();
    }
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
    if (!appState.currentUser) {
        showToast('กรุณาเข้าสู่ระบบก่อน', 'กรุณาล็อกอินด้วยบัญชีผู้ตรวจเวรหรือผู้ดูแลระบบเพื่อบันทึกการตรวจเวร', 'warning');
        openLoginModal('login');
        return;
    }
    if (appState.currentUser.role !== 'inspector' && !isCurrentUserAdmin()) {
        showToast('สิทธิ์ไม่ถูกต้อง 🔒', 'เฉพาะผู้ตรวจเวรประจำผลัด หรือผู้ดูแลระบบ/ผู้บริหารเท่านั้น ที่สามารถบันทึกสมุดตรวจเวรยามได้', 'error');
        return;
    }

    const inspectorSelect = document.getElementById('inspect-inspector-select');
    const staffPresent = document.getElementById('inspect-staff-present').checked;
    const premiseNormal = document.getElementById('inspect-premise-normal').checked;
    const remark = document.getElementById('inspect-remark').value.trim();

    const inspectorName = inspectorSelect ? inspectorSelect.value : appState.currentUser.name;
    const currentDay = appState.currentSystemDay || getRealTodayDay();
    const dateStr = `2026-10-${String(currentDay).padStart(2, '0')}`;

    const newInsp = {
        id: 'insp-' + Date.now(),
        inspector: inspectorName,
        date: dateStr,
        time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.',
        staffPresent,
        premiseNormal,
        remark: remark || 'ตรวจตราเรียบร้อย ไม่พบสิ่งผิดปกติ',
        hasSig: true
    };

    saveInspectionRecord(newInsp);
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
    const today = appState.currentSystemDay || getRealTodayDay();
    const todaySched = appState.schedules.find(s => s.day === today);
    const dateLabel = getThaiDateLabel(today);

    if (shiftType === 'night') {
        const nightStaff = (todaySched && todaySched.nightDuty) ? todaySched.nightDuty.staff[0] : 'เจ้าหน้าที่เวรกลางคืน';
        const nightInsp = (todaySched && todaySched.nightDuty) ? todaySched.nightDuty.inspector : 'ผู้ตรวจเวรประจำวัน';
        pushLineGroupMessage(
            '🤖 บอทเวรยาม อบต.ฝางคำ',
            'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80',
            `📢 [แจ้งเตือนเตรียมเข้าเวรกลางคืน]\nเรียน ${nightStaff}\nท่านมีหน้าที่เข้าเวรผลัดค่ำคืนนี้ (${dateLabel})\n• เวลา: ๑๖.๓๐ - ๐๘.๐๐ น.\n• ผู้ตรวจเวร: ${nightInsp}\nกรุณาลงเวลาและถ่ายรูปรายงานตัวภายในรัศมี ๑๕๐ ม.`,
            'LINE Bot',
            false
        );
        showToast('ส่งแจ้งเตือนกะกลางคืนแล้ว', `ส่งข้อความเตือน ${nightStaff} เข้ากลุ่ม LINE แล้ว`, 'info');
    } else {
        if (todaySched && todaySched.dayDuty) {
            const dayStaffStr = todaySched.dayDuty.staff.join(', ');
            const dayInsp = todaySched.dayDuty.inspector;
            pushLineGroupMessage(
                '🤖 บอทเวรยาม อบต.ฝางคำ',
                'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80',
                `📢 [แจ้งเตือนเวรกลางวันวันนี้]\nเรียน ${dayStaffStr}\nท่านมีหน้าที่เข้าเวรกลางวัน (${dateLabel})\n• เวลา: ๐๘.๐๐ - ๑๖.๓๐ น.\n• ผู้ตรวจเวร: ${dayInsp}\nกรุณาลงเวลาปฏิบัติหน้าที่ ณ ที่ทำการ อบต.ฝางคำ`,
                'LINE Bot',
                false
            );
            showToast('ส่งแจ้งเตือนกะกลางวันแล้ว', `ส่งข้อความเตือน ${dayStaffStr} เข้ากลุ่ม LINE แล้ว`, 'info');
        } else {
            const nextDaySched = appState.schedules.find(s => s.day > today && s.dayDuty);
            if (nextDaySched) {
                const nextStaffStr = nextDaySched.dayDuty.staff.join(', ');
                const nextInsp = nextDaySched.dayDuty.inspector;
                pushLineGroupMessage(
                    '🤖 บอทเวรยาม อบต.ฝางคำ',
                    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80',
                    `📢 [แจ้งเตือนเตรียมเข้าเวรวันหยุดถัดไป]\nเรียน ${nextStaffStr}\nท่านมีหน้าที่เข้าเวรกลางวัน (${getThaiDateLabel(nextDaySched.day)})\n• เวลา: ๐๘.๐๐ - ๑๖.๓๐ น.\n• ผู้ตรวจเวร: ${nextInsp}`,
                    'LINE Bot',
                    false
                );
                showToast('ส่งแจ้งเตือนผลัดถัดไปแล้ว', `ส่งข้อความเตือน ${nextStaffStr} เข้ากลุ่ม LINE แล้ว`, 'info');
            } else {
                showToast('วันนี้ไม่มีเวรกลางวัน', 'วันนี้เป็นวันทำการปกติ ไม่มีเวรยามกะกลางวัน', 'info');
            }
        }
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
let currentShareDay = getRealTodayDay();

function buildLineShareDutyText(targetDay) {
    const day = parseInt(targetDay, 10) || (appState.currentSystemDay || getRealTodayDay());
    const sched = appState.schedules.find(s => s.day === day);
    const dateLabel = getThaiDateLabel(day);
    const currentOrigin = (typeof window !== 'undefined' && window.location.origin) ? window.location.origin : 'http://localhost:8080';

    let msg = `📢 [ประกาศตารางเวรยาม อบต.ฝางคำ ประจำ${dateLabel}]\n`;
    msg += `🏛️ ที่ทำการ อบต.ฝางคำ อ.สิรินธร จ.อุบลราชธานี\n\n`;

    if (sched && sched.dayDuty) {
        msg += `☀️ เวรกลางวัน (๐๘.๐๐ - ๑๖.๓๐ น.):\n`;
        msg += `• ผู้อยู่เวร: ${sched.dayDuty.staff.join(', ')}\n`;
        msg += `• ผู้ตรวจเวร: ${sched.dayDuty.inspector}\n\n`;
    } else {
        const nextDaySched = appState.schedules.find(s => s.day > day && s.dayDuty);
        msg += `🏢 เวรกลางวัน: วันทำการปกติ (ปฏิบัติงานตามเวลาราชการ ๐๘.๓๐ - ๑๖.๓๐ น.)\n`;
        if (nextDaySched) {
            msg += `• ผลัดถัดไป (${getThaiDateLabel(nextDaySched.day)}): ${nextDaySched.dayDuty.staff.join(', ')}\n`;
            msg += `• ผู้ตรวจเวร: ${nextDaySched.dayDuty.inspector}\n\n`;
        } else {
            msg += `\n`;
        }
    }

    if (sched && sched.nightDuty) {
        msg += `🌙 เวรกลางคืน คืนนี้ (๑๖.๓๐ - ๐๘.๐๐ น.):\n`;
        msg += `• ผู้อยู่เวร: ${sched.nightDuty.staff.join(', ')}\n`;
        msg += `• ผู้ตรวจเวร: ${sched.nightDuty.inspector}\n\n`;
    }

    msg += `📍 เจ้าหน้าที่ลงเวลาเข้าเวร (GPS ในรัศมี ๑๕๐ ม.) และตรวจเวรได้ที่:\n${currentOrigin}/`;
    return msg;
}

function populateLineShareDayOptions(selectedDay) {
    const select = document.getElementById('line-share-day-select');
    if (!select) return;

    const realToday = getRealTodayDay();
    const currentSysDay = appState.currentSystemDay || realToday;
    const tomorrow = Math.min(realToday + 1, 31);

    let html = '';
    for (let d = 1; d <= 31; d++) {
        const sched = appState.schedules.find(s => s.day === d);
        let tag = '';
        if (d === currentSysDay) tag = ' ★ (วันนี้)';
        else if (d === tomorrow) tag = ' (พรุ่งนี้)';
        
        let shiftTag = '';
        if (sched && sched.dayDuty) {
            shiftTag = ' [☀️ กะกลางวัน + 🌙 กลางคืน]';
        } else {
            shiftTag = ' [🌙 กะกลางคืน]';
        }

        const dateLabel = getThaiDateLabel(d);
        html += `<option value="${d}" ${d === selectedDay ? 'selected' : ''}>${dateLabel}${tag}${shiftTag}</option>`;
    }
    select.innerHTML = html;
}

function changeLineShareDay(dayVal, autoCopy = true) {
    const day = parseInt(dayVal, 10);
    if (isNaN(day) || day < 1 || day > 31) return;

    currentShareDay = day;
    populateLineShareDayOptions(currentShareDay);

    const text = buildLineShareDutyText(currentShareDay);
    currentShareText = text;

    const preview = document.getElementById('line-share-text-preview');
    if (preview) preview.value = text;

    if (autoCopy) {
        try {
            navigator.clipboard.writeText(text);
        } catch(e) {}
        showToast('อัปเดตข้อความแล้ว 📋', `เลือกตารางเวร ${getThaiDateLabel(day)} พร้อมกดวาง (Ctrl+V) ได้เลย`, 'success');
    }
}

function stepLineShareDay(delta) {
    let nextDay = (currentShareDay || (appState.currentSystemDay || getRealTodayDay())) + delta;
    if (nextDay < 1) nextDay = 1;
    if (nextDay > 31) nextDay = 31;
    changeLineShareDay(nextDay);
}

function setLineShareQuickDay(type) {
    const realToday = getRealTodayDay();
    if (type === 'today') {
        changeLineShareDay(realToday);
    } else if (type === 'tomorrow') {
        changeLineShareDay(Math.min(realToday + 1, 31));
    }
}

function openLineShareModal(title, text) {
    currentShareText = text;
    const modal = document.getElementById('line-share-modal');
    const preview = document.getElementById('line-share-text-preview');
    if (preview) preview.value = text;
    
    // เติมตัวเลือกวันในดรอปดาวน์
    populateLineShareDayOptions(currentShareDay || (appState.currentSystemDay || getRealTodayDay()));

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

function shareDutyToLineOpenChat(targetDay) {
    const day = targetDay ? parseInt(targetDay, 10) : (appState.currentSystemDay || getRealTodayDay());
    currentShareDay = day;
    populateLineShareDayOptions(day);

    const msg = buildLineShareDutyText(day);
    openLineShareModal(`ประกาศตารางเวรประจำ${getThaiDateLabel(day)}`, msg);
}

function shareCheckinToLineOpenChat() {
    const user = appState.currentUser;
    if (!user) {
        showToast('กรุณาเข้าสู่ระบบก่อน', 'เข้าสู่ระบบเพื่อสร้างข้อความรายงานของท่าน', 'info');
        return;
    }

    const currentDay = appState.currentSystemDay || getRealTodayDay();
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

function printOfficialOrderDocument() {
    const doc = document.getElementById('official-print-document');
    if (!doc) return;
    const tbody = document.getElementById('print-table-body');
    const tableHtml = tbody ? tbody.innerHTML : '';
    const mayorName = appState.settings ? appState.settings.mayorName : 'นายกองค์การบริหารส่วนตำบลฝางคำ';

    doc.innerHTML = `
        <div style="font-family: 'Sarabun', sans-serif; color: #000; padding: 10px 0;">
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: 38pt; line-height: 1;">🦅</div>
                <h2 style="font-size: 17pt; font-weight: bold; margin: 8px 0 2px 0;">คำสั่งองค์การบริหารส่วนตำบลฝางคำ</h2>
                <h3 style="font-size: 14pt; font-weight: normal; margin: 2px 0;">ที่ ......... / ๒๕๖๙</h3>
                <h3 style="font-size: 15pt; font-weight: bold; margin: 4px 0 10px 0;">เรื่อง แต่งตั้งเจ้าหน้าที่อยู่เวรรักษาการณ์สถานที่ราชการ ประจำเดือน ตุลาคม ๒๕๖๙</h3>
            </div>
            <p style="font-size: 12pt; text-indent: 2.5em; line-height: 1.6; text-align: justify; margin-bottom: 15px;">
                เพื่อรักษาความปลอดภัยสถานที่ราชการและความสงบเรียบร้อยของที่ทำการองค์การบริหารส่วนตำบลฝางคำ อำเภอสิรินธร จังหวัดอุบลราชธานี จึงแต่งตั้งข้าราชการและพนักงานส่วนตำบลอยู่เวรรักษาการณ์สถานที่ราชการ ประจำผลัดเวรกลางวัน (หญิง) และผลัดเวรกลางคืน (ชาย) พร้อมทั้งแต่งตั้งผู้ตรวจเวร ประจำเดือน ตุลาคม พ.ศ. ๒๕๖๙ ดังมีรายนามต่อไปนี้
            </p>
            <table class="print-table" style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                <thead>
                    <tr style="background-color: #f1f5f9; text-align: center; font-weight: bold;">
                        <th style="width: 35px;">ลำดับ</th>
                        <th style="width: 80px;">วัน เดือน ปี</th>
                        <th style="width: 120px;">ผลัดเวลา</th>
                        <th>ชื่อผู้เข้าเวร</th>
                        <th style="width: 130px;">ตำแหน่ง</th>
                        <th style="width: 140px;">ผู้ตรวจเวร</th>
                        <th style="width: 80px;">ลายมือชื่อ</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableHtml}
                </tbody>
            </table>
            <div class="print-avoid-break" style="margin-top: 30px; text-align: right; font-size: 12pt; line-height: 1.8; padding-right: 30px;">
                <p>สั่ง ณ วันที่ ........ เดือน ........................ พ.ศ. ๒๕๖๙</p>
                <div style="height: 45px;"></div>
                <p>( .................................................... )</p>
                <p style="font-weight: bold;">${mayorName}</p>
            </div>
        </div>
    `;
    window.print();
}

// -------------------------------------------------------------
// ระบบรายงานการลงเวลาเวรยามและพิมพ์เอกสารราชการเป็น PDF (Duty Attendance Report & Government PDF)
// -------------------------------------------------------------

function toThaiNumerals(num) {
    if (num === null || num === undefined) return '';
    const thaiDigits = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
    return String(num).replace(/[0-9]/g, d => thaiDigits[parseInt(d, 10)]);
}

function findStaffUserByName(name) {
    if (!name) return null;
    const cleanName = name.replace(/^(นาย|นาง|นางสาว|จ\.ส\.ท\.|จ\.ส\.อ\.|จ่าเอก)/g, '').trim();
    return ALL_SYSTEM_USERS.find(u => {
        if (u.name.trim() === name.trim()) return true;
        const uClean = u.name.replace(/^(นาย|นาง|นางสาว|จ\.ส\.ท\.|จ\.ส\.อ\.|จ่าเอก)/g, '').trim();
        return uClean === cleanName;
    }) || null;
}

function getCheckinRecordForDuty(staffUser, staffName, dateStr, shift) {
    if (!appState.todayCheckins) return null;
    if (staffUser) {
        const directKeys = [
            `${staffUser.id}_${dateStr}_${shift}`,
            `${staffUser.username}_${dateStr}_${shift}`,
            `${staffUser.id}_${dateStr}`,
            `${staffUser.username}_${dateStr}`
        ];
        for (const k of directKeys) {
            if (appState.todayCheckins[k]) return appState.todayCheckins[k];
        }
    }
    // Search in all saved checkins
    for (const k in appState.todayCheckins) {
        const rec = appState.todayCheckins[k];
        if (rec && rec.date === dateStr && rec.shift === shift) {
            if (staffUser && (rec.staffId === staffUser.id || rec.staffId === staffUser.username)) return rec;
            if (rec.staffName && staffName && rec.staffName.trim() === staffName.trim()) return rec;
        }
    }
    return null;
}

function initReportTab() {
    const select = document.getElementById('report-select-day');
    if (!select) return;

    if (!appState.reportSelectedDay) {
        appState.reportSelectedDay = appState.currentSystemDay || getRealTodayDay() || 3;
    }

    let optionsHtml = '';
    const thaiDays = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
    for (let d = 1; d <= 31; d++) {
        const dateObj = new Date(2026, 9, d);
        const dayOfWeek = dateObj.getDay();
        const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
        const isHoliday = isWeekend || d === 13 || d === 23;
        const holidayTag = isHoliday ? ' [วันหยุดราชการ]' : '';
        const selected = (d === appState.reportSelectedDay) ? 'selected' : '';
        optionsHtml += `<option value="${d}" ${selected}>${thaiDays[dayOfWeek]}ที่ ${d} ต.ค. ๒๕๖๙${holidayTag}</option>`;
    }
    select.innerHTML = optionsHtml;
}

function setReportPeriodMode(mode) {
    appState.reportPeriodMode = mode;
    const btnDay = document.getElementById('report-mode-day');
    const btnMonth = document.getElementById('report-mode-month');
    const dayControls = document.getElementById('report-day-controls');

    if (mode === 'day') {
        if (btnDay) btnDay.className = 'px-3 py-1.5 rounded-lg font-bold bg-white text-emerald-700 shadow-xs transition';
        if (btnMonth) btnMonth.className = 'px-3 py-1.5 rounded-lg font-medium text-slate-600 hover:text-slate-900 transition';
        if (dayControls) dayControls.classList.remove('hidden');
    } else {
        if (btnDay) btnDay.className = 'px-3 py-1.5 rounded-lg font-medium text-slate-600 hover:text-slate-900 transition';
        if (btnMonth) btnMonth.className = 'px-3 py-1.5 rounded-lg font-bold bg-white text-emerald-700 shadow-xs transition';
        if (dayControls) dayControls.classList.add('hidden');
    }

    renderAttendanceReport();
}

function changeReportDay(offset) {
    let day = (appState.reportSelectedDay || 3) + offset;
    if (day < 1) day = 1;
    if (day > 31) day = 31;
    appState.reportSelectedDay = day;

    const select = document.getElementById('report-select-day');
    if (select) select.value = day;

    renderAttendanceReport();
}

function setReportDayToday() {
    const today = appState.currentSystemDay || getRealTodayDay() || 3;
    appState.reportSelectedDay = today;
    const select = document.getElementById('report-select-day');
    if (select) select.value = today;
    renderAttendanceReport();
}

function onReportDayChange(val) {
    const day = parseInt(val, 10);
    if (!isNaN(day) && day >= 1 && day <= 31) {
        appState.reportSelectedDay = day;
        renderAttendanceReport();
    }
}

function applyReportFilters() {
    const shiftEl = document.getElementById('report-filter-shift');
    const statusEl = document.getElementById('report-filter-status');
    const searchEl = document.getElementById('report-search-input');

    if (shiftEl) appState.reportFilterShift = shiftEl.value;
    if (statusEl) appState.reportFilterStatus = statusEl.value;
    if (searchEl) appState.reportSearchQuery = searchEl.value.trim().toLowerCase();

    renderAttendanceReport();
}

function getFilteredAttendanceList() {
    const targetDays = (appState.reportPeriodMode === 'month')
        ? appState.schedules
        : appState.schedules.filter(s => s.day === (appState.reportSelectedDay || 3));

    const currentSystemDay = appState.currentSystemDay || getRealTodayDay() || 3;
    const items = [];

    targetDays.forEach(s => {
        const dateStr = `2026-10-${String(s.day).padStart(2, '0')}`;

        // 1. ผลัดกลางวัน (ถ้ามี)
        if (s.dayDuty && Array.isArray(s.dayDuty.staff)) {
            s.dayDuty.staff.forEach(staffName => {
                const user = findStaffUserByName(staffName);
                const rec = getCheckinRecordForDuty(user, staffName, dateStr, 'day');
                
                let status = 'pending';
                let statusLabel = (s.day < currentSystemDay) ? 'ขาดเวร / ไม่พบข้อมูล' : 'รอถึงกำหนดเวลา';
                let badgeClass = (s.day < currentSystemDay) ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-slate-100 text-slate-700 border-slate-200';

                if (rec && rec.checkinTime && rec.checkoutTime) {
                    status = 'completed';
                    statusLabel = 'ลงเวลาครบ (เข้า-ออก)';
                    badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                } else if (rec && rec.checkinTime) {
                    status = 'active';
                    statusLabel = 'อยู่ระหว่างปฏิบัติหน้าที่';
                    badgeClass = 'bg-blue-100 text-blue-800 border-blue-200';
                }

                items.push({
                    day: s.day,
                    dateStr: dateStr,
                    shift: 'day',
                    shiftName: 'กะกลางวัน (08.00 - 16.30 น.)',
                    shiftBadge: 'bg-amber-100 text-amber-900 border-amber-200',
                    staffName: staffName,
                    staffUser: user,
                    position: user ? user.position : 'พนักงานส่วนตำบล',
                    dept: user ? user.dept : 'อบต.ฝางคำ',
                    avatar: user ? user.avatar : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80',
                    inspector: s.dayDuty.inspector,
                    record: rec,
                    status: status,
                    statusLabel: statusLabel,
                    badgeClass: badgeClass
                });
            });
        }

        // 2. ผลัดกลางคืน
        if (s.nightDuty && Array.isArray(s.nightDuty.staff)) {
            s.nightDuty.staff.forEach(staffName => {
                const user = findStaffUserByName(staffName);
                const rec = getCheckinRecordForDuty(user, staffName, dateStr, 'night');

                let status = 'pending';
                let statusLabel = (s.day < currentSystemDay) ? 'ขาดเวร / ไม่พบข้อมูล' : 'รอถึงกำหนดเวลา';
                let badgeClass = (s.day < currentSystemDay) ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-slate-100 text-slate-700 border-slate-200';

                if (rec && rec.checkinTime && rec.checkoutTime) {
                    status = 'completed';
                    statusLabel = 'ลงเวลาครบ (เข้า-ออก)';
                    badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                } else if (rec && rec.checkinTime) {
                    status = 'active';
                    statusLabel = 'อยู่ระหว่างปฏิบัติหน้าที่';
                    badgeClass = 'bg-blue-100 text-blue-800 border-blue-200';
                }

                items.push({
                    day: s.day,
                    dateStr: dateStr,
                    shift: 'night',
                    shiftName: 'กะกลางคืน (16.30 - 08.00 น.)',
                    shiftBadge: 'bg-slate-900 text-white border-slate-900',
                    staffName: staffName,
                    staffUser: user,
                    position: user ? user.position : 'พนักงานส่วนตำบล',
                    dept: user ? user.dept : 'อบต.ฝางคำ',
                    avatar: user ? user.avatar : 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80',
                    inspector: s.nightDuty.inspector,
                    record: rec,
                    status: status,
                    statusLabel: statusLabel,
                    badgeClass: badgeClass
                });
            });
        }
    });

    // Apply Filter Shifts
    let filtered = items;
    if (appState.reportFilterShift && appState.reportFilterShift !== 'all') {
        filtered = filtered.filter(item => item.shift === appState.reportFilterShift);
    }

    // Apply Filter Status
    if (appState.reportFilterStatus && appState.reportFilterStatus !== 'all') {
        filtered = filtered.filter(item => item.status === appState.reportFilterStatus);
    }

    // Apply Search Query
    if (appState.reportSearchQuery) {
        const q = appState.reportSearchQuery;
        filtered = filtered.filter(item => {
            return item.staffName.toLowerCase().includes(q) ||
                   item.position.toLowerCase().includes(q) ||
                   item.dept.toLowerCase().includes(q) ||
                   item.inspector.toLowerCase().includes(q);
        });
    }

    return { allItems: items, filteredItems: filtered };
}

function renderAttendanceReport() {
    const tableBody = document.getElementById('report-table-body');
    if (!tableBody) return;

    const { allItems, filteredItems } = getFilteredAttendanceList();

    // 1. Calculate KPI Metrics based on full period list
    const totalCount = allItems.length;
    let checkedInCount = 0;
    let checkedOutCount = 0;
    let pendingCount = 0;

    allItems.forEach(item => {
        if (item.record && item.record.checkinTime) checkedInCount++;
        if (item.record && item.record.checkoutTime) checkedOutCount++;
        if (!item.record || !item.record.checkinTime) pendingCount++;
    });

    // 2. Update KPI Elements
    const statTotalEl = document.getElementById('report-stat-total');
    const statCheckedInEl = document.getElementById('report-stat-checkedin');
    const statCheckedOutEl = document.getElementById('report-stat-checkedout');
    const statPendingEl = document.getElementById('report-stat-pending');
    const badgeCountEl = document.getElementById('report-record-count-badge');
    const titleEl = document.getElementById('report-table-title');
    const subTitleEl = document.getElementById('report-table-subtitle');

    if (statTotalEl) statTotalEl.textContent = `${totalCount} คน`;
    if (statCheckedInEl) statCheckedInEl.textContent = `${checkedInCount} คน`;
    if (statCheckedOutEl) statCheckedOutEl.textContent = `${checkedOutCount} คน`;
    if (statPendingEl) statPendingEl.textContent = `${pendingCount} คน`;
    if (badgeCountEl) badgeCountEl.textContent = `${filteredItems.length} รายการ`;

    if (appState.reportPeriodMode === 'month') {
        if (titleEl) titleEl.textContent = 'รายงานสรุปการลงเวลาเวรยาม ประจำเดือน ตุลาคม ๒๕๖๙';
        if (subTitleEl) subTitleEl.textContent = 'ภาพรวมผลการปฏิบัติหน้าที่ทั้ง ๓๑ วัน ณ ที่ทำการ อบต.ฝางคำ';
    } else {
        const thaiDate = getThaiDateLabel(appState.reportSelectedDay || 3);
        if (titleEl) titleEl.textContent = `รายงานการลงเวลาเวรยาม ประจำ${thaiDate}`;
        if (subTitleEl) subTitleEl.textContent = `ตรวจสอบรายชื่อ เวลาเข้าเวร-ออกเวร และผู้ตรวจเวรประจำวัน`;
    }

    // 3. Render Table Rows
    if (filteredItems.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-10 text-slate-400">
                    <div class="text-3xl mb-2">🔍</div>
                    <div class="font-bold text-sm text-slate-600">ไม่พบข้อมูลการปฏิบัติหน้าที่ตามเงื่อนไขที่เลือก</div>
                    <div class="text-xs text-slate-400 mt-1">ลองเปลี่ยนตัวกรองผลัดเวร สถานะ หรือเคลียร์ช่องค้นหา</div>
                </td>
            </tr>
        `;
        return;
    }

    let rowsHtml = '';
    filteredItems.forEach((item, idx) => {
        const checkinTime = (item.record && item.record.checkinTime) ? item.record.checkinTime : '<span class="text-slate-400 italic">ยังไม่ลงเวลา</span>';
        const checkoutTime = (item.record && item.record.checkoutTime) ? item.record.checkoutTime : (item.record && item.record.checkinTime ? '<span class="text-blue-600 font-semibold">อยู่ระหว่างปฏิบัติหน้าที่</span>' : '<span class="text-slate-400 italic">-</span>');
        
        let gpsBadge = '';
        if (item.record && item.record.checkinTime) {
            const dist = item.record.distance || 25;
            gpsBadge = `<div class="mt-1 flex items-center space-x-1 text-[11px] text-emerald-700 font-medium"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span><span>GPS ในเขต (${dist} ม.)</span></div>`;
        }

        const noteText = item.record ? (item.record.notes || item.record.checkoutNotes || 'ปฏิบัติหน้าที่เรียบร้อย') : '-';

        rowsHtml += `
            <tr class="hover:bg-slate-50/70 transition border-b border-slate-100">
                <td class="py-3.5 px-3 text-center font-bold text-slate-400">${idx + 1}</td>
                <td class="py-3.5 px-3 whitespace-nowrap">
                    <div class="font-bold text-slate-800">${item.day} ต.ค. ๖๙</div>
                    <span class="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.shiftBadge}">
                        ${item.shift === 'day' ? '☀️ กลางวัน' : '🌙 กลางคืน'}
                    </span>
                </td>
                <td class="py-3.5 px-3">
                    <div class="flex items-center space-x-3">
                        <img src="${item.avatar}" alt="" class="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0">
                        <div class="min-w-0">
                            <div class="font-bold text-slate-900 truncate">${item.staffName}</div>
                            <div class="text-[11px] text-slate-400 font-mono">${item.staffUser ? `@${item.staffUser.username}` : ''}</div>
                        </div>
                    </div>
                </td>
                <td class="py-3.5 px-3">
                    <div class="font-medium text-slate-800">${item.position}</div>
                    <div class="text-[11px] text-slate-500">${item.dept}</div>
                </td>
                <td class="py-3.5 px-3 text-center whitespace-nowrap">
                    <span class="inline-block px-2.5 py-1 rounded-xl text-[11px] font-bold border ${item.badgeClass}">
                        ${item.statusLabel}
                    </span>
                </td>
                <td class="py-3.5 px-3 whitespace-nowrap">
                    <div class="font-bold text-slate-900">${checkinTime}</div>
                    ${gpsBadge}
                </td>
                <td class="py-3.5 px-3 whitespace-nowrap">
                    <div class="font-bold text-slate-900">${checkoutTime}</div>
                    ${item.record && item.record.checkoutNotes ? '<div class="text-[11px] text-slate-500 truncate max-w-xs mt-0.5" title="' + item.record.checkoutNotes + '">✓ ส่งมอบเวรแล้ว</div>' : ''}
                </td>
                <td class="py-3.5 px-3">
                    <div class="font-semibold text-slate-900 flex items-center space-x-1">
                        <span>🛡️</span>
                        <span>${item.inspector}</span>
                    </div>
                    <div class="text-[11px] text-slate-500 mt-0.5 line-clamp-1" title="${noteText}">
                        ${noteText}
                    </div>
                </td>
            </tr>
        `;
    });

    tableBody.innerHTML = rowsHtml;
}

function printAttendanceReportPDF() {
    const doc = document.getElementById('official-print-document');
    if (!doc) return;

    const { allItems, filteredItems } = getFilteredAttendanceList();
    const periodMode = appState.reportPeriodMode;
    const selectedDay = appState.reportSelectedDay || 3;
    const thaiPeriod = (periodMode === 'day')
        ? `ประจำวันที่ ${toThaiNumerals(selectedDay)} เดือนตุลาคม พ.ศ. ๒๕๖๙ (${getThaiDateLabel(selectedDay)})`
        : `ประจำเดือนตุลาคม พ.ศ. ๒๕๖๙ (ระหว่างวันที่ ๑ - ๓๑ ตุลาคม ๒๕๖๙)`;

    // Calculate metrics
    let checkedIn = 0;
    let checkedOut = 0;
    let pending = 0;
    filteredItems.forEach(item => {
        if (item.record && item.record.checkinTime) checkedIn++;
        if (item.record && item.record.checkoutTime) checkedOut++;
        if (!item.record || !item.record.checkinTime) pending++;
    });

    let tableRows = '';
    filteredItems.forEach((item, idx) => {
        const inTime = (item.record && item.record.checkinTime) ? toThaiNumerals(item.record.checkinTime.replace(' น.', '')) + ' น.' : '-';
        const outTime = (item.record && item.record.checkoutTime) ? toThaiNumerals(item.record.checkoutTime.replace(' น.', '')) + ' น.' : (item.record && item.record.checkinTime ? 'อยู่ระหว่างปฏิบัติหน้าที่' : '-');
        const shiftLabel = item.shift === 'day' ? 'กลางวัน (๐๘.๐๐-๑๖.๓๐ น.)' : 'กลางคืน (๑๖.๓๐-๐๘.๐๐ น.)';
        const note = item.record ? (item.record.notes || 'เหตุการณ์ปกติ') : (item.day < (appState.currentSystemDay || 3) ? 'ขาดการลงเวลา' : 'รอถึงกำหนดเวลา');

        tableRows += `
            <tr>
                <td style="text-align: center;">${toThaiNumerals(idx + 1)}</td>
                <td style="text-align: center;">${toThaiNumerals(item.day)} ต.ค. ๖๙</td>
                <td style="text-align: center;">${shiftLabel}</td>
                <td style="font-weight: bold;">${item.staffName}</td>
                <td>${item.position} (${item.dept})</td>
                <td style="text-align: center;">${item.statusLabel}</td>
                <td style="text-align: center;">${inTime}</td>
                <td style="text-align: center;">${outTime}</td>
                <td>${item.inspector}<br><span style="font-size: 9pt; color: #475569;">${note}</span></td>
                <td style="text-align: center;">.........................</td>
            </tr>
        `;
    });

    const mayorName = appState.settings ? appState.settings.mayorName : 'นายกองค์การบริหารส่วนตำบลฝางคำ';
    const clerkName = appState.settings ? appState.settings.clerkName : 'ปลัดองค์การบริหารส่วนตำบลฝางคำ';

    doc.innerHTML = `
        <div style="font-family: 'Sarabun', sans-serif; color: #000; padding: 10px 0;">
            <!-- Official Header with Garuda -->
            <div style="text-align: center; margin-bottom: 16px;">
                <div style="font-size: 36pt; line-height: 1;">🦅</div>
                <h2 style="font-size: 16pt; font-weight: bold; margin: 6px 0 2px 0;">รายงานสรุปผลการปฏิบัติหน้าที่และการลงเวลาเวรยามรักษาการณ์สถานที่ราชการ</h2>
                <h3 style="font-size: 14pt; font-weight: bold; margin: 2px 0;">องค์การบริหารส่วนตำบลฝางคำ อำเภอสิรินธร จังหวัดอุบลราชธานี</h3>
                <p style="font-size: 12pt; margin: 4px 0 10px 0;">${thaiPeriod}</p>
            </div>

            <!-- Summary KPI Box -->
            <div style="border: 1px solid #000; padding: 6px 12px; margin-bottom: 14px; font-size: 10.5pt; background-color: #f8fafc; -webkit-print-color-adjust: exact;">
                <strong>สรุปการปฏิบัติหน้าที่:</strong> 
                เจ้าหน้าที่ตามคำสั่งทั้งหมด <strong>${toThaiNumerals(filteredItems.length)}</strong> นาย | 
                ลงเวลาเข้าเวรแล้ว <strong>${toThaiNumerals(checkedIn)}</strong> นาย | 
                ส่งมอบเวรและออกเวรแล้ว <strong>${toThaiNumerals(checkedOut)}</strong> นาย | 
                ยังไม่ลงเวลา/รอถึงกำหนด <strong>${toThaiNumerals(pending)}</strong> นาย
            </div>

            <!-- Official Attendance Table -->
            <table class="print-table" style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                    <tr style="background-color: #f1f5f9; text-align: center;">
                        <th style="width: 32px;">ลำดับ</th>
                        <th style="width: 65px;">วันที่</th>
                        <th style="width: 110px;">ผลัดเวลา</th>
                        <th style="width: 140px; text-align: left;">ชื่อ - สกุล ผู้ปฏิบัติหน้าที่</th>
                        <th style="width: 130px; text-align: left;">ตำแหน่ง / สังกัด</th>
                        <th style="width: 85px;">สถานะ</th>
                        <th style="width: 70px;">เวลาเข้าเวร</th>
                        <th style="width: 70px;">เวลาออกเวร</th>
                        <th style="text-align: left;">ผู้ตรวจเวร / บันทึกผล</th>
                        <th style="width: 75px;">ลายมือชื่อ</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>

            <!-- Formal 4-Party Government Signatures -->
            <div class="print-avoid-break" style="margin-top: 25px; font-size: 11pt; line-height: 1.6;">
                <table style="width: 100%; border: none;">
                    <tr>
                        <td style="width: 50%; vertical-align: top; text-align: center; padding: 10px 15px;">
                            <p>ลงชื่อ .............................................................. ผู้รายงาน</p>
                            <p>( .............................................................. )</p>
                            <p>ตำแหน่ง เจ้าหน้าที่ผู้รับผิดชอบงานเวรยาม</p>
                            <p>วันที่ ........ เดือน ........................ พ.ศ. ๒๕๖๙</p>
                        </td>
                        <td style="width: 50%; vertical-align: top; text-align: center; padding: 10px 15px;">
                            <p>ลงชื่อ .............................................................. ผู้ตรวจเวรยาม</p>
                            <p>( .............................................................. )</p>
                            <p>ตำแหน่ง ผู้ตรวจเวรยามประจำผลัด</p>
                            <p>วันที่ ........ เดือน ........................ พ.ศ. ๒๕๖๙</p>
                        </td>
                    </tr>
                    <tr><td colspan="2" style="height: 18px;"></td></tr>
                    <tr>
                        <td style="width: 50%; vertical-align: top; text-align: center; padding: 10px 15px;">
                            <p>ลงชื่อ .............................................................. ผู้ตรวจสอบ</p>
                            <p>( นายชาญชัย อักโข )</p>
                            <p>ตำแหน่ง หัวหน้าสำนักปลัด อบต.ฝางคำ</p>
                            <p>วันที่ ........ เดือน ........................ พ.ศ. ๒๕๖๙</p>
                        </td>
                        <td style="width: 50%; vertical-align: top; text-align: center; padding: 10px 15px;">
                            <p>ลงชื่อ .............................................................. ผู้รับทราบ/สั่งการ</p>
                            <p>( .............................................................. )</p>
                            <p>ตำแหน่ง ${mayorName}</p>
                            <p>วันที่ ........ เดือน ........................ พ.ศ. ๒๕๖๙</p>
                        </td>
                    </tr>
                </table>
            </div>
        </div>
    `;

    // Trigger Print Dialog
    window.print();
}

function exportAttendanceReportCSV() {
    const { filteredItems } = getFilteredAttendanceList();
    if (filteredItems.length === 0) {
        showToast('ไม่มีข้อมูล', 'ไม่มีรายการที่จะส่งออกตามตัวกรองที่เลือก', 'warning');
        return;
    }

    let csvContent = '\uFEFF'; // UTF-8 BOM for Microsoft Excel
    csvContent += 'ลำดับ,วันที่,ผลัดเวร,ชื่อผู้เข้าเวร,ตำแหน่ง,สังกัด,สถานะ,เวลาเข้าเวร,เวลาออกเวร,ผู้ตรวจเวร,บันทึกเหตุการณ์\n';

    filteredItems.forEach((item, idx) => {
        const inTime = item.record && item.record.checkinTime ? item.record.checkinTime : '-';
        const outTime = item.record && item.record.checkoutTime ? item.record.checkoutTime : '-';
        const notes = item.record ? (item.record.notes || item.record.checkoutNotes || 'ปกติ') : '-';
        const cleanNotes = notes.replace(/"/g, '""').replace(/\n/g, ' ');

        csvContent += `"${idx + 1}","${item.day} ต.ค. 2569","${item.shiftName}","${item.staffName}","${item.position}","${item.dept}","${item.statusLabel}","${inTime}","${outTime}","${item.inspector}","${cleanNotes}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const filename = `รายงานการลงเวลาเวรยาม_อบตฝางคำ_${appState.reportPeriodMode === 'month' ? 'ทั้งเดือน_ตค2569' : 'วันที่_' + appState.reportSelectedDay + '_ตค2569'}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('ส่งออก CSV สำเร็จ', `ดาวน์โหลด ${filename} เรียบร้อยแล้ว`, 'success');
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
    if (!isCurrentUserAdmin()) {
        showToast('สงวนสิทธิ์เฉพาะแอดมิน 🔒', 'เฉพาะผู้ดูแลระบบ (Admin) หรือผู้บริหารเท่านั้นที่สามารถบันทึกการตั้งค่าระบบได้', 'error');
        return;
    }

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
    if (!isCurrentUserAdmin()) {
        showToast('สงวนสิทธิ์เฉพาะแอดมิน 🔒', 'เฉพาะผู้ดูแลระบบ (Admin) หรือผู้บริหารเท่านั้นที่สามารถคืนค่าเริ่มต้นได้', 'error');
        return;
    }
    if (!confirm('ต้องการคืนค่าการตั้งค่าเริ่มต้นใช่หรือไม่?')) return;
    appState.settings = { ...DEFAULT_SETTINGS };
    loadSettingsToForm();
    showToast('คืนค่าเริ่มต้นเรียบร้อย', 'ข้อมูลการตั้งค่าถูกรีเซ็ตกลับเป็นค่ามาตรฐาน อบต.ฝางคำ', 'info');
}

// -------------------------------------------------------------
// ระบบจัดการข้อมูลผู้ใช้งานและบุคลากร (User & Personnel Settings)
// -------------------------------------------------------------
let settingsUserFilterCat = 'all';
let settingsUserSearchQuery = '';

function switchSettingsSubTab(subTab) {
    const btnUsers = document.getElementById('btn-setting-sub-users');
    const btnSystem = document.getElementById('btn-setting-sub-system');
    const tabUsers = document.getElementById('settings-subtab-users');
    const tabSystem = document.getElementById('settings-subtab-system');

    if (subTab === 'users') {
        if (btnUsers) {
            btnUsers.className = 'setting-subtab-btn px-3.5 sm:px-4 py-2 rounded-xl bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap';
        }
        if (btnSystem) {
            btnSystem.className = 'setting-subtab-btn px-3.5 sm:px-4 py-2 rounded-xl bg-transparent text-slate-600 hover:text-slate-900 font-semibold text-xs transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap';
        }
        if (tabUsers) tabUsers.classList.remove('hidden');
        if (tabSystem) tabSystem.classList.add('hidden');
        renderSettingsUserList();
    } else {
        if (btnUsers) {
            btnUsers.className = 'setting-subtab-btn px-3.5 sm:px-4 py-2 rounded-xl bg-transparent text-slate-600 hover:text-slate-900 font-semibold text-xs transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap';
        }
        if (btnSystem) {
            btnSystem.className = 'setting-subtab-btn px-3.5 sm:px-4 py-2 rounded-xl bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap';
        }
        if (tabUsers) tabUsers.classList.add('hidden');
        if (tabSystem) tabSystem.classList.remove('hidden');
        loadSettingsToForm();
    }
}

function filterSettingsUsers(cat) {
    settingsUserFilterCat = cat;
    document.querySelectorAll('.usercat-btn').forEach(btn => {
        btn.className = 'usercat-btn px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition cursor-pointer';
    });
    const activeBtn = document.getElementById(`btn-usercat-${cat}`);
    if (activeBtn) {
        activeBtn.className = 'usercat-btn px-3 py-1.5 rounded-xl bg-emerald-700 text-white font-bold transition cursor-pointer';
    }
    renderSettingsUserList();
}

function handleSettingsUserSearch(query) {
    settingsUserSearchQuery = (query || '').trim().toLowerCase();
    renderSettingsUserList();
}

function renderSettingsUserList() {
    const grid = document.getElementById('settings-users-grid');
    if (!grid) return;

    const isAdmin = isCurrentUserAdmin();
    const btnReset30 = document.getElementById('btn-settings-reset-30');
    const btnAddUser = document.getElementById('btn-settings-add-user');
    if (btnReset30) btnReset30.style.display = isAdmin ? 'inline-flex' : 'none';
    if (btnAddUser) btnAddUser.style.display = isAdmin ? 'inline-flex' : 'none';

    // Update counts
    const countAll = document.getElementById('user-count-all');
    const countNight = document.getElementById('user-count-night');
    const countDay = document.getElementById('user-count-day');
    const countInsp = document.getElementById('user-count-inspector');
    const countAdmin = document.getElementById('user-count-admin');

    if (countAll) countAll.textContent = ALL_SYSTEM_USERS.length;
    if (countNight) countNight.textContent = ALL_SYSTEM_USERS.filter(u => u.category === 'night').length;
    if (countDay) countDay.textContent = ALL_SYSTEM_USERS.filter(u => u.category === 'day').length;
    if (countInsp) countInsp.textContent = ALL_SYSTEM_USERS.filter(u => u.category === 'inspector').length;
    if (countAdmin) countAdmin.textContent = ALL_SYSTEM_USERS.filter(u => u.category === 'admin').length;

    let filtered = ALL_SYSTEM_USERS;
    if (settingsUserFilterCat !== 'all') {
        filtered = filtered.filter(u => u.category === settingsUserFilterCat);
    }
    if (settingsUserSearchQuery) {
        const q = settingsUserSearchQuery;
        filtered = filtered.filter(u => 
            (u.name && u.name.toLowerCase().includes(q)) ||
            (u.username && u.username.toLowerCase().includes(q)) ||
            (u.position && u.position.toLowerCase().includes(q)) ||
            (u.roleName && u.roleName.toLowerCase().includes(q)) ||
            (u.dept && u.dept.toLowerCase().includes(q)) ||
            (u.phone && u.phone.includes(q))
        );
    }

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full py-12 text-center bg-slate-50 rounded-3xl border border-slate-200">
                <span class="text-3xl block mb-2">🔍</span>
                <p class="text-sm font-bold text-slate-700">ไม่พบบุคลากรที่ตรงกับคำค้นหา</p>
                <p class="text-xs text-slate-400 mt-1">ลองพิมพ์คำค้นหาอื่น หรือเลือกหมวดหมู่ "ทั้งหมด"</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map(u => {
        const categoryBadge = {
            night: '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-white">🌙 กะกลางคืน</span>',
            day: '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">☀️ กะกลางวัน</span>',
            inspector: '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">🛡️ ผู้ตรวจเวร</span>',
            admin: '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">👑 แอดมิน/บริหาร</span>'
        }[u.category] || '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">ทั่วไป</span>';

        const roleTitle = u.position || u.roleName || 'เจ้าหน้าที่';
        const isOwn = appState.currentUser && (appState.currentUser.id === u.id || (appState.currentUser.username && appState.currentUser.username.toLowerCase() === u.username.toLowerCase()));

        let editBtnHtml = '';
        if (isAdmin) {
            editBtnHtml = `
                <button type="button" onclick="openEditUserModal('${u.id}')" class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 text-xs font-bold transition flex items-center space-x-1 cursor-pointer whitespace-nowrap">
                    <span>✏️</span>
                    <span>แก้ไข (Admin)</span>
                </button>
            `;
        } else if (isOwn) {
            editBtnHtml = `
                <button type="button" onclick="openEditUserModal('${u.id}')" class="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-800 text-xs font-bold transition flex items-center space-x-1 cursor-pointer whitespace-nowrap">
                    <span>👤</span>
                    <span>โปรไฟล์ฉัน</span>
                </button>
            `;
        } else {
            editBtnHtml = `
                <span class="text-[10px] text-slate-400 font-semibold px-2 py-1 bg-slate-50 rounded-lg border border-slate-200" title="เฉพาะผู้ดูแลระบบ">🔒 สงวนสิทธิ์</span>
            `;
        }

        return `
            <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs hover:shadow-sm hover:border-emerald-300 transition flex flex-col justify-between gap-3">
                <div class="flex items-start space-x-3 min-w-0">
                    <img src="${u.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80'}" class="w-12 h-12 rounded-2xl object-cover border-2 border-slate-100 shrink-0 shadow-2xs" alt="${u.name}">
                    <div class="min-w-0 flex-1">
                        <div class="flex items-center space-x-1.5 flex-wrap gap-y-1">
                            <span class="font-bold text-xs sm:text-sm text-slate-900 truncate">${u.name}</span>
                        </div>
                        <div class="flex items-center space-x-1.5 mt-1 flex-wrap gap-y-1">
                            <span class="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-mono font-bold text-[10px] border border-emerald-200">@${u.username}</span>
                            <span class="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md font-medium">${u.dept}</span>
                        </div>
                        <div class="text-xs text-slate-600 font-medium mt-1 truncate" title="${roleTitle}">
                            💼 ${roleTitle}
                        </div>
                    </div>
                </div>

                <div class="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div class="flex items-center space-x-1.5 min-w-0">
                        ${categoryBadge}
                    </div>
                    <div class="flex items-center space-x-2 shrink-0">
                        ${u.phone ? `<a href="tel:${u.phone}" class="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition text-xs" title="โทร ${u.phone}">📞</a>` : ''}
                        ${editBtnHtml}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function openEditUserModal(userId) {
    const user = ALL_SYSTEM_USERS.find(u => u.id === userId);
    if (!user) return;

    const modal = document.getElementById('user-edit-modal');
    if (!modal) return;

    const isAdmin = isCurrentUserAdmin();
    const isOwnProfile = appState.currentUser && (appState.currentUser.id === user.id || (appState.currentUser.username && appState.currentUser.username.toLowerCase() === user.username.toLowerCase()));

    // หากไม่ใช่แอดมิน และไม่ใช่โปรไฟล์ของตนเอง ห้ามแก้ไขเด็ดขาด!
    if (!isAdmin && !isOwnProfile) {
        showToast('ไม่มีสิทธิ์เข้าถึง 🔒', 'ท่านไม่สามารถแก้ไขข้อมูลของเจ้าหน้าที่ท่านอื่นได้ เฉพาะผู้ดูแลระบบ (Admin) เท่านั้น', 'error');
        return;
    }

    const titleEl = document.getElementById('user-modal-title');
    const subTitleEl = document.getElementById('user-modal-subtitle');
    const alertBox = document.getElementById('user-form-role-alert');
    const alertText = document.getElementById('user-form-role-alert-text');

    if (isAdmin) {
        if (titleEl) titleEl.textContent = `👑 จัดการข้อมูลบุคลากร (สิทธิ์แอดมิน): ${user.name}`;
        if (subTitleEl) subTitleEl.textContent = `กำหนด Username, ตำแหน่งราชการ, สังกัดกอง, สิทธิ์ในระบบ และรหัสผ่าน`;
        if (alertBox) {
            alertBox.className = 'p-3 rounded-2xl text-xs flex items-center space-x-2.5 bg-purple-50 text-purple-900 border border-purple-200';
            alertBox.classList.remove('hidden');
            if (alertText) alertText.textContent = '👑 สิทธิ์แอดมินระดับสูงสุด: ท่านสามารถแก้ไขข้อมูล กำหนดตำแหน่ง สังกัด และสิทธิ์ระบบของเจ้าหน้าที่ท่านนี้ได้อย่างสมบูรณ์';
        }
    } else {
        if (titleEl) titleEl.textContent = `👤 โปรไฟล์ส่วนตัว: ${user.name}`;
        if (subTitleEl) subTitleEl.textContent = `แก้ไขเบอร์โทรศัพท์ รูปโปรไฟล์ และรหัสผ่านส่วนตัว`;
        if (alertBox) {
            alertBox.className = 'p-3 rounded-2xl text-xs flex items-center space-x-2.5 bg-amber-50 text-amber-900 border border-amber-200';
            alertBox.classList.remove('hidden');
            if (alertText) alertText.textContent = '🔒 บัญชีเจ้าหน้าที่ทั่วไป: สามารถเปลี่ยนเบอร์โทรศัพท์ รูปโปรไฟล์ และรหัสผ่านได้ (การเปลี่ยนตำแหน่งราชการและสิทธิ์ระบบต้องให้แอดมินเป็นผู้ดำเนินการ)';
        }
    }

    document.getElementById('user-form-id').value = user.id;

    // Fields that regular staff cannot edit
    const usernameEl = document.getElementById('user-form-username');
    const roleNameEl = document.getElementById('user-form-role-name');
    const deptEl = document.getElementById('user-form-dept');
    const categoryEl = document.getElementById('user-form-category');
    const roleEl = document.getElementById('user-form-role');
    const dutyDaysEl = document.getElementById('user-form-duty-days');

    usernameEl.value = user.username;
    roleNameEl.value = user.position || user.roleName || '';
    deptEl.value = user.dept || 'สำนักปลัด';
    categoryEl.value = user.category || 'night';
    roleEl.value = user.role || 'staff';
    dutyDaysEl.value = user.dutyDays || '';

    // Lock/Unlock fields according to admin status
    [usernameEl, roleNameEl, deptEl, categoryEl, roleEl, dutyDaysEl].forEach(el => {
        if (el) {
            el.disabled = !isAdmin;
            el.classList.toggle('bg-slate-100', !isAdmin);
            el.classList.toggle('cursor-not-allowed', !isAdmin);
        }
    });

    // Personal fields (can be edited by user or admin)
    document.getElementById('user-form-password').value = '';
    document.getElementById('user-form-name').value = user.name;
    document.getElementById('user-form-gender').value = user.gender || 'male';
    document.getElementById('user-form-phone').value = user.phone || '';
    document.getElementById('user-form-avatar').value = user.avatar || '';

    const preview = document.getElementById('user-form-avatar-preview');
    if (preview) {
        preview.src = user.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80';
    }

    renderPresetAvatars();

    const deleteBtn = document.getElementById('btn-user-form-delete');
    if (deleteBtn) {
        if (!isAdmin || user.id === 'admin' || user.id === 'exec') {
            deleteBtn.classList.add('hidden');
        } else {
            deleteBtn.classList.remove('hidden');
        }
    }

    modal.classList.remove('hidden');
}

function openAddUserModal() {
    if (!isCurrentUserAdmin()) {
        showToast('สงวนสิทธิ์เฉพาะแอดมิน 🔒', 'การเพิ่มเจ้าหน้าที่ใหม่ สงวนสิทธิ์เฉพาะผู้ดูแลระบบ (Admin) เท่านั้น', 'warning');
        return;
    }

    const modal = document.getElementById('user-edit-modal');
    if (!modal) return;

    const titleEl = document.getElementById('user-modal-title');
    const subTitleEl = document.getElementById('user-modal-subtitle');
    const alertBox = document.getElementById('user-form-role-alert');
    const alertText = document.getElementById('user-form-role-alert-text');

    if (titleEl) titleEl.textContent = '➕ เพิ่มเจ้าหน้าที่/ผู้ใช้งานใหม่ (สิทธิ์แอดมิน)';
    if (subTitleEl) subTitleEl.textContent = 'กำหนด Username, ตำแหน่งราชการ, สังกัดกอง, สิทธิ์ในระบบ และรหัสผ่าน';
    if (alertBox) {
        alertBox.className = 'p-3 rounded-2xl text-xs flex items-center space-x-2.5 bg-purple-50 text-purple-900 border border-purple-200';
        alertBox.classList.remove('hidden');
        if (alertText) alertText.textContent = '👑 สร้างบัญชีผู้ใช้งานใหม่ กำหนดสิทธิ์และมอบหมายภารกิจเวรยาม';
    }

    // Enable all fields
    const usernameEl = document.getElementById('user-form-username');
    const roleNameEl = document.getElementById('user-form-role-name');
    const deptEl = document.getElementById('user-form-dept');
    const categoryEl = document.getElementById('user-form-category');
    const roleEl = document.getElementById('user-form-role');
    const dutyDaysEl = document.getElementById('user-form-duty-days');

    [usernameEl, roleNameEl, deptEl, categoryEl, roleEl, dutyDaysEl].forEach(el => {
        if (el) {
            el.disabled = false;
            el.classList.remove('bg-slate-100', 'cursor-not-allowed');
        }
    });

    document.getElementById('user-form-id').value = '';
    document.getElementById('user-form-username').value = '';
    document.getElementById('user-form-password').value = '1234';
    document.getElementById('user-form-name').value = '';
    document.getElementById('user-form-role-name').value = '';
    document.getElementById('user-form-dept').value = 'สำนักปลัด';
    document.getElementById('user-form-category').value = 'night';
    document.getElementById('user-form-role').value = 'staff';
    document.getElementById('user-form-gender').value = 'male';
    document.getElementById('user-form-phone').value = '';
    document.getElementById('user-form-duty-days').value = '';
    
    const defaultAvatar = PRESET_AVATARS[0];
    document.getElementById('user-form-avatar').value = defaultAvatar;
    const preview = document.getElementById('user-form-avatar-preview');
    if (preview) preview.src = defaultAvatar;

    renderPresetAvatars();

    const deleteBtn = document.getElementById('btn-user-form-delete');
    if (deleteBtn) deleteBtn.classList.add('hidden');

    modal.classList.remove('hidden');
    document.getElementById('user-form-username').focus();
}

function closeUserEditModal() {
    const modal = document.getElementById('user-edit-modal');
    if (modal) modal.classList.add('hidden');
}

function previewUserAvatar(url) {
    const preview = document.getElementById('user-form-avatar-preview');
    if (preview && url) {
        preview.src = url;
    }
}

function selectPresetAvatar(url) {
    document.getElementById('user-form-avatar').value = url;
    previewUserAvatar(url);
}

function renderPresetAvatars() {
    const container = document.getElementById('user-avatar-presets');
    if (!container) return;

    container.innerHTML = PRESET_AVATARS.map((url, i) => `
        <button type="button" onclick="selectPresetAvatar('${url}')" class="w-7 h-7 rounded-full overflow-hidden border border-slate-200 hover:scale-110 hover:border-emerald-500 transition cursor-pointer shrink-0">
            <img src="${url}" class="w-full h-full object-cover" alt="Preset ${i+1}">
        </button>
    `).join('');
}

function handleSaveUserSubmit(event) {
    if (event) event.preventDefault();

    const isAdmin = isCurrentUserAdmin();
    const id = document.getElementById('user-form-id').value.trim();
    let username = document.getElementById('user-form-username').value.trim().toLowerCase();
    const password = document.getElementById('user-form-password').value.trim();
    const name = document.getElementById('user-form-name').value.trim();
    let roleName = document.getElementById('user-form-role-name').value.trim();
    let dept = document.getElementById('user-form-dept').value;
    let category = document.getElementById('user-form-category').value;
    let role = document.getElementById('user-form-role').value;
    const gender = document.getElementById('user-form-gender').value;
    const phone = document.getElementById('user-form-phone').value.trim();
    let dutyDays = document.getElementById('user-form-duty-days').value.trim();
    const avatar = document.getElementById('user-form-avatar').value.trim() || PRESET_AVATARS[0];

    // Non-admin security validation
    if (!isAdmin) {
        const isOwn = appState.currentUser && (appState.currentUser.id === id || (appState.currentUser.username && appState.currentUser.username.toLowerCase() === username.toLowerCase()));
        if (!id || !isOwn) {
            showToast('สงวนสิทธิ์เฉพาะแอดมิน 🔒', 'คุณไม่มีสิทธิ์เพิ่มผู้ใช้งานหรือแก้ไขข้อมูลของผู้อื่น', 'error');
            return;
        }

        // Lock critical system fields so regular users cannot elevate privileges
        const existing = ALL_SYSTEM_USERS.find(u => u.id === id);
        if (existing) {
            username = existing.username;
            roleName = existing.roleName || existing.position;
            dept = existing.dept;
            category = existing.category;
            role = existing.role;
            dutyDays = existing.dutyDays;
        }
    }

    if (!username) {
        showToast('กรุณากรอก Username', 'Username ต้องไม่เว้นว่าง', 'warning');
        return;
    }
    if (!name) {
        showToast('กรุณากรอกชื่อ-สกุล', 'ชื่อเจ้าหน้าที่ต้องไม่เว้นว่าง', 'warning');
        return;
    }
    if (!roleName) {
        showToast('กรุณากรอกตำแหน่ง', 'โปรดระบุตำแหน่งราชการหรือบทบาท', 'warning');
        return;
    }

    // Check duplicate username with other users
    const duplicate = ALL_SYSTEM_USERS.find(u => u.username.toLowerCase() === username && u.id !== id);
    if (duplicate) {
        showToast('Username ซ้ำ', `Username "${username}" ถูกใช้งานโดย ${duplicate.name} แล้ว`, 'error');
        return;
    }

    if (id) {
        // Edit existing
        const idx = ALL_SYSTEM_USERS.findIndex(u => u.id === id);
        if (idx !== -1) {
            ALL_SYSTEM_USERS[idx] = {
                ...ALL_SYSTEM_USERS[idx],
                username,
                name,
                position: roleName,
                roleName,
                dept,
                category,
                role,
                gender,
                phone,
                dutyDays: dutyDays || ALL_SYSTEM_USERS[idx].dutyDays,
                avatar
            };

            if (password) {
                savePasswordForUser(username, password);
            }

            // Sync with current logged-in user if editing own profile
            if (appState.currentUser && (appState.currentUser.id === id || (appState.currentUser.username && appState.currentUser.username.toLowerCase() === username.toLowerCase()))) {
                const updatedUser = { ...ALL_SYSTEM_USERS[idx] };
                setLoggedInUserSession(updatedUser);
                updateAuthUI();
            }

            showToast('บันทึกข้อมูลเรียบร้อย 🎉', `อัปเดตข้อมูลของ ${name} สำเร็จแล้ว`, 'success');
        }
    } else {
        if (!isAdmin) {
            showToast('สงวนสิทธิ์เฉพาะแอดมิน 🔒', 'การเพิ่มบัญชีผู้ใช้งานใหม่ สงวนสิทธิ์เฉพาะผู้ดูแลระบบเท่านั้น', 'error');
            return;
        }

        // Add new user
        const newId = 'user_' + Date.now();
        const newUser = {
            id: newId,
            username,
            defaultPass: password || '1234',
            name,
            position: roleName,
            roleName,
            dept,
            category,
            role,
            gender,
            phone,
            dutyDays: dutyDays || 'ตามคำสั่งมอบหมาย',
            avatar,
            badge: category === 'night' ? 'bg-slate-900 text-white' : 'bg-emerald-100 text-emerald-800'
        };

        if (password) {
            savePasswordForUser(username, password);
        }

        ALL_SYSTEM_USERS.push(newUser);
        showToast('เพิ่มผู้ใช้งานสำเร็จ 🎉', `เพิ่ม ${name} (${username}) เข้าสู่ระบบแล้ว`, 'success');
    }

    saveSystemUsers(ALL_SYSTEM_USERS);
    closeUserEditModal();

    // Re-render related UI components
    renderSettingsUserList();
    renderDirectoryUserList(appState.currentCategory || 'all', '');
    populateSelectOptions();
    renderDashboard();
    renderCalendar();
}

function handleDeleteUser() {
    if (!isCurrentUserAdmin()) {
        showToast('สงวนสิทธิ์เฉพาะแอดมิน 🔒', 'การลบบัญชีผู้ใช้งาน สงวนสิทธิ์เฉพาะผู้ดูแลระบบ (Admin) เท่านั้น', 'error');
        return;
    }

    const id = document.getElementById('user-form-id').value.trim();
    if (!id) return;

    const user = ALL_SYSTEM_USERS.find(u => u.id === id);
    if (!user) return;

    if (user.id === 'admin' || user.id === 'exec') {
        showToast('ไม่สามารถลบได้', 'ไม่สามารถลบบัญชีผู้ดูแลระบบหลักได้', 'error');
        return;
    }

    if (!confirm(`ต้องการลบผู้ใช้งาน "${user.name}" (@${user.username}) ออกจากระบบใช่หรือไม่?`)) {
        return;
    }

    ALL_SYSTEM_USERS = ALL_SYSTEM_USERS.filter(u => u.id !== id);
    saveSystemUsers(ALL_SYSTEM_USERS);
    closeUserEditModal();

    if (appState.currentUser && (appState.currentUser.id === id || (appState.currentUser.username && appState.currentUser.username.toLowerCase() === user.username.toLowerCase()))) {
        logoutUser();
    }

    renderSettingsUserList();
    renderDirectoryUserList(appState.currentCategory || 'all', '');
    populateSelectOptions();
    renderDashboard();
    renderCalendar();

    showToast('ลบผู้ใช้งานเรียบร้อย', `ลบบัญชี ${user.name} ออกจากระบบแล้ว`, 'info');
}

function resetSystemUsersToDefault() {
    if (!isCurrentUserAdmin()) {
        showToast('สงวนสิทธิ์เฉพาะแอดมิน 🔒', 'การคืนค่ารายชื่อเริ่มต้น 30 ท่าน สงวนสิทธิ์เฉพาะผู้ดูแลระบบ (Admin) เท่านั้น', 'error');
        return;
    }

    if (!confirm('ต้องการคืนค่ารายชื่อบุคลากรทั้งหมด 30 ท่านกลับเป็นค่าเริ่มต้นตามคำสั่งราชการเดิมใช่หรือไม่? (ข้อมูลที่แก้ไขหรือเพิ่มใหม่จะถูกรีเซ็ต)')) {
        return;
    }

    ALL_SYSTEM_USERS = JSON.parse(JSON.stringify(INITIAL_SYSTEM_USERS));
    saveSystemUsers(ALL_SYSTEM_USERS);

    if (appState.currentUser) {
        const found = ALL_SYSTEM_USERS.find(u => u.id === appState.currentUser.id || (u.username && u.username.toLowerCase() === appState.currentUser.username.toLowerCase()));
        if (found) {
            setLoggedInUserSession(found);
            updateAuthUI();
        } else {
            setLoggedInUserSession(null);
            updateAuthUI();
        }
    }

    renderSettingsUserList();
    renderDirectoryUserList(appState.currentCategory || 'all', '');
    populateSelectOptions();
    renderDashboard();
    renderCalendar();

    showToast('คืนค่าเริ่มต้น 30 ท่านเรียบร้อย', 'ข้อมูลรายชื่อบุคลากรถูกรีเซ็ตกลับเป็นค่าเริ่มต้นแล้ว', 'success');
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
    // 0. ซิงค์รายชื่อบุคลากรและเซสชันผู้ใช้งานล่าสุดจาก LocalStorage (คงอยู่ตลอดแม้รีเฟรช F5 หรือปิดแท็บ)
    ALL_SYSTEM_USERS = getSavedSystemUsers();
    appState.currentUser = getSavedLoggedInUser();

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
    renderSettingsUserList();
    renderPrintDocument();
    renderAttachedPdfList();
    renderSwapList();
    initSignaturePad();
    initLineChatDefaultMessages();
    initCheckinDatePicker();
    initReportTab();
    renderAttendanceReport();
    updateDateBadges();

    // 4. แสดงผลข้อมูลผู้ใช้งานปัจจุบัน
    updateAuthUI();

    // 5. บังคับเปิดหน้าแรกที่ "หน้า Dashboard" เสมอ (หรือตาม URL hash ถ้ามี)
    const initialTab = (window.location.hash && window.location.hash.length > 1) 
        ? window.location.hash.replace('#', '') 
        : 'dashboard';
    switchTab(document.getElementById(`tab-${initialTab}`) ? initialTab : 'dashboard');

    // 6. นาฬิกา Real-time และระบบตรวจจับการข้ามวันอัตโนมัติ (Midnight Rollover)
    let lastRolloverCheckDay = getRealTodayDay();

    function checkMidnightRollover() {
        const realDay = getRealTodayDay();
        if (realDay !== lastRolloverCheckDay) {
            lastRolloverCheckDay = realDay;
            if (appState.isRealtimeMode) {
                appState.currentSystemDay = realDay;
                initCheckinDatePicker();
                renderDashboard();
                renderCalendar();
                renderCheckinTab();
                updateDateBadges();
                showToast('🔔 วันใหม่เริ่มต้นแล้ว', `ระบบอัปเดตตารางเวรเป็น ${getThaiDateLabel(realDay)} อัตโนมัติแล้ว`, 'info');
            }
        }
    }

    const updateClock = () => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        const clockElements = document.querySelectorAll('.live-time-display, #live-time-display, #dash-clock-time, #header-live-time');
        clockElements.forEach(el => {
            if (el.id === 'dash-clock-time') {
                el.innerHTML = `⏰ ${timeStr} น.`;
            } else {
                el.textContent = `${timeStr} น.`;
            }
        });

        const headerDate = document.getElementById('header-live-date');
        if (headerDate) {
            headerDate.textContent = getThaiDateLabel(now.getDate());
        }

        checkMidnightRollover();
    };

    updateClock();
    setInterval(updateClock, 1000);
};
