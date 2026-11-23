import { AppError } from '../utils/AppError.js';

// Rota inexistente
export function rotaNaoEncontrada(req, res) {
  res.status(404).json({ erro: `Rota ${req.method} ${req.originalUrl} não encontrada.` });
}

// Tratamento centralizado de erros (Express 5 encaminha para cá erros de funções async)
// eslint-disable-next-line no-unused-vars
export function tratarErros(erro, req, res, next) {
  if (erro instanceof AppError) {
    return res.status(erro.status).json({ erro: erro.message, detalhes: erro.detalhes });
  }

  // JSON mal formatado no corpo da requisição
  if (erro.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'JSON inválido no corpo da requisição.' });
  }

  // Erros conhecidos do Prisma
  if (erro.code === 'P2002') {
    return res.status(409).json({ erro: 'Já existe um registro com esse valor único.' });
  }
  if (erro.code === 'P2025') {
    return res.status(404).json({ erro: 'Registro não encontrado.' });
  }

  console.error(erro);
  return res.status(500).json({ erro: 'Erro interno do servidor.' });
}
