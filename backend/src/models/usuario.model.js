// Camada de acesso a dados (Model) dos usuários: só conversa com o banco via Prisma.
import { prisma } from '../lib/prisma.js';

const camposPublicos = { id: true, nome: true, email: true, papel: true, criadoEm: true };

export const UsuarioModel = {
  buscarPorEmail(email) {
    return prisma.usuario.findUnique({ where: { email } });
  },

  buscarPorId(id) {
    return prisma.usuario.findUnique({ where: { id }, select: camposPublicos });
  },

  criar({ nome, email, senhaHash, papel = 'USUARIO' }) {
    return prisma.usuario.create({ data: { nome, email, senhaHash, papel }, select: camposPublicos });
  },
};
