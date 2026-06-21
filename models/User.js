const { DataTypes } = require('sequelize');
const db = require('../db.js'); // Pastikan path ini sesuai dengan file koneksi database kamu

const User = db.define('user', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // Mencegah email ganda
        validate: {
            isEmail: true // Memastikan format email benar
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.STRING,
        defaultValue: 'user' // Default sebagai customer biasa
    }
}, {
    // PENTING: Mencegah Sequelize mengubah nama tabel menjadi 'users'
    freezeTableName: true, 
    timestamps: true // Otomatis membuat kolom createdAt & updatedAt
});

module.exports = User;