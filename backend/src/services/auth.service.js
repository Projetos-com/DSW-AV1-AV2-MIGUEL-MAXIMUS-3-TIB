// Regras de negócio de cadastro e login.
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UsuarioModel } from '../models/usuario.model.js';
import { AppError } from '../utils/AppError.js';

const CUSTO_HASH = 10; // rodadas do bcrypt

function gerarToken(usuario) {
  // "sub" (subject) = id do usuário; o token expira conforme JWT_EXPIRES_IN
  return jwt.sign({ nome: usuario.nome, papel: usuario.papel }, env.jwtSecret, {
    subject: String(usuario.id),
    expiresIn: env.jwtExpiresIn,
  });
}

export const AuthService = {
  async cadastrar({ nome, email, senha }) {
    const existente = await UsuarioModel.buscarPorEmail(email);
    if (existente) {
      throw new AppError('Este e-mail já está cadastrado.', 409);
    }

    // Nunca guardamos a senha pura: somente o hash gerado pelo bcrypt
    const senhaHash = await bcrypt.hash(senha, CUSTO_HASH);
    // Todo cadastro público recebe o perfil USUARIO (o ADMIN é criado pelo seed)
    const usuario = await UsuarioModel.criar({ nome, email, senhaHash, papel: 'USUARIO' });

    return { usuario, token: gerarToken(usuario) };
  },

  async login({ email, senha }) {
    const usuario = await UsuarioModel.buscarPorEmail(email);
    // Mesma mensagem para e-mail ou senha errados (não revela qual dos dois falhou)
    const senhaConfere = usuario ? await bcrypt.compare(senha, usuario.senhaHash) : false;

    if (!usuario || !senhaConfere) {
      throw new AppError('E-mail ou senha incorretos.', 401);
    }

    const { senhaHash, ...dadosPublicos } = usuario;
    return { usuario: dadosPublicos, token: gerarToken(usuario) };
  },

  async perfil(id) {
    const usuario = await UsuarioModel.buscarPorId(id);
    if (!usuario) throw new AppError('Usuário não encontrado.', 404);
    return usuario;
  },
};
