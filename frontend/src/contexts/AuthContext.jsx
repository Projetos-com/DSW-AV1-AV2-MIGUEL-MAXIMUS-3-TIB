// Guarda o usuário logado e o token JWT; oferece login, cadastro e logout para toda a aplicação.
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, tokenStorage } from '../services/api.js';
import { useToast } from './ToastContext.jsx';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true); // validando o token salvo
  const toast = useToast();

  const logout = useCallback(() => {
    tokenStorage.remover();
    setUsuario(null);
  }, []);

  // Ao abrir o site: se houver token salvo, confirma com a API se ele ainda é válido
  useEffect(() => {
    if (!tokenStorage.obter()) {
      setCarregando(false);
      return;
    }
    api
      .get('/auth/perfil')
      .then(setUsuario)
      .catch(() => tokenStorage.remover())
      .finally(() => setCarregando(false));
  }, []);

  // Qualquer resposta 401 com token (expirado/inválido) encerra a sessão
  useEffect(() => {
    function aoInvalidar(evento) {
      logout();
      toast(evento.detail || 'Sua sessão expirou. Faça login novamente.', 'aviso');
    }
    window.addEventListener('sessao-invalida', aoInvalidar);
    return () => window.removeEventListener('sessao-invalida', aoInvalidar);
  }, [logout, toast]);

  async function entrar(email, senha) {
    const { usuario, token } = await api.post('/auth/login', { email, senha });
    tokenStorage.salvar(token);
    setUsuario(usuario);
    return usuario;
  }

  async function cadastrar(dados) {
    const { usuario, token } = await api.post('/auth/cadastro', dados);
    tokenStorage.salvar(token);
    setUsuario(usuario);
    return usuario;
  }

  const valor = { usuario, carregando, ehAdmin: usuario?.papel === 'ADMIN', entrar, cadastrar, logout };
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
