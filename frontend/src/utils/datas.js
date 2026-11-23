// Funções de apoio para datas (o input datetime-local trabalha no horário local, sem fuso)

const doisDigitos = (n) => String(n).padStart(2, '0');

// Date/ISO -> "2026-11-25T14:00" (valor aceito pelo <input type="datetime-local">)
export function paraInput(data) {
  const d = new Date(data);
  return `${d.getFullYear()}-${doisDigitos(d.getMonth() + 1)}-${doisDigitos(d.getDate())}T${doisDigitos(d.getHours())}:${doisDigitos(d.getMinutes())}`;
}

// "2026-11-25T14:00" (horário local) -> ISO em UTC para enviar à API
export function paraISO(valorInput) {
  return valorInput ? new Date(valorInput).toISOString() : '';
}

export function formatarDataHora(data) {
  return new Date(data).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export function formatarPeriodo(inicio, fim) {
  const i = new Date(inicio);
  const f = new Date(fim);
  const mesmoDia = i.toDateString() === f.toDateString();
  const hora = (d) => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return mesmoDia
    ? `${i.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })} · ${hora(i)} – ${hora(f)}`
    : `${formatarDataHora(i)} – ${formatarDataHora(f)}`;
}

export function situacaoReserva(reserva, agora = new Date()) {
  if (new Date(reserva.fim) <= agora) return 'encerrada';
  if (new Date(reserva.inicio) <= agora) return 'andamento';
  return 'agendada';
}

// Próxima hora cheia (sugestão de início para uma nova reserva)
export function proximaHoraCheia() {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return d;
}
