import { Router } from 'express';
import authRoutes from './auth.routes.js';
import equipamentoRoutes from './equipamento.routes.js';
import reservaRoutes from './reserva.routes.js';

const router = Router();

router.get('/saude', (req, res) => res.json({ status: 'ok' })); // usado para checar se a API está no ar
router.use('/auth', authRoutes);
router.use('/equipamentos', equipamentoRoutes);
router.use('/reservas', reservaRoutes);

export default router;
