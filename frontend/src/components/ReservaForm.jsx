// Formulário de criação/edição de reserva. Mostra os horários já ocupados do equipamento.
import { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { formatarPeriodo, paraInput, paraISO, proximaHoraCheia } from '../utils/datas.js';
import { Alerta, Campo, Spinner } from './ui.jsx';

export default function ReservaForm({ reserva, equipamentoInicialId, onSalvo, onCancelar }) {
  const sugestao = proximaHoraCheia();
  const [dados, setDados] = useState(() => ({
    equipamentoId: String(reserva?.equipamentoId ?? equipamentoInicialId ?? ''),
    inicio: paraInput(reserva?.inicio ?? sugestao),
    fim: paraInput(reserva?.fim ?? new Date(sugestao.getTime() + 60 * 60 * 1000)),
    finalidade: reserva?.finalidade ?? '',
  }));
  const [equipamentos, setEquipamentos] = useState([]);
  const [carregandoEquip, setCarregandoEquip] = useState(true);
  const [agenda, setAgenda] = useState({ carregando: false, itens: [] });
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Lista de equipamentos para o <select>
  useEffect(() => {
    api
      .get('/equipamentos')
      .then((lista) => setEquipamentos(lista.filter((e) => e.ativo)))
      .catch((e) => setErroGeral(e.message))
      .finally(() => setCarregandoEquip(false));
  }, []);

  // Sempre que o equipamento muda, busca os horários já ocupados
  useEffect(() => {
    if (!dados.equipamentoId) return;
    let ativo = true;
    setAgenda({ carregando: true, itens: [] });
    api
      .get(`/equipamentos/${dados.equipamentoId}/agenda`)
      .then((itens) => ativo && setAgenda({ carregando: false, itens: itens.filter((i) => i.id !== reserva?.id) }))
      .catch(() => ativo && setAgenda({ carregando: false, itens: [] }));
    return () => {
      ativo = false;
    };
  }, [dados.equipamentoId, reserva?.id]);

  const alterar = (campo) => (e) => {
    setDados((d) => ({ ...d, [campo]: e.target.value }));
    setErros((er) => ({ ...er, [campo]: undefined }));
  };

  function validar() {
    const novos = {};
    if (!dados.equipamentoId) novos.equipamentoId = 'Selecione um equipamento.';
    if (!dados.inicio) novos.inicio = 'Informe o início.';
    if (!dados.fim) novos.fim = 'Informe o fim.';
    if (dados.inicio && dados.fim && new Date(dados.fim) <= new Date(dados.inicio)) {
      novos.fim = 'O fim deve ser depois do início.';
    }
    if (!dados.finalidade.trim()) novos.finalidade = 'Descreva a finalidade.';
    setErros(novos);
    return Object.keys(novos).length === 0;
  }

  async function enviar(e) {
    e.preventDefault();
    setErroGeral('');
    if (!validar()) return;

    setSalvando(true);
    const corpo = {
      equipamentoId: Number(dados.equipamentoId),
      inicio: paraISO(dados.inicio),
      fim: paraISO(dados.fim),
      finalidade: dados.finalidade,
    };
    try {
      const salva = reserva ? await api.put(`/reservas/${reserva.id}`, corpo) : await api.post('/reservas', corpo);
      onSalvo(salva);
    } catch (erro) {
      // 400 = validação de campos; 409/422 = regra de negócio (ex.: horário ocupado)
      setErros(erro.errosPorCampo?.() ?? {});
      setErroGeral(erro.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="space-y-4">
      {erroGeral && <Alerta>{erroGeral}</Alerta>}

      <Campo rotulo="Equipamento" id="equipamentoId" erro={erros.equipamentoId}>
        <select id="equipamentoId" className={`campo ${erros.equipamentoId ? 'campo-erro' : ''}`} value={dados.equipamentoId} onChange={alterar('equipamentoId')} disabled={carregandoEquip}>
          <option value="">{carregandoEquip ? 'Carregando...' : 'Selecione...'}</option>
          {equipamentos.map((eq) => (
            <option key={eq.id} value={eq.id}>
              {eq.nome} ({eq.patrimonio})
            </option>
          ))}
        </select>
      </Campo>

      {dados.equipamentoId && (
        <div className="rounded-lg bg-slate-50 p-3 text-sm ring-1 ring-slate-200">
          <p className="mb-2 font-medium text-slate-700">Horários já reservados</p>
          {agenda.carregando ? (
            <p className="flex items-center gap-2 text-slate-500">
              <Spinner className="size-4" /> Consultando agenda...
            </p>
          ) : agenda.itens.length === 0 ? (
            <p className="text-slate-500">Nenhuma reserva futura: todos os horários estão livres.</p>
          ) : (
            <ul className="max-h-28 space-y-1 overflow-y-auto text-slate-600">
              {agenda.itens.map((i) => (
                <li key={i.id} className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-amber-500" />
                  {formatarPeriodo(i.inicio, i.fim)}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo rotulo="Início" id="inicio" erro={erros.inicio}>
          <input id="inicio" type="datetime-local" step={900} className={`campo ${erros.inicio ? 'campo-erro' : ''}`} value={dados.inicio} onChange={alterar('inicio')} />
        </Campo>
        <Campo rotulo="Fim" id="fim" erro={erros.fim} dica="Máximo de 8 horas por reserva">
          <input id="fim" type="datetime-local" step={900} className={`campo ${erros.fim ? 'campo-erro' : ''}`} value={dados.fim} onChange={alterar('fim')} />
        </Campo>
      </div>

      <Campo rotulo="Finalidade" id="finalidade" erro={erros.finalidade}>
        <input id="finalidade" className={`campo ${erros.finalidade ? 'campo-erro' : ''}`} value={dados.finalidade} onChange={alterar('finalidade')} maxLength={200} placeholder="Ex.: Aula de Geografia – 2º ano B" />
      </Campo>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn-secundario" onClick={onCancelar} disabled={salvando}>
          Cancelar
        </button>
        <button type="submit" className="btn-primario" disabled={salvando}>
          {salvando && <Spinner className="size-4" />} {reserva ? 'Salvar alterações' : 'Reservar'}
        </button>
      </div>
    </form>
  );
}
