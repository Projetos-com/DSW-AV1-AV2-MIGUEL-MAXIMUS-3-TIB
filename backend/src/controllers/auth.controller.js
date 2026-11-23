// Controllers recebem a requisição HTTP, chamam o service e devolvem a resposta JSON.
import { AuthService } from '../services/auth.service.js';

export const AuthController = {
  async cadastrar(req, res) {
    const resultado = await AuthService.cadastrar(req.body);
    res.status(201).json(resultado);
  },

  async login(req, res) {
    const resultado = await AuthService.login(req.body);
    res.json(resultado);
  },

  async perfil(req, res) {
    const usuario = await AuthService.perfil(req.usuario.id);
    res.json(usuario);
  },
};
