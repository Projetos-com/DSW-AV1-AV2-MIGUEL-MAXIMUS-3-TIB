// Controle de acesso no frontend: só renderiza a página se houver usuário logado
// (e, opcionalmente, se ele tiver o papel exigido). A API continua validando tudo.
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Carregando } from './ui.jsx';

export default function RotaProtegida({ papel }) {
  const { usuario, carregando } = useAuth();
  const local = useLocation();

  if (carregando) return <Carregando texto="Verificando sessão..." />;
  if (!usuario) return <Navigate to="/login" replace state={{ de: local.pathname }} />;
  if (papel && usuario.papel !== papel) return <Navigate to="/acesso-negado" replace />;

  return <Outlet />;
}
