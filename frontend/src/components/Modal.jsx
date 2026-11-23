// Janela modal acessível baseada no elemento nativo <dialog>.
import { useEffect, useRef } from 'react';

export default function Modal({ aberto, titulo, onFechar, children, largura = 'max-w-lg' }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (aberto && !dialog.open) dialog.showModal();
    if (!aberto && dialog.open) dialog.close();
  }, [aberto]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault(); // tecla Esc
        onFechar();
      }}
      onClick={(e) => e.target === ref.current && onFechar()} // clique fora
      className={`m-auto w-[calc(100%-2rem)] ${largura} rounded-xl bg-white p-0 shadow-2xl backdrop:bg-slate-900/50 backdrop:backdrop-blur-sm`}
    >
      {aberto && (
        <div className="p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <h2 className="text-lg font-semibold text-slate-900">{titulo}</h2>
            <button onClick={onFechar} className="-m-1 rounded p-1 text-2xl leading-none text-slate-400 hover:text-slate-600" aria-label="Fechar">
              ×
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
