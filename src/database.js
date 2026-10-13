const { Sequelize } = require('sequelize');

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL não foi configurada. Defina a variável de ambiente antes de iniciar a API.');
}

const sslEnabled = (process.env.DATABASE_SSL ?? 'true').toLowerCase() === 'true';
const rejectUnauthorized = (process.env.DATABASE_SSL_REJECT_UNAUTHORIZED ?? 'true').toLowerCase() === 'true';

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  dialectModule: require('pg'),
  logging: false,
  dialectOptions: sslEnabled
    ? { ssl: { require: true, rejectUnauthorized } }
    : {}
});

module.exports = sequelize;
