// Centraliza a leitura das variáveis de ambiente (arquivo .env em desenvolvimento)
import 'dotenv/config';

function obrigatoria(nome) {
  const valor = process.env[nome];
  if (!valor) {
    throw new Error(`Variável de ambiente ${nome} não definida. Veja o arquivo .env.example.`);
  }
  return valor;
}

export const env = {
  databaseUrl: obrigatoria('DATABASE_URL'),
  jwtSecret: obrigatoria('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  port: Number(process.env.PORT) || 3333,
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origem) => origem.trim().replace(/\/$/, ''))
    .filter(Boolean),
};
