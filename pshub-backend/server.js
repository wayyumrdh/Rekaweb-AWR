const express = require('express');
const cors = require('cors');
const db = require('./db.js');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const moment = require('moment');
const jwt = require('jsonwebtoken');

// 💡 Kunci Rahasia JWT Server (Membaca Environment Variables Railway, Fallback ke string default)
const JWT_SECRET = process.env.JWT_SECRET || "ADA_ADA_JI_ITU";

// Import Models
const User = require('./models/User');
const Unit = require('./models/Unit');
const Booking = require('./models/Booking');
const RoomReservation = require('./models/RoomReservation');
const ReservationSnack = require('./models/ReservationSnack'); 
const Menu = require('./models/Menu');

const app = express();

// 💡 PENGATURAN CORS: Sinkron penuh dengan domain produksi Vercel dan lokal laptop ThinkPad kamu
app.use(cors({
    origin: [
        'http://localhost:5173', 
        'http://127.0.0.1:5173', 
        'https://rekaweb-awr.vercel.app'
    ], 
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// ====================================================================
// 🔒 MIDDLEWARE VERIFIKASI KEAMANAN TOKEN JWT
// ====================================================================
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(403).json({ message: "Akses ditolak, token tidak ditemukan!" });
    }

    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified; 
        next(); 
    } catch (err) {
        return res.status(401).json({ message: "Token tidak valid atau sudah kedaluwarsa!" });
    }
};

// ====================================================================
// 💡 ASOSIASI RELASI DATABASE (ORM SEQUELIZE)
// ====================================================================
Booking.belongsTo(Unit, { foreignKey: 'unitId' });
Unit.hasMany(Booking, { foreignKey: 'unitId' });

RoomReservation.belongsTo(Unit, { foreignKey: 'unitId' });
Unit.hasMany(RoomReservation, { foreignKey: 'unitId' });

ReservationSnack.belongsTo(RoomReservation, { foreignKey: 'reservationId' });
RoomReservation.hasMany(ReservationSnack, { foreignKey: 'reservationId' });


// ====================================================================
// 📝 ROUTE REGISTRASI AKUN
// ====================================================================
app.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: "Semua data wajib diisi!" });
        }

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: "Email sudah terdaftar!" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            role: 'customer' 
        });

        res.status(201).json({ 
            message: "Registrasi akun PSHUB berhasil!",
            user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
        });

    } catch (err) {
        console.error("🔥 Error saat registrasi:", err);
        res.status(500).json({ error: err.message });
    }
});


// ====================================================================
// 🔄 ROUTE LOGIN
// ====================================================================
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(404).json({ error: "Email tidak ditemukan!" });
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: "Password salah!" });
        
        const token = jwt.sign(
            { id: user.id, name: user.name, role: user.role || 'customer' },
            JWT_SECRET,
            { expiresIn: '1d' }
        );
        
        res.json({ 
            token: token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role || 'customer' } 
        });
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});


// ====================================================================
// ⏱️ FIX AUTO RELEASE: AUTOMATION PENGEMBALIAN UNIT (AGRESIF 3 DETIK)
// ====================================================================
const autoReleaseUnits = async () => {
    try {
        // Paksa perbandingan waktu menggunakan format ISO string lokal yang stabil
        const sekarangLokal = moment().format('YYYY-MM-DD HH:mm:ss');

        // 1. Bersihkan Rental Reguler (Mengecek status active maupun pending/booked yang hangus)
        const expiredBookings = await Booking.findAll({
            where: { 
                status: { [Op.in]: ['active', 'pending', 'booked'] }, 
                waktu_selesai: { [Op.lt]: sekarangLokal } 
            }
        });
        if (expiredBookings.length > 0) {
            for (const booking of expiredBookings) {
                const unitId = booking.unitId;
                const statusLama = booking.status;
                await booking.update({ status: 'finished' });
                
                // 🎯 FIX: Kembalikan stok ke gudang jika status lamanya MEMANG sudah disetujui (active)
                if (unitId && statusLama === 'active') {
                    await Unit.increment('stok_tersedia', { by: 1, where: { id: unitId } });
                    console.log(`✅ [Auto-Release] Unit Rental Reguler ID ${unitId} otomatis dikembalikan.`);
                }
            }
        }

        // 2. Bersihkan Reservasi Kamar Privat
        const expiredReservations = await RoomReservation.findAll({
            where: { 
                status: { [Op.in]: ['active', 'pending', 'booked'] }, 
                waktu_selesai: { [Op.lt]: sekarangLokal } 
            }
        });
        if (expiredReservations.length > 0) {
            for (const resv of expiredReservations) {
                const unitId = resv.unitId;
                const statusLama = resv.status;
                await resv.update({ status: 'finished' });
                
                if (unitId && statusLama === 'active') {
                    await Unit.increment('stok_tersedia', { by: 1, where: { id: unitId } });
                    console.log(`✅ [Auto-Release] Unit Kamar Privat ID ${unitId} otomatis dikembalikan.`);
                }
            }
        }
    } catch (err) {
        console.error("🔥 Gagal menjalankan siklus Auto-Release:", err);
    }
};
// Diubah menjadi 3 detik agar auto-release merespon kilat hitungan menit simulasi skripsi kamu
setInterval(autoReleaseUnits, 3000);


// ====================================================================
// 🎮 API TRANSAKSI UTAMA (TERPROTEKSI TOKEN)
// ====================================================================

app.post('/api/booking', verifyToken, async (req, res) => {
    try {
        const { userId, typePs, jenis, durasi, namaLengkap, jaminan, alamat, kontak, waktuMulaiKustom } = req.body;

        let jenisFix = jenis || 'Standar';
        if (jenisFix.toLowerCase() === 'standard') jenisFix = 'Standar';
        else if (jenisFix.toLowerCase() === 'vip') jenisFix = 'VIP';

        if (!typePs) return res.status(400).json({ message: "Parameter 'typePs' kosong!" });

        let cleanName = typePs.toUpperCase().replace("PLAYSTATION", "PS").replace("AREA", "").trim();
        const psNumber = cleanName.match(/\d+/) ? cleanName.match(/\d+/)[0] : ""; 
        const keywordPakeSpasi = `PS ${psNumber}`;  
        const keywordTanpaSpasi = `PS${psNumber}`;  

        const unit = await Unit.findOne({ 
            where: { 
                [Op.or]: [
                    { nama_unit: { [Op.like]: `%${keywordPakeSpasi}%` } },
                    { nama_unit: { [Op.like]: `%${keywordTanpaSpasi}%` } }
                ],
                jenis: jenisFix, stok_tersedia: { [Op.gt]: 0 }
            } 
        });

        if (!unit) return res.status(400).json({ message: `Unit ${typePs} penuh atau tidak tersedia!` });

        let waktuMulai = moment().format('YYYY-MM-DD HH:mm:ss');
        if (waktuMulaiKustom) waktuMulai = moment(waktuMulaiKustom).format('YYYY-MM-DD HH:mm:ss');

        // 🎯 FIX 1 JAM = 1 MENIT SIMULASI:
        // Jika dari frontend mengirimkan data menit murni (contoh: 60, 120), kita konversi dulu menjadi nilai unit jam (1, 2)
        let inputDurasi = parseInt(durasi, 10) || 1;
        if (inputDurasi >= 60) {
            inputDurasi = Math.round(inputDurasi / 60);
        }
        const durasiSimulasi = Math.max(1, inputDurasi); 
        const waktuSelesai = moment(waktuMulai).add(durasiSimulasi, 'minutes').format('YYYY-MM-DD HH:mm:ss'); 

        const newBooking = await Booking.create({
            userId, unitId: unit.id, nama_penyewa: namaLengkap,
            jaminan: jaminan || "KTP", alamat_pengiriman: alamat || "Di Tempat",
            kontak_whatsapp: kontak || "-", waktu_mulai: waktuMulai, waktu_selesai: waktuSelesai,
            status: 'pending', isReservation: (jenis || alamat === "PSHUB Room")
        });

        res.status(201).json(newBooking);
    } catch (err) { res.status(500).json({ error: err.message }); }
});


app.post('/api/room-reservation', verifyToken, async (req, res) => {
    try {
        const { userId, typePs, jenis, durasi, namaLengkap, jumlah_orang, waktuMulaiKustom, cartData } = req.body;

        let jenisFix = jenis || 'Standar';
        if (jenisFix.toLowerCase() === 'standard') jenisFix = 'Standar';
        else if (jenisFix.toLowerCase() === 'vip') jenisFix = 'VIP';

        let cleanName = typePs ? typePs.toUpperCase().trim() : "";
        let psNumber = "5"; 
        if (cleanName.includes("PS3") || cleanName.includes("PS 3") || cleanName.includes("PLAYSTATION 3") || cleanName.includes("PLAYSTATION3")) {
            psNumber = "3";
        } else if (cleanName.includes("PS4") || cleanName.includes("PS 4") || cleanName.includes("PLAYSTATION 4") || cleanName.includes("PLAYSTATION4")) {
            psNumber = "4";
        } else if (cleanName.includes("PS2") || cleanName.includes("PS 2") || cleanName.includes("PLAYSTATION 2") || cleanName.includes("PLAYSTATION2")) {
            psNumber = "2";
        } else {
            const matchDigits = cleanName.match(/\d+/);
            if (matchDigits) psNumber = matchDigits[0];
        }
        
        const keywordPakeSpasi = `PS ${psNumber}`;
        const keywordTanpaSpasi = `PS${psNumber}`;

        const unit = await Unit.findOne({ 
            where: { 
                [Op.or]: [
                    { nama_unit: { [Op.like]: `%${keywordPakeSpasi}%` } },
                    { nama_unit: { [Op.like]: `%${keywordTanpaSpasi}%` } }
                ],
                jenis: jenisFix, 
                stok_tersedia: { [Op.gt]: 0 }
            } 
        });

        if (!unit) {
            return res.status(400).json({ 
                message: `Kamar bilik ${keywordPakeSpasi} tipe ${jenisFix} sedang penuh atau tidak tersedia!` 
            });
        }

        let waktuMulai = moment().format('YYYY-MM-DD HH:mm:ss');
        if (waktuMulaiKustom) waktuMulai = moment(waktuMulaiKustom).format('YYYY-MM-DD HH:mm:ss');
        
        // 🎯 FIX 1 JAM = 1 MENIT SIMULASI ROOM RESERVATION:
        let inputDurasiKamar = parseInt(durasi, 10) || 1;
        if (inputDurasiKamar >= 60) {
            inputDurasiKamar = Math.round(inputDurasiKamar / 60);
        }
        const durasiSimulasiKamar = Math.max(1, inputDurasiKamar);
        const waktuSelesai = moment(waktuMulai).add(durasiSimulasiKamar, 'minutes').format('YYYY-MM-DD HH:mm:ss');

        const newReservation = await RoomReservation.create({
            userId: parseInt(userId, 10),
            unitId: parseInt(unit.id, 10), 
            nama_player: namaLengkap,
            jenis: jenisFix, 
            text_alamat: "PSHUB Room",
            jumlah_orang: parseInt(jumlah_orang, 10) || 1,
            waktu_mulai: waktuMulai,
            waktu_selesai: waktuSelesai,
            status: 'pending' 
        });

        if (cartData && Object.keys(cartData).length > 0) {
            const snackRecords = [];
            for (const itemId of Object.keys(cartData)) {
                const itemQty = parseInt(cartData[itemId], 10);
                const menuDetail = await Menu.findByPk(itemId); 
                
                if (menuDetail && itemQty > 0) {
                    snackRecords.push({
                        reservationId: newReservation.id, 
                        snackId: itemId,
                        nama_snack: menuDetail.name, 
                        harga: menuDetail.price * itemQty, 
                        kuantitas: itemQty
                    });
                }
            }
            if (snackRecords.length > 0) await ReservationSnack.bulkCreate(snackRecords);
        }

        res.status(201).json(newReservation);
    } catch (err) {
        console.error("🔥 Gagal mencatat reservasi:", err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/units', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: "Akses Ditolak" });
        const { nama_unit, jenis, stok_tersedia, harga_per_jam } = req.body;
        
        const newUnit = await Unit.create({ 
            nama_unit, jenis, stok_tersedia, harga_per_jam, status: 'active' 
        });
        res.status(201).json({ message: "Unit berhasil ditambahkan", unit: newUnit });
    } catch (err) { res.status(500).json({ error: err.message }); }
});


// ====================================================================
// 📊 ENDPOINT GET MONITORING & RINGKASAN DATA (UNTUK DASHBOARD)
// ====================================================================

app.get('/api/my-booking/:userId', verifyToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const [regulerRentals, privateRoomReservations] = await Promise.all([
            Booking.findAll({
                where: { userId, status: { [Op.in]: ['active', 'pending', 'booked'] } },
                include: [{ model: Unit, attributes: ['nama_unit', 'jenis'] }]
            }),
            RoomReservation.findAll({
                where: { userId, status: { [Op.in]: ['active', 'pending', 'booked'] } },
                include: [{ model: Unit, attributes: ['nama_unit', 'jenis'] }]
            })
        ]);
        res.status(200).json([...regulerRentals, ...privateRoomReservations]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/units', verifyToken, async (req, res) => {
    try { 
        res.json(await Unit.findAll()); 
    } catch (err) { res.status(500).json({ error: err.message }); }
});


app.get('/api/active-rentals', verifyToken, async (req, res) => {
    try {
        const [regulerRentals, privateRoomReservations] = await Promise.all([
            Booking.findAll({
                where: { status: { [Op.in]: ['active', 'pending', 'booked'] } }, 
                include: [{ model: Unit, attributes: ['nama_unit', 'jenis'] }]
            }),
            RoomReservation.findAll({
                where: { status: { [Op.in]: ['active', 'pending', 'booked'] } }, 
                include: [{ model: Unit, attributes: ['nama_unit', 'jenis'] }]
            })
        ]);

        const formattedRooms = privateRoomReservations.map(room => {
            const data = room.toJSON();
            return {
                id: `ROOM-${data.id}`,
                nama_unit: data.Unit?.nama_unit || "PS Room",
                waktu_mulai: data.waktu_mulai,
                waktu_selesai: data.waktu_selesai,
                status: data.status,
                nama_player: data.nama_player,
                jenis: data.jenis,
                unitId: data.unitId,
                Unit: data.Unit
            };
        });

        const formattedReguler = regulerRentals.map(reg => {
            const data = reg.toJSON();
            return {
                id: `REG-${data.id}`,
                nama_unit: data.Unit?.nama_unit || data.typePs || "PS Reguler",
                waktu_mulai: data.waktu_mulai,
                waktu_selesai: data.waktu_selesai,
                status: data.status,
                namaLengkap: data.nama_penyewa,
                jenis: data.Unit?.jenis || "Standar",
                unitId: data.unitId,
                Unit: data.Unit
            };
        });

        const activeList = [...formattedReguler, ...formattedRooms];
        res.json(activeList);
    } catch (err) {
        console.error("🔥 Gagal memetakan data aktif sewa:", err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/menus', verifyToken, async (req, res) => {
    try {
        const snacks = await Menu.findAll({ where: { category: 'snack' } });
        const drinks = await Menu.findAll({ where: { category: 'drink' } });
        res.json({ snacks, drinks });
    } catch (err) { res.status(500).json({ error: err.message }); }
});


// ====================================================================
// 👑 ROUTE KHUSUS GABUNGAN RINGKASAN PANEL UTAMA OPERATOR ADMIN
// ====================================================================
app.get('/api/admin/dashboard-summary', verifyToken, async (req, res) => {
  try {
    const unreadCount = await Booking.count({ where: { status: 'pending' } }); 
    const availableUnits = await Unit.sum('stok_tersedia') || 0; 
    const roomsActive = await RoomReservation.count({ where: { status: 'active' } });
    const roomsTotal = 22; 

    res.json({
      unreadCount,
      availableUnits,
      roomsActive,
      roomsTotal
    });
  } catch (error) {
    console.error("🔥 Error rekap admin:", error);
    res.status(500).json({ message: "Gagal memproses rekap data basis data admin" });
  }
});

app.get('/api/admin/pending-reservations', verifyToken, async (req, res) => {
    try {
        const [reguler, privateRoom] = await Promise.all([
            Booking.findAll({
                where: { status: 'pending' },
                include: [{ model: Unit, attributes: ['nama_unit'] }],
                order: [['createdAt', 'DESC']]
            }),
            RoomReservation.findAll({
                where: { status: 'pending' },
                include: [{ model: Unit, attributes: ['nama_unit'] }],
                order: [['createdAt', 'DESC']]
            })
        ]);
        
        const combined = [
            ...reguler.map(b => ({ ...b.toJSON(), type: 'reguler' })),
            ...privateRoom.map(r => ({ ...r.toJSON(), type: 'room' }))
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json(combined);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 🎯 FIX UTAMA LOGIKA APPROVAL & MANAJEMEN STOK DENAH FRONTEND:
app.put('/api/admin/reservation/:type/:id', verifyToken, async (req, res) => {
    try {
        const { type, id } = req.params;
        const { action } = req.body; 
        const newStatus = action === 'accept' ? 'active' : 'rejected';

        if (type === 'reguler') {
            const booking = await Booking.findByPk(id);
            if (!booking) return res.status(404).json({ message: "Data tidak ditemukan" });
            
            // Stok fisik baru dipotong jika admin menekan 'accept' dan statusnya belum active
            if (action === 'accept' && booking.status !== 'active') {
                const unitTerkait = await Unit.findByPk(booking.unitId);
                if (!unitTerkait || unitTerkait.stok_tersedia <= 0) {
                    return res.status(400).json({ message: "Gagal menyetujui, unit sudah terpakai penuh!" });
                }
                await unitTerkait.decrement('stok_tersedia', { by: 1 });
            }
            
            await booking.update({ status: newStatus });
            
        } else if (type === 'room') {
            const room = await RoomReservation.findByPk(id);
            if (!room) return res.status(404).json({ message: "Data tidak ditemukan" });
            
            if (action === 'accept' && room.status !== 'active') {
                const unitTerkait = await Unit.findByPk(room.unitId);
                if (!unitTerkait || unitTerkait.stok_tersedia <= 0) {
                    return res.status(400).json({ message: "Gagal menyetujui, unit di gudang sudah penuh terpakai!" });
                }
                await unitTerkait.decrement('stok_tersedia', { by: 1 });
            }
            
            await room.update({ status: newStatus });
        }

        res.json({ message: `Reservasi berhasil di-${action === 'accept' ? 'terima (Bilik Aktif)' : 'tolak'}` });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/admin/units/:id/status', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: "Akses Ditolak" });
        const unit = await Unit.findByPk(req.params.id);
        if (!unit) return res.status(404).json({ message: "Unit tidak ditemukan" });
        
        const newStatus = unit.status === 'active' ? 'maintenance' : 'active';
        await unit.update({ status: newStatus });
        
        res.json({ message: `Unit sekarang berstatus ${newStatus}` });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/units/:id', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: "Akses Ditolak" });
        const unit = await Unit.findByPk(req.params.id);
        if (!unit) return res.status(404).json({ message: "Unit tidak ditemukan" });
        
        await unit.destroy();
        res.json({ message: "Unit berhasil dihapus dari sistem" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ====================================================================
// 👑 ROUTE PANEL ADMIN - MANAJEMEN DATA USER PSHUB
// ====================================================================

app.get('/api/admin/users', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Akses ditolak, Anda bukan administrator!" });
        }

        const users = await User.findAll({
            attributes: ['id', 'name', 'email', 'role', 'createdAt'], 
            order: [['createdAt', 'DESC']] 
        });

        res.json(users);
    } catch (err) {
        console.error("🔥 Gagal memuat daftar pengguna:", err);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/admin/users/:id/role', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Akses ditolak!" });
        }

        const { role } = req.body;
        const targetUser = await User.findByPk(req.params.id);

        if (!targetUser) {
            return res.status(404).json({ message: "Data pengguna tidak ditemukan!" });
        }

        await targetUser.update({ role: role.toLowerCase() });
        res.json({ message: `Tingkatan akses ${targetUser.name} berhasil diubah menjadi ${role.toUpperCase()}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/users/:id', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Akses ditolak!" });
        }

        const targetId = req.params.id;

        if (parseInt(targetId, 10) === parseInt(req.user.id, 10)) {
            return res.status(400).json({ message: "Anda tidak bisa menghapus akun Admin Anda sendiri!" });
        }

        console.log(`[PSHUB-CHAIN-DELETE] Memulai pembersihan berantai untuk User ID: ${targetId}`);

        await db.query(`
            DELETE FROM reservation_snacks 
            WHERE reservationId IN (SELECT id FROM room_reservations WHERE userId = ?)
        `, {
            replacements: [targetId],
            type: db.QueryTypes.DELETE
        }).catch(err => console.log("Info: reservation_snacks lewati ->", err.message));

        await db.query('DELETE FROM room_reservations WHERE userId = ?', {
            replacements: [targetId],
            type: db.QueryTypes.DELETE
        }).catch(err => console.log("Info: room_reservations lewati ->", err.message));

        await db.query('DELETE FROM booking WHERE userId = ?', {
            replacements: [targetId],
            type: db.QueryTypes.DELETE
        }).catch(err => console.log("Info: tabel 'booking' lewati ->", err.message));

        await db.query('DELETE FROM bookings WHERE userId = ?', {
            replacements: [targetId],
            type: db.QueryTypes.DELETE
        }).catch(err => console.log("Info: tabel 'bookings' lewati ->", err.message));

        await db.query('DELETE FROM user WHERE id = ?', {
            replacements: [targetId],
            type: db.QueryTypes.DELETE
        });

        console.log(`[PSHUB-CHAIN-DELETE] Sukses menghapus akun user lama ID: ${targetId}`);
        res.json({ message: "Akun pengguna berhasil dihapus bersih." });

    } catch (err) {
        console.error("🔥 Gagal total mengeksekusi penghapusan berantai:", err);
        res.status(500).json({ error: "Gagal menghapus user dari database MySQL." });
    }
});

app.get('/api/admin/users/:userId/history', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Akses ditolak, Anda bukan admin!" });
        }

        const targetUserId = parseInt(req.params.userId, 10);

        const [regulerRentals, privateRoomReservations] = await Promise.all([
            Booking.findAll({
                where: { userId: targetUserId },
                include: [{ model: Unit, attributes: ['nama_unit', 'jenis'] }],
                order: [['createdAt', 'DESC']]
            }),
            RoomReservation.findAll({
                where: { userId: targetUserId },
                include: [{ model: Unit, attributes: ['nama_unit', 'jenis'] }],
                order: [['createdAt', 'DESC']]
            })
        ]);

        const formattedRooms = privateRoomReservations.map(room => {
            const data = room.toJSON();
            return {
                id: `ROOM-${data.id}`,
                nama_unit: data.Unit?.nama_unit || "PS Room",
                jenis: data.jenis || "Standar",
                waktu_mulai: data.waktu_mulai,
                waktu_selesai: data.waktu_selesai,
                status: data.status,
                createdAt: data.createdAt,
                type: 'room'
            };
        });

        const formattedReguler = regulerRentals.map(reg => {
            const data = reg.toJSON();
            return {
                id: `REG-${data.id}`,
                nama_unit: data.Unit?.nama_unit || data.typePs || "PS Reguler",
                jenis: data.jenis || "Standar",
                waktu_mulai: data.waktu_mulai,
                waktu_selesai: data.waktu_selesai,
                status: data.status,
                createdAt: data.createdAt,
                type: 'reguler'
            };
        });

        const combinedHistory = [...formattedReguler, ...formattedRooms].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        res.json(combinedHistory);
    } catch (err) {
        console.error("🔥 Gagal memuat berkas riwayat transaksional:", err);
        res.status(500).json({ error: err.message });
    }
});

// 💡 Menggunakan port dinamis bawaan cloud Railway
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT} dengan Keamanan JWT Simulasi Kilat Terintegrasi`));
