const { DataTypes } = require('sequelize');
const db = require('../db.js'); // Menggunakan path mundur satu tingkat yang sudah aman

const ReservationSnack = db.define('reservation_snack', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    reservationId: { type: DataTypes.INTEGER, allowNull: false },
    snackId: { type: DataTypes.STRING, allowNull: false },
    nama_snack: { type: DataTypes.STRING, allowNull: false },
    harga: { type: DataTypes.INTEGER, allowNull: false },
    kuantitas: { type: DataTypes.INTEGER, defaultValue: 1 }
}, {
    tableName: 'reservation_snacks',
    timestamps: true
});

module.exports = ReservationSnack;