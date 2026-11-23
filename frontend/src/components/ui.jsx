// Pequenos componentes visuais reutilizados em várias telas.

export function Spinner({ className = 'size-5' }) {
  return (
    <svg className={`animate-spin text-current ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
    </svg>
  );
}

export function Carregando({ texto = 'Carregando...' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-slate-500" role="status">
      <Spinner />
      <span>{texto}</span>
    </div>
  );
}

export function EstadoVazio({ titulo, descricao, acao }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white px-6 py-14 text-center">
      <svg className="mx-auto size-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m6 4.125 2.25 2.25m0 0 2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
      </svg>
      <h3 className="mt-3 font-semibold text-slate-700">{titulo}</h3>
      {descricao && <p className="mt-1 text-sm text-slate-500">{descricao}</p>}
      {acao && <div className="mt-5">{acao}</div>}
    </div>
  );
}

export function Alerta({ tipo = 'erro', children, acao }) {
  const cores = {
    erro: 'border-red-200 bg-red-50 text-red-800',
    aviso: 'border-amber-200 bg-amber-50 text-amber-800',
    info: 'border-sky-200 bg-sky-50 text-sky-800',
  };
  return (
    <div role="alert" className={`flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3 text-sm ${cores[tipo]}`}>
      <p className="flex-1">{children}</p>
      {acao}
    </div>
  );
}

// Campo de formulário com rótulo e mensagem de erro
export function Campo({ rotulo, erro, id, children, dica }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
        {rotulo}
      </label>
      {children}
      {dica && !erro && <p className="mt-1 text-xs text-slate-500">{dica}</p>}
      {erro && <p className="mt-1 text-xs font-medium text-red-600">{erro}</p>}
    </div>
  );
}

export function Selo({ cor = 'slate', children }) {
  const cores = {
    slate: 'bg-slate-100 text-slate-700 ring-slate-200',
    verde: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    azul: 'bg-marca-50 text-marca-700 ring-marca-100',
    ambar: 'bg-amber-50 text-amber-700 ring-amber-200',
    vermelho: 'bg-red-50 text-red-700 ring-red-200',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cores[cor]}`}>
      {children}
    </span>
  );
}
