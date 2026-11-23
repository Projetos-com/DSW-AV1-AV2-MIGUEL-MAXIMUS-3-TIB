// Ponto de entrada: sobe o servidor HTTP.
import app from './app.js';
import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';

const servidor = app.listen(env.port, () => {
  console.log(`API rodando em http://localhost:${env.port}`);
});

// Encerramento limpo (Ctrl+C ou reinício da hospedagem)
async function encerrar() {
  servidor.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on('SIGINT', encerrar);
process.on('SIGTERM', encerrar);
