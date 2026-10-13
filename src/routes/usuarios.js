const express = require('express');
const { z } = require('zod');
const Usuario = require('../models/Usuario');
const { autenticar, exigirAdmin } = require('../middleware/auth');

const router = express.Router();
const nomeSchema = z.string().trim().min(2).max(100);
const emailSchema = z.string().trim().email().max(254).transform(value => value.toLowerCase());
const senhaSchema = z.string().min(12, 'A senha deve ter pelo menos 12 caracteres.').max(200);
const cadastroSchema = z.object({ nome: nomeSchema, email: emailSchema, senha: senhaSchema }).strict();
const atualizacaoSchema = z.object({
  nome: nomeSchema.optional(),
  email: emailSchema.optional(),
  senha: senhaSchema.optional()
}).strict().refine(data => Object.keys(data).length > 0, 'Informe pelo menos um campo para atualizar.');
const idSchema = z.coerce.number().int().positive();
const camposPublicos = ['id', 'nome', 'email', 'role'];

function erroValidacao(res, mensagem = 'Dados inválidos. Verifique os campos enviados.') {
  return res.status(400).json({ erro: mensagem });
}

function lidarErroBanco(error, res, next) {
  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ erro: 'Não foi possível cadastrar ou atualizar com esses dados.' });
  }
  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({ erro: 'Dados inválidos. Verifique os campos enviados.' });
  }
  return next(error);
}

// Cadastro público: a função (role) sempre é definida pelo servidor como "user".
router.post('/', async (req, res, next) => {
  const parsed = cadastroSchema.safeParse(req.body);
  if (!parsed.success) return erroValidacao(res);

  try {
    const dados = parsed.data;
    const usuario = await Usuario.create({ ...dados, role: 'user' });
    return res.status(201).json({ id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role });
  } catch (error) {
    return lidarErroBanco(error, res, next);
  }
});

// Listagem de todos os usuários: somente administradores.
router.get('/', autenticar, exigirAdmin, async (req, res, next) => {
  try {
    const usuarios = await Usuario.findAll({ attributes: camposPublicos, order: [['id', 'ASC']] });
    return res.json(usuarios);
  } catch (error) {
    return next(error);
  }
});

// Um usuário comum só pode consultar o próprio registro.
router.get('/:id', autenticar, async (req, res, next) => {
  const parsedId = idSchema.safeParse(req.params.id);
  if (!parsedId.success) return erroValidacao(res, 'ID inválido.');

  const id = parsedId.data;
  const proprioRegistro = Number(req.usuarioAutenticado.sub) === id;
  if (!proprioRegistro && req.usuarioAutenticado.role !== 'admin') {
    return res.status(403).json({ erro: 'Você não tem permissão para consultar este usuário.' });
  }

  try {
    const usuario = await Usuario.findByPk(id, { attributes: camposPublicos });
    if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });
    return res.json(usuario);
  } catch (error) {
    return next(error);
  }
});

// Usuários alteram apenas o próprio registro; administradores podem alterar qualquer um.
router.put('/:id', autenticar, async (req, res, next) => {
  const parsedId = idSchema.safeParse(req.params.id);
  const parsedBody = atualizacaoSchema.safeParse(req.body);
  if (!parsedId.success) return erroValidacao(res, 'ID inválido.');
  if (!parsedBody.success) return erroValidacao(res);

  const id = parsedId.data;
  const proprioRegistro = Number(req.usuarioAutenticado.sub) === id;
  if (!proprioRegistro && req.usuarioAutenticado.role !== 'admin') {
    return res.status(403).json({ erro: 'Você não tem permissão para alterar este usuário.' });
  }

  try {
    const usuario = await Usuario.findByPk(id);
    if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });

    // Campos como id e role são rejeitados pelo schema, não podem ser enviados pelo cliente.
    Object.assign(usuario, parsedBody.data);
    await usuario.save();
    return res.json({ id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role });
  } catch (error) {
    return lidarErroBanco(error, res, next);
  }
});

// Exclusão reservada a administradores.
router.delete('/:id', autenticar, exigirAdmin, async (req, res, next) => {
  const parsedId = idSchema.safeParse(req.params.id);
  if (!parsedId.success) return erroValidacao(res, 'ID inválido.');

  try {
    const usuario = await Usuario.findByPk(parsedId.data);
    if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });
    await usuario.destroy();
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
