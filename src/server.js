require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const sequelize = require('./database');
const usuariosRoutes = require('./routes/usuarios');
const authRoutes = require('./routes/auth');

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET === 'SUBSTITUA_POR_UM_SEGREDO_ALEATORIO_LONGO') {
  throw new Error('JWT_SECRET deve ser configurado com um segredo aleatório de pelo menos 32 caracteres.');
}

const app = express();
app.disable('x-powered-by');
app.use(helmet());

const origensPermitidas = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(origem => origem.trim())
  .filter(Boolean);

app.use(cors({
  origin(origem, callback) {
    // Requisições sem Origin (ex.: curl ou comunicação servidor-servidor) continuam possíveis.
    if (!origem || origensPermitidas.includes(origem)) return callback(null, true);
    return callback(new Error('Origem não permitida pela política CORS.'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));

app.use(express.json({ limit: '10kb', strict: true }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { erro: 'Muitas requisições. Tente novamente mais tarde.' }
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { erro: 'Muitas tentativas de login. Tente novamente mais tarde.' }
});

app.use(apiLimiter);
app.get('/', (req, res) => res.json({ message: 'API backend-cloud' }));
app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    return res.json({ status: 'ok' });
  } catch (error) {
    console.error('Health check: falha ao conectar ao banco.');
    return res.status(503).json({ status: 'unavailable' });
  }
});
app.use('/auth', authLimiter, authRoutes);
app.use('/usuarios', usuariosRoutes);

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'O corpo da requisição contém JSON inválido.' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ erro: 'O corpo da requisição excede o limite permitido.' });
  }
  if (err.message === 'Origem não permitida pela política CORS.') {
    return res.status(403).json({ erro: 'Origem não permitida.' });
  }
  console.error('Erro interno ao processar requisição:', err.name || 'Erro');
  return res.status(500).json({ erro: 'Erro interno do servidor.' });
});

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => console.log(`Servidor iniciado na porta ${port}`));
}

module.exports = app;
