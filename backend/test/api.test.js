// Testes de ponta a ponta da API (rodam contra o banco configurado no .env).
// Uso: npm test   (precisa do banco rodando e do seed aplicado)
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

let servidor;
let base;
const sufixo = Date.now();

async function chamar(metodo, caminho, { token, corpo } = {}) {
  const resposta = await fetch(`${base}${caminho}`, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  const texto = await resposta.text();
  return { status: resposta.status, dados: texto ? JSON.parse(texto) : null };
}

// Datas futuras fixas (amanhã às 14h e às 15h, em UTC)
const amanha = new Date(Date.now() + 24 * 60 * 60 * 1000);
const hora = (h, m = 0) => {
  const d = new Date(amanha);
  d.setUTCHours(h, m, 0, 0);
  return d.toISOString();
};

let tokenAdmin;
let tokenAna;
let tokenBruno;
let equipamentoId;
let reservaAnaId;

before(async () => {
  servidor = app.listen(0);
  base = `http://localhost:${servidor.address().port}/api`;
});

after(async () => {
  await prisma.reserva.deleteMany({ where: { equipamentoId } });
  await prisma.equipamento.deleteMany({ where: { patrimonio: { startsWith: 'TST-' } } });
  await prisma.usuario.deleteMany({ where: { email: { contains: `.${sufixo}@teste.com` } } });
  await prisma.$disconnect();
  servidor.close();
});

describe('Autenticação', () => {
  it('cadastra usuários e devolve JWT (201)', async () => {
    const ana = await chamar('POST', '/auth/cadastro', {
      corpo: { nome: 'Ana Teste', email: `ana.${sufixo}@teste.com`, senha: 'senha123' },
    });
    assert.equal(ana.status, 201);
    assert.ok(ana.dados.token);
    assert.equal(ana.dados.usuario.papel, 'USUARIO');
    assert.equal(ana.dados.usuario.senhaHash, undefined);
    tokenAna = ana.dados.token;

    const bruno = await chamar('POST', '/auth/cadastro', {
      corpo: { nome: 'Bruno Teste', email: `bruno.${sufixo}@teste.com`, senha: 'senha123' },
    });
    tokenBruno = bruno.dados.token;
  });

  it('recusa e-mail repetido (409) e dados inválidos (400)', async () => {
    const repetido = await chamar('POST', '/auth/cadastro', {
      corpo: { nome: 'Ana Teste', email: `ana.${sufixo}@teste.com`, senha: 'senha123' },
    });
    assert.equal(repetido.status, 409);

    const invalido = await chamar('POST', '/auth/cadastro', { corpo: { nome: 'A', email: 'x', senha: '1' } });
    assert.equal(invalido.status, 400);
    assert.equal(invalido.dados.detalhes.length, 3);
  });

  it('faz login do admin e recusa senha errada (401)', async () => {
    const ok = await chamar('POST', '/auth/login', {
      corpo: { email: process.env.SEED_ADMIN_EMAIL, senha: process.env.SEED_ADMIN_PASSWORD },
    });
    assert.equal(ok.status, 200);
    assert.equal(ok.dados.usuario.papel, 'ADMIN');
    tokenAdmin = ok.dados.token;

    const errado = await chamar('POST', '/auth/login', {
      corpo: { email: process.env.SEED_ADMIN_EMAIL, senha: 'errada' },
    });
    assert.equal(errado.status, 401);
  });

  it('bloqueia requisição sem token ou com token inválido (401)', async () => {
    assert.equal((await chamar('GET', '/reservas')).status, 401);
    assert.equal((await chamar('GET', '/reservas', { token: 'abc.def.ghi' })).status, 401);
  });
});

describe('Equipamentos (CRUD do admin)', () => {
  it('usuário comum não pode criar equipamento (403)', async () => {
    const r = await chamar('POST', '/equipamentos', {
      token: tokenAna,
      corpo: { nome: 'X', categoria: 'Y', patrimonio: `TST-${sufixo}` },
    });
    assert.equal(r.status, 403);
  });

  it('admin cria, consulta e atualiza', async () => {
    const criado = await chamar('POST', '/equipamentos', {
      token: tokenAdmin,
      corpo: { nome: 'Projetor de Teste', categoria: 'Projetor', patrimonio: `tst-${sufixo}` },
    });
    assert.equal(criado.status, 201);
    assert.equal(criado.dados.patrimonio, `TST-${sufixo}`);
    equipamentoId = criado.dados.id;

    const repetido = await chamar('POST', '/equipamentos', {
      token: tokenAdmin,
      corpo: { nome: 'Outro', categoria: 'Projetor', patrimonio: `TST-${sufixo}` },
    });
    assert.equal(repetido.status, 409);

    const lista = await chamar('GET', '/equipamentos', { token: tokenAna });
    assert.ok(lista.dados.some((e) => e.id === equipamentoId));

    const atualizado = await chamar('PUT', `/equipamentos/${equipamentoId}`, {
      token: tokenAdmin,
      corpo: { nome: 'Projetor de Teste 2', categoria: 'Projetor', patrimonio: `TST-${sufixo}`, ativo: true },
    });
    assert.equal(atualizado.status, 200);
    assert.equal(atualizado.dados.nome, 'Projetor de Teste 2');
  });
});

describe('Reservas e regra de negócio', () => {
  it('cria uma reserva válida (201)', async () => {
    const r = await chamar('POST', '/reservas', {
      token: tokenAna,
      corpo: { equipamentoId, inicio: hora(14), fim: hora(15), finalidade: 'Aula de História' },
    });
    assert.equal(r.status, 201, JSON.stringify(r.dados));
    reservaAnaId = r.dados.id;
  });

  it('BLOQUEIA reserva com horário sobreposto no mesmo equipamento (409)', async () => {
    const r = await chamar('POST', '/reservas', {
      token: tokenBruno,
      corpo: { equipamentoId, inicio: hora(14, 30), fim: hora(16), finalidade: 'Palestra' },
    });
    assert.equal(r.status, 409);
    assert.match(r.dados.erro, /Horário indisponível/);
  });

  it('ACEITA reserva que começa exatamente quando a outra termina (201)', async () => {
    const r = await chamar('POST', '/reservas', {
      token: tokenBruno,
      corpo: { equipamentoId, inicio: hora(15), fim: hora(16), finalidade: 'Palestra' },
    });
    assert.equal(r.status, 201);
  });

  it('recusa fim antes do início e horário no passado (422)', async () => {
    const invertido = await chamar('POST', '/reservas', {
      token: tokenAna,
      corpo: { equipamentoId, inicio: hora(18), fim: hora(17), finalidade: 'Teste' },
    });
    assert.equal(invertido.status, 422);

    const passado = await chamar('POST', '/reservas', {
      token: tokenAna,
      corpo: { equipamentoId, inicio: '2020-01-01T10:00:00Z', fim: '2020-01-01T11:00:00Z', finalidade: 'Teste' },
    });
    assert.equal(passado.status, 422);
  });

  it('usuário vê apenas as próprias reservas; admin vê todas', async () => {
    const daAna = await chamar('GET', '/reservas', { token: tokenAna });
    assert.ok(daAna.dados.every((r) => r.usuario.email === `ana.${sufixo}@teste.com`));

    const doAdmin = await chamar('GET', '/reservas', { token: tokenAdmin });
    assert.ok(doAdmin.dados.length >= 2);
  });

  it('BLOQUEIA alterar/excluir reserva de outro usuário (403)', async () => {
    const alterar = await chamar('PUT', `/reservas/${reservaAnaId}`, {
      token: tokenBruno,
      corpo: { equipamentoId, inicio: hora(14), fim: hora(15), finalidade: 'Invasão' },
    });
    assert.equal(alterar.status, 403);
    assert.equal((await chamar('DELETE', `/reservas/${reservaAnaId}`, { token: tokenBruno })).status, 403);
  });

  it('dono altera a própria reserva (200)', async () => {
    const r = await chamar('PUT', `/reservas/${reservaAnaId}`, {
      token: tokenAna,
      corpo: { equipamentoId, inicio: hora(13), fim: hora(15), finalidade: 'Aula de História (estendida)' },
    });
    assert.equal(r.status, 200, JSON.stringify(r.dados));
  });

  it('não exclui equipamento com reservas (409); exclui reserva (204)', async () => {
    assert.equal((await chamar('DELETE', `/equipamentos/${equipamentoId}`, { token: tokenAdmin })).status, 409);
    assert.equal((await chamar('DELETE', `/reservas/${reservaAnaId}`, { token: tokenAna })).status, 204);
    assert.equal((await chamar('GET', `/reservas/${reservaAnaId}`, { token: tokenAna })).status, 404);
  });
});
