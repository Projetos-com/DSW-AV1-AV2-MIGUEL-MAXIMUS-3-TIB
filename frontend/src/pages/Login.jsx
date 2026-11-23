import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Alerta, Campo, Spinner } from '../components/ui.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import AuthLayout from './AuthLayout.jsx';

export default function Login() {
  const { usuario, entrar } = useAuth();
  const toast = useToast();
  const navegar = useNavigate();
  const local = useLocation();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to="/equipamentos" replace />;

  async function enviar(e) {
    e.preventDefault();
    const novos = {};
    if (!email.trim()) novos.email = 'Informe seu e-mail.';
    if (!senha) novos.senha = 'Informe sua senha.';
    setErros(novos);
    setErroGeral('');
    if (Object.keys(novos).length) return;

    setEnviando(true);
    try {
      const u = await entrar(email, senha);
      toast(`Bem-vindo(a), ${u.nome.split(' ')[0]}!`);
      navegar(local.state?.de || '/equipamentos', { replace: true });
    } catch (erro) {
      setErroGeral(erro.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AuthLayout
      titulo="Entrar"
      subtitulo="Acesse sua conta para reservar equipamentos."
      rodape={
        <>
          Ainda não tem conta?{' '}
          <Link to="/cadastro" className="font-medium text-marca-600 hover:underline">
            Cadastre-se
          </Link>
        </>
      }
    >
      <form onSubmit={enviar} noValidate className="space-y-4">
        {erroGeral && <Alerta>{erroGeral}</Alerta>}
        <Campo rotulo="E-mail" id="email" erro={erros.email}>
          <input id="email" type="email" autoComplete="email" className={`campo ${erros.email ? 'campo-erro' : ''}`} value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
        </Campo>
        <Campo rotulo="Senha" id="senha" erro={erros.senha}>
          <input id="senha" type="password" autoComplete="current-password" className={`campo ${erros.senha ? 'campo-erro' : ''}`} value={senha} onChange={(e) => setSenha(e.target.value)} />
        </Campo>
        <button type="submit" className="btn-primario w-full" disabled={enviando}>
          {enviando && <Spinner className="size-4" />} Entrar
        </button>
      </form>
    </AuthLayout>
  );
}
