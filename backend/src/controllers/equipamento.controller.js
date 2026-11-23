import { EquipamentoService } from '../services/equipamento.service.js';

export const EquipamentoController = {
  async listar(req, res) {
    res.json(await EquipamentoService.listar(req.usuario));
  },

  async detalhar(req, res) {
    res.json(await EquipamentoService.detalhar(req.validParams.id, req.usuario));
  },

  async agenda(req, res) {
    res.json(await EquipamentoService.agenda(req.validParams.id, req.usuario));
  },

  async criar(req, res) {
    const equipamento = await EquipamentoService.criar(req.body);
    res.status(201).json(equipamento);
  },

  async atualizar(req, res) {
    res.json(await EquipamentoService.atualizar(req.validParams.id, req.body));
  },

  async excluir(req, res) {
    await EquipamentoService.excluir(req.validParams.id);
    res.status(204).send();
  },
};
