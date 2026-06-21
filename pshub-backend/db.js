const { Sequelize } = require('sequelize');

const db = new Sequelize('pshub_db', 'root', '', {
    host: 'localhost',
    port: 3307, // Menggunakan port kustom 3307 (biasanya karena port 3306 bentrok)
    dialect: 'mysql',
    logging: false // Mematikan log query di terminal agar console tetap bersih
});

// 🌟 PERBAIKAN & PENGAMAN UTAMA: Siklus Sinkronisasi Otomatis
// Ini akan memaksa MySQL memperbarui/menambahkan kolom baru (seperti kolom 'jenis') secara otomatis
const connectDB = async () => {
    try {
        await db.authenticate();
        console.log('⚡ Database MySQL PSHUB Connected Successfully on Port 3307.');
        
        // { alter: true } berguna untuk mengubah struktur tabel secara aman tanpa menghapus data yang sudah ada
        await db.sync({ alter: true }); 
        console.log('🔄 All database models synchronized perfectly.');
    } catch (error) {
        console.error('❌ Gagal menghubungkan atau sinkronisasi database:', error);
    }
};

// Jalankan fungsi koneksi dan sinkronisasi
connectDB();

module.exports = db;