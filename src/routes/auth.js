const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const Usuario = require('../models/Usuario');

const router = express.Router();

const loginSchema = z.object({
  email: z.string().trim().email().max(254).transform(value => value.toLowerCase()),
  senha: z.string().min(1).max(200)
}).strict();

router.post('/login', async (req, res, next) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: 'Informe um e-mail válido e uma senha.' });
  }

  try {
    const { email, senha } = parsed.data;
    const usuario = await Usuario.findOne({ where: { email } });

    // A mesma mensagem evita indicar se determinado e-mail está cadastrado.
    const senhaValida = usuario ? await bcrypt.compare(senha, usuario.senha) : false;
    if (!usuario || !senhaValida) {
      return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
    }

    const token = jwt.sign(
      { sub: String(usuario.id), role: usuario.role },
      process.env.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    return res.json({
      token,
      tipo: 'Bearer',
      expiraEm: process.env.JWT_EXPIRES_IN || '15m',
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role }
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
