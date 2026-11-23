// Cliente HTTP da aplicação: todas as chamadas à API passam por aqui.
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3333').replace(/\/$/, '');
const CHAVE_TOKEN = 'reservas.token';

export class ApiError extends Error {
  constructor(mensagem, status, detalhes = []) {
    super(mensagem);
    this.status = status;
    this.detalhes = detalhes || [];
  }

  // Converte [{ campo, mensagem }] em { campo: mensagem } para exibir nos formulários
  errosPorCampo() {
    return Object.fromEntries(this.detalhes.map((d) => [d.campo, d.mensagem]));
  }
}

export const tokenStorage = {
  obter: () => localStorage.getItem(CHAVE_TOKEN),
  salvar: (token) => localStorage.setItem(CHAVE_TOKEN, token),
  remover: () => localStorage.removeItem(CHAVE_TOKEN),
};

async function requisicao(metodo, caminho, corpo) {
  const token = tokenStorage.obter();
  let resposta;

  try {
    resposta = await fetch(`${API_URL}/api${caminho}`, {
      method: metodo,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
  } catch {
    // fetch só lança erro quando não consegue falar com o servidor (offline, API fora do ar, CORS)
    throw new ApiError('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.', 0);
  }

  const texto = await resposta.text();
  let dados = null;
  try {
    dados = texto ? JSON.parse(texto) : null;
  } catch {
    dados = null;
  }

  if (!resposta.ok) {
    // Token expirado/inválido em uma rota protegida: avisa o AuthContext para encerrar a sessão
    // (só avisa uma vez, mesmo que várias requisições falhem juntas)
    if (resposta.status === 401 && token && tokenStorage.obter() === token) {
      tokenStorage.remover();
      const mensagem = dados?.erro === 'Token inválido.' ? 'Sessão inválida. Faça login novamente.' : dados?.erro;
      window.dispatchEvent(new CustomEvent('sessao-invalida', { detail: mensagem }));
    }
    throw new ApiError(dados?.erro || `Erro ${resposta.status} ao comunicar com o servidor.`, resposta.status, dados?.detalhes);
  }

  return dados;
}

export const api = {
  get: (caminho) => requisicao('GET', caminho),
  post: (caminho, corpo) => requisicao('POST', caminho, corpo),
  put: (caminho, corpo) => requisicao('PUT', caminho, corpo),
  delete: (caminho) => requisicao('DELETE', caminho),
};
