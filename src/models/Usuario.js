const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../database');

const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: { notEmpty: true, len: [2, 100] }
  },
  email: {
    type: DataTypes.STRING(254),
    allowNull: false,
    unique: true,
    validate: { isEmail: true, notEmpty: true }
  },
  senha: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  role: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'user',
    validate: { isIn: [['user', 'admin']] }
  }
}, {
  hooks: {
    // O hook evita que senhas novas ou alteradas sejam salvas em texto puro.
    async beforeCreate(usuario) {
      usuario.senha = await bcrypt.hash(usuario.senha, 12);
    },
    async beforeUpdate(usuario) {
      if (usuario.changed('senha')) {
        usuario.senha = await bcrypt.hash(usuario.senha, 12);
      }
    }
  }
});

module.exports = Usuario;
