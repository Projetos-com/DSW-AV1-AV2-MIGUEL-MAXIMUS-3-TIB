import { Router } from 'express';
import { ReservaController } from '../controllers/reserva.controller.js';
import { autenticar } from '../middlewares/autenticacao.js';
import { validar } from '../middlewares/validar.js';
import { idParamSchema, reservaSchema } from '../validators/schemas.js';

const router = Router();

// Todas as rotas de reservas exigem login.
// A verificação de "dono da reserva ou ADMIN" é feita no ReservaService.
router.use(autenticar);

router.get('/', ReservaController.listar);
router.get('/:id', validar(idParamSchema, 'params'), ReservaController.detalhar);
router.post('/', validar(reservaSchema), ReservaController.criar);
router.put('/:id', validar(idParamSchema, 'params'), validar(reservaSchema), ReservaController.atualizar);
router.delete('/:id', validar(idParamSchema, 'params'), ReservaController.excluir);

export default router;
