// Formulário de criação/edição de equipamento (somente administrador).
import { useState } from 'react';
import { api } from '../services/api.js';
import { Alerta, Campo, Spinner } from './ui.jsx';

const vazio = { nome: '', categoria: '', patrimonio: '', descricao: '', ativo: true };

export default function EquipamentoForm({ equipamento, onSalvo, onCancelar }) {
  const [dados, setDados] = useState(equipamento ? { ...vazio, ...equipamento, descricao: equipamento.descricao ?? '' } : vazio);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [salvando, setSalvando] = useState(false);

  const alterar = (campo) => (e) => {
    const valor = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setDados((d) => ({ ...d, [campo]: valor }));
    setErros((er) => ({ ...er, [campo]: undefined }));
  };

  function validar() {
    const novos = {};
    if (!dados.nome.trim()) novos.nome = 'Nome é obrigatório.';
    if (!dados.categoria.trim()) novos.categoria = 'Categoria é obrigatória.';
    if (!dados.patrimonio.trim()) novos.patrimonio = 'Patrimônio é obrigatório.';
    setErros(novos);
    return Object.keys(novos).length === 0;
  }

  async function enviar(e) {
    e.preventDefault();
    setErroGeral('');
    if (!validar()) return;

    setSalvando(true);
    const corpo = {
      nome: dados.nome,
      categoria: dados.categoria,
      patrimonio: dados.patrimonio,
      descricao: dados.descricao,
      ativo: dados.ativo,
    };
    try {
      const salvo = equipamento
        ? await api.put(`/equipamentos/${equipamento.id}`, corpo)
        : await api.post('/equipamentos', corpo);
      onSalvo(salvo);
    } catch (erro) {
      setErros(erro.errosPorCampo?.() ?? {});
      setErroGeral(erro.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="space-y-4">
      {erroGeral && <Alerta>{erroGeral}</Alerta>}

      <Campo rotulo="Nome" id="nome" erro={erros.nome}>
        <input id="nome" className={`campo ${erros.nome ? 'campo-erro' : ''}`} value={dados.nome} onChange={alterar('nome')} maxLength={100} autoFocus />
      </Campo>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo rotulo="Categoria" id="categoria" erro={erros.categoria}>
          <input id="categoria" list="categorias" className={`campo ${erros.categoria ? 'campo-erro' : ''}`} value={dados.categoria} onChange={alterar('categoria')} maxLength={60} placeholder="Ex.: Projetor" />
          <datalist id="categorias">
            {['Projetor', 'Notebook', 'Áudio', 'Fotografia', 'Robótica', 'Tablet'].map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Campo>
        <Campo rotulo="Patrimônio" id="patrimonio" erro={erros.patrimonio} dica="Código único, ex.: PRJ-001">
          <input id="patrimonio" className={`campo uppercase ${erros.patrimonio ? 'campo-erro' : ''}`} value={dados.patrimonio} onChange={alterar('patrimonio')} maxLength={30} />
        </Campo>
      </div>

      <Campo rotulo="Descrição (opcional)" id="descricao" erro={erros.descricao}>
        <textarea id="descricao" rows={3} className="campo" value={dados.descricao} onChange={alterar('descricao')} maxLength={500} />
      </Campo>

      <label className="flex items-center gap-3 text-sm">
        <input type="checkbox" className="size-4 rounded border-slate-300 accent-marca-600" checked={dados.ativo} onChange={alterar('ativo')} />
        <span>
          <span className="font-medium">Disponível para reserva</span>
          <span className="block text-xs text-slate-500">Desmarque se o equipamento estiver em manutenção.</span>
        </span>
      </label>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn-secundario" onClick={onCancelar} disabled={salvando}>
          Cancelar
        </button>
        <button type="submit" className="btn-primario" disabled={salvando}>
          {salvando && <Spinner className="size-4" />} {equipamento ? 'Salvar alterações' : 'Cadastrar'}
        </button>
      </div>
    </form>
  );
}
