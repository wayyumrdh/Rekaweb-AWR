const { DataTypes } = require('sequelize');
const db = require('../db.js'); 
const Unit = require('./Unit.js');
const User = require('./User.js');

const RoomReservation = db.define('room_reservations', {
    id: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
    },
    userId: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        field: 'userId' // 🎯 PAKSA: Menyesuaikan dengan nama kolom persis di phpMyAdmin
    },
    unitId: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        field: 'unitId' // 🎯 PAKSA: Menyesuaikan dengan nama kolom persis di phpMyAdmin
    },
    nama_player: { 
        type: DataTypes.STRING, 
        allowNull: false 
    },
    jenis: { 
        type: DataTypes.STRING, 
        allowNull: true,
        defaultValue: 'Standar',
        field: 'jenis' // 🎯 Kunci kolom jenis baru kamu
    },
    jumlah_orang: { 
        type: DataTypes.INTEGER, 
        defaultValue: 1 
    },
    waktu_mulai: { 
        type: DataTypes.STRING(19), 
        allowNull: false 
    },
    waktu_selesai: { 
        type: DataTypes.STRING(19), 
        allowNull: false 
    },
    status: { 
        type: DataTypes.STRING, 
        defaultValue: 'pending' 
    }
}, {
    tableName: 'room_reservations',
    timestamps: true // Karena di screenshot kamu ada kolom createdAt & updatedAt
});

// Setup Relasi ORM (Gunakan foreignKey yang konsisten dengan field di atas)
RoomReservation.belongsTo(Unit, { foreignKey: 'unitId' });
RoomReservation.belongsTo(User, { foreignKey: 'userId' });

module.exports = RoomReservation;