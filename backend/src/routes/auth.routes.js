import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { autenticar } from '../middlewares/autenticacao.js';
import { validar } from '../middlewares/validar.js';
import { cadastroSchema, loginSchema } from '../validators/schemas.js';

const router = Router();

router.post('/cadastro', validar(cadastroSchema), AuthController.cadastrar); // público
router.post('/login', validar(loginSchema), AuthController.login); // público
router.get('/perfil', autenticar, AuthController.perfil); // exige token

export default router;
