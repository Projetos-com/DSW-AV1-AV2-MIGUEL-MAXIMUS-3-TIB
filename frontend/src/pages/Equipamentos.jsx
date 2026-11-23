// Lista de equipamentos. Admin: cadastra, edita e exclui. Usuário: consulta e reserva.
import { useCallback, useEffect, useMemo, useState } from 'react';
import ConfirmarExclusao from '../components/ConfirmarExclusao.jsx';
import EquipamentoForm from '../components/EquipamentoForm.jsx';
import Modal from '../components/Modal.jsx';
import ReservaForm from '../components/ReservaForm.jsx';
import { Alerta, Carregando, EstadoVazio, Selo } from '../components/ui.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { api } from '../services/api.js';

export default function Equipamentos() {
  const { ehAdmin } = useAuth();
  const toast = useToast();
  const [equipamentos, setEquipamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');
  const [editando, setEditando] = useState(null); // null = fechado | {} = novo | objeto = edição
  const [excluindo, setExcluindo] = useState(null);
  const [reservando, setReservando] = useState(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      setEquipamentos(await api.get('/equipamentos'));
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return equipamentos;
    return equipamentos.filter((e) => [e.nome, e.categoria, e.patrimonio].some((v) => v.toLowerCase().includes(termo)));
  }, [equipamentos, busca]);

  function aoSalvar(salvo) {
    const novo = !editando?.id;
    setEquipamentos((lista) =>
      (novo ? [...lista, salvo] : lista.map((e) => (e.id === salvo.id ? salvo : e))).sort((a, b) => a.nome.localeCompare(b.nome)),
    );
    setEditando(null);
    toast(novo ? 'Equipamento cadastrado.' : 'Equipamento atualizado.');
  }

  async function confirmarExclusao() {
    await api.delete(`/equipamentos/${excluindo.id}`);
    setEquipamentos((lista) => lista.filter((e) => e.id !== excluindo.id));
    setExcluindo(null);
    toast('Equipamento excluído.');
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Equipamentos</h1>
          <p className="mt-1 text-sm text-slate-500">
            {ehAdmin ? 'Gerencie o acervo de equipamentos disponíveis para reserva.' : 'Escolha um equipamento e reserve um horário livre.'}
          </p>
        </div>
        {ehAdmin && (
          <button className="btn-primario" onClick={() => setEditando({})}>
            + Novo equipamento
          </button>
        )}
      </div>

      <div className="mt-6">
        <input type="search" className="campo max-w-sm" placeholder="Buscar por nome, categoria ou patrimônio..." value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar equipamentos" />
      </div>

      <div className="mt-6">
        {carregando ? (
          <Carregando texto="Carregando equipamentos..." />
        ) : erro ? (
          <Alerta acao={<button className="btn-secundario" onClick={carregar}>Tentar novamente</button>}>{erro}</Alerta>
        ) : filtrados.length === 0 ? (
          <EstadoVazio
            titulo={busca ? 'Nenhum equipamento encontrado' : 'Nenhum equipamento cadastrado'}
            descricao={busca ? 'Tente outro termo de busca.' : ehAdmin ? 'Cadastre o primeiro equipamento.' : 'Aguarde o administrador cadastrar os equipamentos.'}
            acao={ehAdmin && !busca && <button className="btn-primario" onClick={() => setEditando({})}>+ Novo equipamento</button>}
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtrados.map((eq) => (
              <li key={eq.id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <Selo cor="azul">{eq.categoria}</Selo>
                  {eq.ativo ? <Selo cor="verde">Disponível</Selo> : <Selo cor="ambar">Em manutenção</Selo>}
                </div>
                <h2 className="mt-3 font-semibold text-slate-900">{eq.nome}</h2>
                <p className="font-mono text-xs text-slate-500">{eq.patrimonio}</p>
                <p className="mt-2 line-clamp-2 flex-1 text-sm text-slate-600">{eq.descricao || 'Sem descrição.'}</p>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                  {eq.ativo && (
                    <button className="btn-primario flex-1 py-1.5" onClick={() => setReservando(eq)}>
                      Reservar
                    </button>
                  )}
                  {ehAdmin && (
                    <>
                      <button className="btn-secundario py-1.5" onClick={() => setEditando(eq)}>
                        Editar
                      </button>
                      <button className="btn-secundario py-1.5 text-red-600 hover:bg-red-50" onClick={() => setExcluindo(eq)}>
                        Excluir
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal aberto={editando !== null} titulo={editando?.id ? 'Editar equipamento' : 'Novo equipamento'} onFechar={() => setEditando(null)}>
        <EquipamentoForm key={editando?.id ?? 'novo'} equipamento={editando?.id ? editando : null} onSalvo={aoSalvar} onCancelar={() => setEditando(null)} />
      </Modal>

      <Modal aberto={reservando !== null} titulo={`Reservar: ${reservando?.nome ?? ''}`} onFechar={() => setReservando(null)}>
        <ReservaForm
          key={reservando?.id}
          equipamentoInicialId={reservando?.id}
          onSalvo={() => {
            setReservando(null);
            toast('Reserva realizada! Veja em "Reservas".');
          }}
          onCancelar={() => setReservando(null)}
        />
      </Modal>

      <ConfirmarExclusao
        aberto={excluindo !== null}
        titulo="Excluir equipamento"
        mensagem={`Tem certeza que deseja excluir "${excluindo?.nome}"? Esta ação não pode ser desfeita.`}
        onConfirmar={confirmarExclusao}
        onFechar={() => setExcluindo(null)}
      />
    </>
  );
}
