// Estrutura das páginas internas: barra de navegação + conteúdo.
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';

const links = [
  { para: '/equipamentos', texto: 'Equipamentos' },
  { para: '/reservas', texto: 'Reservas' },
];

export default function Layout() {
  const { usuario, ehAdmin, logout } = useAuth();
  const toast = useToast();
  const navegar = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);

  function sair() {
    logout();
    toast('Você saiu da sua conta.');
    navegar('/login');
  }

  const estiloLink = ({ isActive }) =>
    `rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'bg-marca-50 text-marca-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
          <NavLink to="/equipamentos" className="flex items-center gap-2 font-semibold text-slate-900">
            <img src="/icone.svg" alt="" className="size-8" />
            <span className="hidden sm:inline">Reserva de Equipamentos</span>
          </NavLink>

          <div className="ml-4 hidden gap-1 md:flex">
            {links.map((l) => (
              <NavLink key={l.para} to={l.para} className={estiloLink}>
                {l.texto}
              </NavLink>
            ))}
          </div>

          <div className="ml-auto hidden items-center gap-3 md:flex">
            <div className="text-right leading-tight">
              <p className="text-sm font-medium text-slate-800">{usuario.nome}</p>
              <p className="text-xs text-slate-500">{ehAdmin ? 'Administrador' : 'Usuário'}</p>
            </div>
            <button onClick={sair} className="btn-secundario">
              Sair
            </button>
          </div>

          {/* Menu mobile */}
          <button
            className="ml-auto rounded-md p-2 text-slate-600 hover:bg-slate-100 md:hidden"
            onClick={() => setMenuAberto((v) => !v)}
            aria-expanded={menuAberto}
            aria-label="Abrir menu"
          >
            <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d={menuAberto ? 'M6 18 18 6M6 6l12 12' : 'M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5'} />
            </svg>
          </button>
        </nav>

        {menuAberto && (
          <div className="border-t border-slate-200 px-4 py-3 md:hidden">
            <div className="flex flex-col gap-1">
              {links.map((l) => (
                <NavLink key={l.para} to={l.para} className={estiloLink} onClick={() => setMenuAberto(false)}>
                  {l.texto}
                </NavLink>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
              <div className="leading-tight">
                <p className="text-sm font-medium">{usuario.nome}</p>
                <p className="text-xs text-slate-500">{ehAdmin ? 'Administrador' : 'Usuário'}</p>
              </div>
              <button onClick={sair} className="btn-secundario">
                Sair
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
