import { useState } from 'react';
import Modal from './Modal.jsx';
import { Alerta, Spinner } from './ui.jsx';

// Pede confirmação antes de excluir. "onConfirmar" deve ser uma função async.
export default function ConfirmarExclusao({ aberto, titulo, mensagem, onConfirmar, onFechar }) {
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState('');

  async function confirmar() {
    setExcluindo(true);
    setErro('');
    try {
      await onConfirmar();
    } catch (e) {
      setErro(e.message);
    } finally {
      setExcluindo(false);
    }
  }

  function fechar() {
    setErro('');
    onFechar();
  }

  return (
    <Modal aberto={aberto} titulo={titulo} onFechar={fechar} largura="max-w-md">
      <p className="text-sm text-slate-600">{mensagem}</p>
      {erro && (
        <div className="mt-4">
          <Alerta>{erro}</Alerta>
        </div>
      )}
      <div className="mt-6 flex justify-end gap-3">
        <button className="btn-secundario" onClick={fechar} disabled={excluindo}>
          Cancelar
        </button>
        <button className="btn-perigo" onClick={confirmar} disabled={excluindo}>
          {excluindo && <Spinner className="size-4" />} Excluir
        </button>
      </div>
    </Modal>
  );
}
