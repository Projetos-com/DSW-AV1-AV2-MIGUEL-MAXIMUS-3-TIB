// Erro "esperado" da aplicação: carrega o código HTTP que deve ser devolvido ao cliente
export class AppError extends Error {
  constructor(mensagem, status = 400, detalhes = undefined) {
    super(mensagem);
    this.name = 'AppError';
    this.status = status;
    this.detalhes = detalhes;
  }
}
