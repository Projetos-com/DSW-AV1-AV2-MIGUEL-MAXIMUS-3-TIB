// Camada de acesso a dados (Model) das reservas.
import { prisma } from '../lib/prisma.js';

const incluirRelacoes = {
  equipamento: { select: { id: true, nome: true, categoria: true, patrimonio: true } },
  usuario: { select: { id: true, nome: true, email: true } },
};

export const ReservaModel = {
  // usuarioId = undefined -> todas as reservas (administrador)
  listar({ usuarioId } = {}) {
    return prisma.reserva.findMany({
      where: usuarioId ? { usuarioId } : undefined,
      include: incluirRelacoes,
      orderBy: { inicio: 'asc' },
    });
  },

  buscarPorId(id) {
    return prisma.reserva.findUnique({ where: { id }, include: incluirRelacoes });
  },

  // Agenda pública de um equipamento: apenas horários ocupados a partir de agora
  agendaDoEquipamento(equipamentoId) {
    return prisma.reserva.findMany({
      where: { equipamentoId, fim: { gt: new Date() } },
      select: { id: true, inicio: true, fim: true },
      orderBy: { inicio: 'asc' },
    });
  },

  // Procura uma reserva do mesmo equipamento cujo horário se sobrepõe ao intervalo [inicio, fim).
  // Dois intervalos se sobrepõem quando: inicioExistente < fimNovo E fimExistente > inicioNovo.
  buscarConflito({ equipamentoId, inicio, fim, ignorarId }, db = prisma) {
    return db.reserva.findFirst({
      where: {
        equipamentoId,
        inicio: { lt: fim },
        fim: { gt: inicio },
        ...(ignorarId ? { id: { not: ignorarId } } : {}),
      },
      include: { usuario: { select: { nome: true } } },
    });
  },

  criar(dados, db = prisma) {
    return db.reserva.create({ data: dados, include: incluirRelacoes });
  },

  atualizar(id, dados, db = prisma) {
    return db.reserva.update({ where: { id }, data: dados, include: incluirRelacoes });
  },

  excluir(id) {
    return prisma.reserva.delete({ where: { id } });
  },
};
