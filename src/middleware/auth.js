const jwt = require('jsonwebtoken');

function autenticar(req, res, next) {
  const authorization = req.get('authorization');
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Autenticação necessária.' });
  }

  const token = authorization.slice('Bearer '.length).trim();
  if (!token) {
    return res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }

  try {
    req.usuarioAutenticado = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256']
    });
    return next();
  } catch {
    return res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
}

function exigirAdmin(req, res, next) {
  if (req.usuarioAutenticado?.role !== 'admin') {
    return res.status(403).json({ erro: 'Você não tem permissão para esta operação.' });
  }
  return next();
}

module.exports = { autenticar, exigirAdmin };
