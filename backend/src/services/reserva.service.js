// Regras de negócio das reservas (principal processo do sistema).
import { prisma } from '../lib/prisma.js';
import { EquipamentoModel } from '../models/equipamento.model.js';
import { ReservaModel } from '../models/reserva.model.js';
import { AppError } from '../utils/AppError.js';

const DURACAO_MAXIMA_HORAS = 8;

const formatar = (data) =>
  data.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' });

// AUTORIZAÇÃO: somente o dono da reserva ou um administrador pode ver/alterar/excluir
function verificarPermissao(reserva, usuario) {
  if (usuario.papel !== 'ADMIN' && reserva.usuarioId !== usuario.id) {
    throw new AppError('Acesso negado: esta reserva pertence a outro usuário.', 403);
  }
}

async function buscarOuFalhar(id) {
  const reserva = await ReservaModel.buscarPorId(id);
  if (!reserva) throw new AppError('Reserva não encontrada.', 404);
  return reserva;
}

// Regras sobre o período e o equipamento, comuns à criação e à edição
async function validarPeriodo({ equipamentoId, inicio, fim }) {
  if (fim <= inicio) {
    throw new AppError('O horário de fim deve ser depois do horário de início.', 422);
  }
  if (inicio < new Date()) {
    throw new AppError('Não é possível reservar um horário que já passou.', 422);
  }
  const horas = (fim - inicio) / (1000 * 60 * 60);
  if (horas > DURACAO_MAXIMA_HORAS) {
    throw new AppError(`Uma reserva pode durar no máximo ${DURACAO_MAXIMA_HORAS} horas.`, 422);
  }

  const equipamento = await EquipamentoModel.buscarPorId(equipamentoId);
  if (!equipamento) throw new AppError('Equipamento não encontrado.', 404);
  if (!equipamento.ativo) {
    throw new AppError('Este equipamento está inativo (em manutenção) e não pode ser reservado.', 422);
  }
}

// REGRA DE NEGÓCIO PRINCIPAL: impedir reservas com horários sobrepostos para o
// mesmo equipamento. A verificação e a gravação acontecem na mesma transação
// (nível Serializable), evitando que duas pessoas reservem o mesmo horário ao
// mesmo tempo.
async function gravarSemConflito({ dados, ignorarId }) {
  try {
    return await prisma.$transaction(
      async (tx) => {
        const conflito = await ReservaModel.buscarConflito({ ...dados, ignorarId }, tx);
        if (conflito) {
          throw new AppError(
            `Horário indisponível: o equipamento já está reservado de ${formatar(conflito.inicio)} até ${formatar(conflito.fim)}.`,
            409,
          );
        }
        return ignorarId ? ReservaModel.atualizar(ignorarId, dados, tx) : ReservaModel.criar(dados, tx);
      },
      { isolationLevel: 'Serializable' },
    );
  } catch (erro) {
    // P2034 = conflito entre transações simultâneas
    if (erro.code === 'P2034') {
      throw new AppError('Outra reserva foi feita para este horário. Tente novamente.', 409);
    }
    throw erro;
  }
}

export const ReservaService = {
  // Usuário comum vê só as suas; administrador vê todas
  listar(usuario) {
    return ReservaModel.listar({ usuarioId: usuario.papel === 'ADMIN' ? undefined : usuario.id });
  },

  async detalhar(id, usuario) {
    const reserva = await buscarOuFalhar(id);
    verificarPermissao(reserva, usuario);
    return reserva;
  },

  async criar(dados, usuario) {
    await validarPeriodo(dados);
    return gravarSemConflito({ dados: { ...dados, usuarioId: usuario.id } });
  },

  async atualizar(id, dados, usuario) {
    const reserva = await buscarOuFalhar(id);
    verificarPermissao(reserva, usuario);
    if (reserva.fim < new Date()) {
      throw new AppError('Reservas já encerradas não podem ser alteradas.', 422);
    }
    await validarPeriodo(dados);
    return gravarSemConflito({ dados, ignorarId: id });
  },

  async excluir(id, usuario) {
    const reserva = await buscarOuFalhar(id);
    verificarPermissao(reserva, usuario);
    await ReservaModel.excluir(id);
  },
};
