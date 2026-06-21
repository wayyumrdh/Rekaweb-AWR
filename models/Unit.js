const { DataTypes } = require('sequelize');
const db = require('../db'); // Pastikan path ke db.js kamu benar

const Unit = db.define('unit', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nama_unit: {
        type: DataTypes.STRING,
        allowNull: false // Contoh: "PS 5", "PS 4"
    },
    jenis: {
        type: DataTypes.STRING, // Contoh: "VIP", "Reguler"
        allowNull: false
    },
    stok_tersedia: {
        type: DataTypes.INTEGER,
        defaultValue: 0 // Ini yang akan berkurang/bertambah otomatis
    },

    harga_jam: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    harga_hari: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },

    status: {
        type: DataTypes.STRING,
        defaultValue: 'active'
    }
}, {
    timestamps: false
});

module.exports = Unit;