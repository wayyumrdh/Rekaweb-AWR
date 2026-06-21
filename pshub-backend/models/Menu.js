const { DataTypes } = require('sequelize');
const db = require('../db.js');

const Menu = db.define('menu', {
    id: { type: DataTypes.STRING, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    price: { type: DataTypes.INTEGER, allowNull: false },
    category: { type: DataTypes.STRING, allowNull: false }
}, {
    tableName: 'menus',
    timestamps: true
});

module.exports = Menu;