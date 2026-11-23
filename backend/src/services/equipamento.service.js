// Regras de negócio dos equipamentos.
import { EquipamentoModel } from '../models/equipamento.model.js';
import { ReservaModel } from '../models/reserva.model.js';
import { AppError } from '../utils/AppError.js';

async function buscarOuFalhar(id) {
  const equipamento = await EquipamentoModel.buscarPorId(id);
  if (!equipamento) throw new AppError('Equipamento não encontrado.', 404);
  return equipamento;
}

export const EquipamentoService = {
  // Administrador vê todos; usuário comum vê somente os ativos (disponíveis para reserva)
  listar(usuario) {
    return EquipamentoModel.listar({ somenteAtivos: usuario.papel !== 'ADMIN' });
  },

  async detalhar(id, usuario) {
    const equipamento = await buscarOuFalhar(id);
    if (!equipamento.ativo && usuario.papel !== 'ADMIN') {
      throw new AppError('Equipamento não encontrado.', 404);
    }
    return equipamento;
  },

  // Horários já ocupados (sem dados pessoais), para o usuário escolher um horário livre
  async agenda(id, usuario) {
    await this.detalhar(id, usuario);
    return ReservaModel.agendaDoEquipamento(id);
  },

  async criar(dados) {
    if (await EquipamentoModel.buscarPorPatrimonio(dados.patrimonio)) {
      throw new AppError(`Já existe um equipamento com o patrimônio ${dados.patrimonio}.`, 409);
    }
    return EquipamentoModel.criar(dados);
  },

  async atualizar(id, dados) {
    await buscarOuFalhar(id);
    const mesmoPatrimonio = await EquipamentoModel.buscarPorPatrimonio(dados.patrimonio);
    if (mesmoPatrimonio && mesmoPatrimonio.id !== id) {
      throw new AppError(`Já existe um equipamento com o patrimônio ${dados.patrimonio}.`, 409);
    }
    return EquipamentoModel.atualizar(id, dados);
  },

  async excluir(id) {
    await buscarOuFalhar(id);
    // Regra: não apagar equipamento com histórico de reservas (o histórico seria perdido).
    const totalReservas = await EquipamentoModel.contarReservas(id);
    if (totalReservas > 0) {
      throw new AppError(
        `Este equipamento possui ${totalReservas} reserva(s) registrada(s) e não pode ser excluído. Marque-o como inativo.`,
        409,
      );
    }
    await EquipamentoModel.excluir(id);
  },
};
