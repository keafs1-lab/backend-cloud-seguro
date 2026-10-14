const { Sequelize } = require('sequelize');

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl || ['null', 'undefined'].includes(databaseUrl.toLowerCase())) {
  throw new Error('DATABASE_URL não foi configurada. Defina a variável de ambiente antes de iniciar a API.');
}

let parsedDatabaseUrl;
try {
  parsedDatabaseUrl = new URL(databaseUrl);
} catch {
  throw new Error('DATABASE_URL inválida. Use a URL PostgreSQL completa fornecida pelo Neon.');
}

if (!['postgres:', 'postgresql:'].includes(parsedDatabaseUrl.protocol) || !parsedDatabaseUrl.hostname || !parsedDatabaseUrl.pathname || parsedDatabaseUrl.pathname === '/') {
  throw new Error('DATABASE_URL inválida. Ela deve incluir o protocolo PostgreSQL, o host e o nome do banco.');
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
