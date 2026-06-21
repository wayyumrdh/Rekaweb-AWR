const { DataTypes } = require('sequelize');
const db = require('../db.js'); // Pastikan path ke file database kamu benar

const Booking = db.define('booking', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    unitId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    nama_penyewa: {
        type: DataTypes.STRING,
        allowNull: false
    },
    jaminan: {
        type: DataTypes.STRING,
        allowNull: false
    },
    alamat_pengiriman: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    kontak_whatsapp: {
        type: DataTypes.STRING,
        allowNull: false
    },
    waktu_mulai: {
        type: DataTypes.DATE,
        allowNull: false
    },
    waktu_selesai: {
        type: DataTypes.DATE,
        allowNull: false
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'active', // 'active' atau 'finished'
        allowNull: false
    }
}, {
    freezeTableName: true // Agar Sequelize tidak otomatis mengubah nama tabel menjadi 'bookings' (jamak)
});

module.exports = Booking;