// Mensagens rápidas de sucesso/erro (toasts) disponíveis em toda a aplicação.
import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(null);

const estilos = {
  sucesso: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  erro: 'border-red-200 bg-red-50 text-red-800',
  aviso: 'border-amber-200 bg-amber-50 text-amber-800',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remover = useCallback((id) => setToasts((lista) => lista.filter((t) => t.id !== id)), []);

  const mostrar = useCallback(
    (mensagem, tipo = 'sucesso') => {
      const id = crypto.randomUUID();
      setToasts((lista) => [...lista, { id, mensagem, tipo }]);
      setTimeout(() => remover(id), 4500);
    },
    [remover],
  );

  return (
    <ToastContext.Provider value={mostrar}>
      {children}
      <div aria-live="polite" className="fixed inset-x-4 top-4 z-[60] flex flex-col items-end gap-2 sm:left-auto sm:w-96">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tipo === 'erro' ? 'alert' : 'status'}
            className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg ${estilos[t.tipo]}`}
          >
            <p className="flex-1">{t.mensagem}</p>
            <button onClick={() => remover(t.id)} className="font-bold opacity-60 hover:opacity-100" aria-label="Fechar">
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
