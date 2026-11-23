import { Router } from 'express';
import { EquipamentoController } from '../controllers/equipamento.controller.js';
import { autenticar, autorizar } from '../middlewares/autenticacao.js';
import { validar } from '../middlewares/validar.js';
import { equipamentoSchema, idParamSchema } from '../validators/schemas.js';

const router = Router();

// Todas as rotas de equipamentos exigem login
router.use(autenticar);

// Qualquer usuário logado pode consultar
router.get('/', EquipamentoController.listar);
router.get('/:id', validar(idParamSchema, 'params'), EquipamentoController.detalhar);
router.get('/:id/agenda', validar(idParamSchema, 'params'), EquipamentoController.agenda);

// Somente ADMIN pode criar, alterar e excluir
router.post('/', autorizar('ADMIN'), validar(equipamentoSchema), EquipamentoController.criar);
router.put(
  '/:id',
  autorizar('ADMIN'),
  validar(idParamSchema, 'params'),
  validar(equipamentoSchema),
  EquipamentoController.atualizar,
);
router.delete('/:id', autorizar('ADMIN'), validar(idParamSchema, 'params'), EquipamentoController.excluir);

export default router;
