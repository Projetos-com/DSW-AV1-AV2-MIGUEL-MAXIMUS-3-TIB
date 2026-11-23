// Rotas da aplicação.
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import RotaProtegida from './components/RotaProtegida.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { ToastProvider } from './contexts/ToastContext.jsx';
import Cadastro from './pages/Cadastro.jsx';
import Equipamentos from './pages/Equipamentos.jsx';
import Login from './pages/Login.jsx';
import Reservas from './pages/Reservas.jsx';

function PaginaSimples({ titulo, texto }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-2xl font-bold text-slate-900">{titulo}</h1>
      <p className="mt-2 text-slate-500">{texto}</p>
      <Link to="/equipamentos" className="btn-primario mt-6">
        Voltar ao início
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Páginas públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />

            {/* Páginas que exigem login */}
            <Route element={<RotaProtegida />}>
              <Route element={<Layout />}>
                <Route path="/equipamentos" element={<Equipamentos />} />
                <Route path="/reservas" element={<Reservas />} />
                <Route path="/acesso-negado" element={<PaginaSimples titulo="Acesso negado" texto="Você não tem permissão para acessar esta página." />} />
                <Route path="*" element={<PaginaSimples titulo="Página não encontrada" texto="O endereço acessado não existe." />} />
              </Route>
            </Route>

            <Route path="/" element={<Navigate to="/equipamentos" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
