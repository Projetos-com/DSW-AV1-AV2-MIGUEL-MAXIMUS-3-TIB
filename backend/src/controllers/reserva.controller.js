import { ReservaService } from '../services/reserva.service.js';

export const ReservaController = {
  async listar(req, res) {
    res.json(await ReservaService.listar(req.usuario));
  },

  async detalhar(req, res) {
    res.json(await ReservaService.detalhar(req.validParams.id, req.usuario));
  },

  async criar(req, res) {
    const reserva = await ReservaService.criar(req.body, req.usuario);
    res.status(201).json(reserva);
  },

  async atualizar(req, res) {
    res.json(await ReservaService.atualizar(req.validParams.id, req.body, req.usuario));
  },

  async excluir(req, res) {
    await ReservaService.excluir(req.validParams.id, req.usuario);
    res.status(204).send();
  },
};
