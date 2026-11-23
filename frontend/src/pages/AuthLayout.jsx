// Moldura visual das telas de login e cadastro.
export default function AuthLayout({ titulo, subtitulo, children, rodape }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-marca-700 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3 text-lg font-semibold">
          <img src="/icone.svg" alt="" className="size-10 rounded-lg ring-2 ring-white/20" />
          Reserva de Equipamentos
        </div>
        <div>
          <h2 className="text-3xl leading-tight font-bold">Projetor, notebook ou câmera: reserve antes de chegar na sala.</h2>
          <p className="mt-4 max-w-md text-marca-100">
            Veja os horários livres, faça sua reserva em segundos e evite o conflito de duas turmas precisando do mesmo
            equipamento.
          </p>
        </div>
        <p className="text-sm text-marca-100">Projeto de DSW – 4º bimestre</p>
        <div className="pointer-events-none absolute -right-24 -bottom-24 size-96 rounded-full bg-white/5" />
      </aside>

      <section className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <img src="/icone.svg" alt="" className="mb-6 size-12 lg:hidden" />
          <h1 className="text-2xl font-bold text-slate-900">{titulo}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitulo}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-6 text-center text-sm text-slate-600">{rodape}</p>
        </div>
      </section>
    </div>
  );
}
