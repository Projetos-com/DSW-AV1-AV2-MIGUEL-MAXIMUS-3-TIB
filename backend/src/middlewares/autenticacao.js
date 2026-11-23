import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

// Verifica o token JWT enviado no cabeçalho "Authorization: Bearer <token>".
// Se for válido, coloca os dados do usuário em req.usuario.
export function autenticar(req, res, next) {
  const cabecalho = req.headers.authorization;

  if (!cabecalho || !cabecalho.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token não informado. Faça login.' });
  }

  const token = cabecalho.slice(7);

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.usuario = { id: Number(payload.sub), nome: payload.nome, papel: payload.papel };
    next();
  } catch (erro) {
    const mensagem =
      erro.name === 'TokenExpiredError' ? 'Sessão expirada. Faça login novamente.' : 'Token inválido.';
    return res.status(401).json({ erro: mensagem });
  }
}

// Autorização por perfil: ex.: autorizar('ADMIN')
export function autorizar(...papeisPermitidos) {
  return (req, res, next) => {
    if (!papeisPermitidos.includes(req.usuario?.papel)) {
      return res.status(403).json({ erro: 'Acesso negado: você não tem permissão para esta operação.' });
    }
    next();
  };
}
