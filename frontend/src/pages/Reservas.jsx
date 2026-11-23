// Lista de reservas. Usuário vê as próprias; admin vê todas (com o nome de quem reservou).
import { useCallback, useEffect, useMemo, useState } from 'react';
import ConfirmarExclusao from '../components/ConfirmarExclusao.jsx';
import Modal from '../components/Modal.jsx';
import ReservaForm from '../components/ReservaForm.jsx';
import { Alerta, Carregando, EstadoVazio, Selo } from '../components/ui.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { api } from '../services/api.js';
import { formatarPeriodo, situacaoReserva } from '../utils/datas.js';

const SITUACOES = {
  agendada: { texto: 'Agendada', cor: 'azul' },
  andamento: { texto: 'Em andamento', cor: 'verde' },
  encerrada: { texto: 'Encerrada', cor: 'slate' },
};

export default function Reservas() {
  const { usuario, ehAdmin } = useAuth();
  const toast = useToast();
  const [reservas, setReservas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [filtro, setFiltro] = useState('proximas');
  const [editando, setEditando] = useState(null); // null | {} (nova) | reserva
  const [excluindo, setExcluindo] = useState(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      setReservas(await api.get('/reservas'));
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const visiveis = useMemo(() => {
    const comSituacao = reservas.map((r) => ({ ...r, situacao: situacaoReserva(r) }));
    return filtro === 'proximas' ? comSituacao.filter((r) => r.situacao !== 'encerrada') : comSituacao;
  }, [reservas, filtro]);

  // A API devolve 403 se não for o dono; aqui apenas escondemos os botões
  const podeGerenciar = (r) => ehAdmin || r.usuarioId === usuario.id;

  async function aoSalvar() {
    toast(editando?.id ? 'Reserva atualizada.' : 'Reserva realizada.');
    setEditando(null);
    await carregar();
  }

  async function confirmarExclusao() {
    await api.delete(`/reservas/${excluindo.id}`);
    setReservas((lista) => lista.filter((r) => r.id !== excluindo.id));
    setExcluindo(null);
    toast('Reserva cancelada.');
  }

  function Acoes({ r }) {
    if (!podeGerenciar(r)) return null;
    return (
      <div className="flex gap-2">
        {r.situacao !== 'encerrada' && (
          <button className="btn-secundario px-3 py-1.5" onClick={() => setEditando(r)}>
            Editar
          </button>
        )}
        <button className="btn-secundario px-3 py-1.5 text-red-600 hover:bg-red-50" onClick={() => setExcluindo(r)}>
          {r.situacao === 'encerrada' ? 'Excluir' : 'Cancelar'}
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{ehAdmin ? 'Todas as reservas' : 'Minhas reservas'}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {ehAdmin ? 'Como administrador, você vê e pode cancelar reservas de todos os usuários.' : 'Acompanhe, altere ou cancele suas reservas.'}
          </p>
        </div>
        <button className="btn-primario" onClick={() => setEditando({})}>
          + Nova reserva
        </button>
      </div>

      <div className="mt-6 inline-flex rounded-lg bg-slate-100 p-1 text-sm" role="tablist">
        {[
          ['proximas', 'Próximas'],
          ['todas', 'Todas'],
        ].map(([valor, texto]) => (
          <button
            key={valor}
            role="tab"
            aria-selected={filtro === valor}
            onClick={() => setFiltro(valor)}
            className={`rounded-md px-4 py-1.5 font-medium ${filtro === valor ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {texto}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {carregando ? (
          <Carregando texto="Carregando reservas..." />
        ) : erro ? (
          <Alerta acao={<button className="btn-secundario" onClick={carregar}>Tentar novamente</button>}>{erro}</Alerta>
        ) : visiveis.length === 0 ? (
          <EstadoVazio
            titulo={filtro === 'proximas' ? 'Nenhuma reserva próxima' : 'Nenhuma reserva registrada'}
            descricao="Quando houver reservas, elas aparecerão aqui."
            acao={<button className="btn-primario" onClick={() => setEditando({})}>+ Nova reserva</button>}
          />
        ) : (
          <>
            {/* Tabela (telas médias e grandes) */}
            <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs md:block">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">Equipamento</th>
                    <th className="px-4 py-3">Período</th>
                    <th className="px-4 py-3">Finalidade</th>
                    {ehAdmin && <th className="px-4 py-3">Reservado por</th>}
                    <th className="px-4 py-3">Situação</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visiveis.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{r.equipamento.nome}</p>
                        <p className="font-mono text-xs text-slate-500">{r.equipamento.patrimonio}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-700">{formatarPeriodo(r.inicio, r.fim)}</td>
                      <td className="max-w-xs truncate px-4 py-3 text-slate-600" title={r.finalidade}>
                        {r.finalidade}
                      </td>
                      {ehAdmin && <td className="px-4 py-3 text-slate-600">{r.usuario.nome}</td>}
                      <td className="px-4 py-3">
                        <Selo cor={SITUACOES[r.situacao].cor}>{SITUACOES[r.situacao].texto}</Selo>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <Acoes r={r} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cartões (celular) */}
            <ul className="space-y-3 md:hidden">
              {visiveis.map((r) => (
                <li key={r.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{r.equipamento.nome}</p>
                      <p className="text-sm text-slate-600">{formatarPeriodo(r.inicio, r.fim)}</p>
                    </div>
                    <Selo cor={SITUACOES[r.situacao].cor}>{SITUACOES[r.situacao].texto}</Selo>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{r.finalidade}</p>
                  {ehAdmin && <p className="mt-1 text-xs text-slate-500">Reservado por {r.usuario.nome}</p>}
                  <div className="mt-3">
                    <Acoes r={r} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <Modal aberto={editando !== null} titulo={editando?.id ? 'Editar reserva' : 'Nova reserva'} onFechar={() => setEditando(null)}>
        <ReservaForm key={editando?.id ?? 'nova'} reserva={editando?.id ? editando : null} onSalvo={aoSalvar} onCancelar={() => setEditando(null)} />
      </Modal>

      <ConfirmarExclusao
        aberto={excluindo !== null}
        titulo={excluindo?.situacao === 'encerrada' ? 'Excluir reserva' : 'Cancelar reserva'}
        mensagem={excluindo ? `${excluindo.equipamento.nome} – ${formatarPeriodo(excluindo.inicio, excluindo.fim)}. Deseja realmente remover esta reserva?` : ''}
        onConfirmar={confirmarExclusao}
        onFechar={() => setExcluindo(null)}
      />
    </>
  );
}
