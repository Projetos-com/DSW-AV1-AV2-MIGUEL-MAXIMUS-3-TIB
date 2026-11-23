import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Alerta, Campo, Spinner } from '../components/ui.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import AuthLayout from './AuthLayout.jsx';

export default function Cadastro() {
  const { usuario, cadastrar } = useAuth();
  const toast = useToast();
  const navegar = useNavigate();
  const [dados, setDados] = useState({ nome: '', email: '', senha: '', confirmacao: '' });
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to="/equipamentos" replace />;

  const alterar = (campo) => (e) => {
    setDados((d) => ({ ...d, [campo]: e.target.value }));
    setErros((er) => ({ ...er, [campo]: undefined }));
  };

  function validar() {
    const novos = {};
    if (dados.nome.trim().length < 3) novos.nome = 'Informe seu nome (mínimo 3 letras).';
    if (!/^\S+@\S+\.\S+$/.test(dados.email.trim())) novos.email = 'Informe um e-mail válido.';
    if (dados.senha.length < 6) novos.senha = 'A senha deve ter pelo menos 6 caracteres.';
    if (dados.confirmacao !== dados.senha) novos.confirmacao = 'As senhas não conferem.';
    setErros(novos);
    return Object.keys(novos).length === 0;
  }

  async function enviar(e) {
    e.preventDefault();
    setErroGeral('');
    if (!validar()) return;

    setEnviando(true);
    try {
      await cadastrar({ nome: dados.nome, email: dados.email, senha: dados.senha });
      toast('Conta criada com sucesso!');
      navegar('/equipamentos', { replace: true });
    } catch (erro) {
      setErros(erro.errosPorCampo?.() ?? {});
      setErroGeral(erro.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AuthLayout
      titulo="Criar conta"
      subtitulo="Cadastre-se para reservar os equipamentos da escola."
      rodape={
        <>
          Já tem conta?{' '}
          <Link to="/login" className="font-medium text-marca-600 hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <form onSubmit={enviar} noValidate className="space-y-4">
        {erroGeral && <Alerta>{erroGeral}</Alerta>}
        <Campo rotulo="Nome completo" id="nome" erro={erros.nome}>
          <input id="nome" autoComplete="name" className={`campo ${erros.nome ? 'campo-erro' : ''}`} value={dados.nome} onChange={alterar('nome')} autoFocus />
        </Campo>
        <Campo rotulo="E-mail" id="email" erro={erros.email}>
          <input id="email" type="email" autoComplete="email" className={`campo ${erros.email ? 'campo-erro' : ''}`} value={dados.email} onChange={alterar('email')} />
        </Campo>
        <Campo rotulo="Senha" id="senha" erro={erros.senha}>
          <input id="senha" type="password" autoComplete="new-password" className={`campo ${erros.senha ? 'campo-erro' : ''}`} value={dados.senha} onChange={alterar('senha')} />
        </Campo>
        <Campo rotulo="Confirme a senha" id="confirmacao" erro={erros.confirmacao}>
          <input id="confirmacao" type="password" autoComplete="new-password" className={`campo ${erros.confirmacao ? 'campo-erro' : ''}`} value={dados.confirmacao} onChange={alterar('confirmacao')} />
        </Campo>
        <button type="submit" className="btn-primario w-full" disabled={enviando}>
          {enviando && <Spinner className="size-4" />} Criar conta
        </button>
      </form>
    </AuthLayout>
  );
}
