const { Sequelize } = require('sequelize');

// 💡 Menggunakan variabel lingkungan dari Railway agar dinamis terhubung ke Aiven
const db = new Sequelize(
    process.env.DB_NAME || 'defaultdb',      // Mengambil DB_NAME Railway, fallback ke 'defaultdb'
    process.env.DB_USER || 'avnadmin',       // Mengambil DB_USER Railway, fallback ke 'avnadmin'
    process.env.DB_PASSWORD,                 // Mengambil DB_PASSWORD dari Railway
    {
        host: process.env.DB_HOST,           // Mengambil DB_HOST dari Railway
        port: process.env.DB_PORT || 15580,  // Mengambil DB_PORT Railway, fallback ke port Aiven 15580
        dialect: 'mysql',
        logging: false, // Mematikan log query di terminal agar console tetap bersih
        
        // 🔥 TAMBAHAN KHUSUS UNTUK AIVEN (Wajib menggunakan SSL cloud)
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    }
);

// 🌟 PERBAIKAN & PENGAMAN UTAMA: Siklus Sinkronisasi Otomatis
const connectDB = async () => {
    try {
        await db.authenticate();
        console.log('⚡ Database Cloud Aiven PSHUB Connected Successfully via Railway.');
        
        // { alter: true } berguna untuk mengubah struktur tabel secara aman tanpa menghapus data yang sudah ada
        await db.sync({ alter: true }); 
        console.log('🔄 All database models synchronized perfectly on cloud.');
    } catch (error) {
        console.error('❌ Gagal menghubungkan atau sinkronisasi database:', error);
    }
};

// Jalankan fungsi koneksi dan sinkronisasi
connectDB();

module.exports = db;
