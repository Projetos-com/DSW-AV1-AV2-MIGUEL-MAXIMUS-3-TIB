// Configuração do Express: middlewares globais, rotas e tratamento de erros.
import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { rotaNaoEncontrada, tratarErros } from './middlewares/tratarErros.js';
import routes from './routes/index.js';

const app = express();

app.use(
  cors({
    origin(origem, callback) {
      // Permite ferramentas sem "Origin" (Postman/Insomnia) e os frontends configurados
      if (!origem || env.corsOrigins.includes(origem)) return callback(null, true);
      return callback(null, false);
    },
  }),
);
app.use(express.json({ limit: '100kb' }));

app.get('/', (req, res) => res.json({ api: 'Reserva de Equipamentos', docs: 'Veja o README', rotas: '/api' }));
app.use('/api', routes);

app.use(rotaNaoEncontrada);
app.use(tratarErros);

export default app;
