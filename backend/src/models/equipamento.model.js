// Camada de acesso a dados (Model) dos equipamentos.
import { prisma } from '../lib/prisma.js';

export const EquipamentoModel = {
  listar({ somenteAtivos = false } = {}) {
    return prisma.equipamento.findMany({
      where: somenteAtivos ? { ativo: true } : undefined,
      orderBy: { nome: 'asc' },
    });
  },

  buscarPorId(id) {
    return prisma.equipamento.findUnique({ where: { id } });
  },

  buscarPorPatrimonio(patrimonio) {
    return prisma.equipamento.findUnique({ where: { patrimonio } });
  },

  criar(dados) {
    return prisma.equipamento.create({ data: dados });
  },

  atualizar(id, dados) {
    return prisma.equipamento.update({ where: { id }, data: dados });
  },

  excluir(id) {
    return prisma.equipamento.delete({ where: { id } });
  },

  contarReservas(id) {
    return prisma.reserva.count({ where: { equipamentoId: id } });
  },
};
