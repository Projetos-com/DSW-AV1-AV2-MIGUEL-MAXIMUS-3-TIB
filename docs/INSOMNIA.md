# Guia do Insomnia – demonstração da AV1

Passo a passo de cada requisição para mostrar ao professor: método, URL, cabeçalho, corpo (Body → JSON) e o resultado esperado.

## Antes de começar

1. Suba a API: na pasta `backend`, rode `npx prisma dev --name reservas --detach` (banco) e depois `npm run dev`.
2. No Insomnia, crie uma **Collection** chamada "Reserva de Equipamentos".
3. **Base URL:**
   - local: `http://localhost:3333/api`
   - publicada: `https://reservas-api-160g.onrender.com/api`
4. Dica: crie um **Environment** (ícone de engrenagem/"Base Environment") com:
   ```json
   {
     "base": "http://localhost:3333/api",
     "tokenUsuario": "",
     "tokenOutro": "",
     "tokenAdmin": ""
   }
   ```
   Assim você escreve `{{ _.base }}/auth/login` em vez da URL inteira e cola os tokens nas variáveis.

**Como enviar o token:** aba **Auth → Bearer Token** e cole o token (ou `{{ _.tokenUsuario }}`). Isso equivale ao cabeçalho `Authorization: Bearer <token>`.

**Datas:** use sempre datas **futuras**. Os exemplos usam 30/11/2026 com `-03:00` (horário de Brasília). Se a data já tiver passado, troque o dia.

> Também dá para importar `docs/postman_collection.json` (Insomnia → Import). As requisições vêm prontas, mas os scripts que salvam o token automaticamente só funcionam no Postman. No Insomnia, copie o token na mão.

---

## 1. Autenticação

### 1.1 Cadastrar usuário → 201
- **POST** `http://localhost:3333/api/auth/cadastro`
- Auth: nenhuma
```json
{
  "nome": "Maria Silva",
  "email": "maria@teste.com",
  "senha": "senha123"
}
```
Resposta: `usuario` (sem a senha) e `token`. **Copie o token para `tokenUsuario`.**
Se o e-mail já existir → **409**. Troque o e-mail, ex.: `maria2@teste.com`.

### 1.2 Cadastrar um segundo usuário → 201
Serve para mostrar que um usuário não mexe na reserva do outro.
- **POST** `http://localhost:3333/api/auth/cadastro`
```json
{
  "nome": "João Souza",
  "email": "joao@teste.com",
  "senha": "senha123"
}
```
**Copie o token para `tokenOutro`.**

### 1.3 Cadastro com dados inválidos → 400
- **POST** `http://localhost:3333/api/auth/cadastro`
```json
{
  "nome": "A",
  "email": "email-invalido",
  "senha": "1"
}
```
Resposta: `"erro": "Dados inválidos."` e a lista `detalhes` com a mensagem de cada campo.

### 1.4 Login do administrador → 200
- **POST** `http://localhost:3333/api/auth/login`
```json
{
  "email": "admin@reservas.local",
  "senha": "SENHA_DO_ADMIN"
}
```
(Use o e-mail e a senha que estão em `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` no seu `.env`.)
**Copie o token para `tokenAdmin`.** A resposta mostra `"papel": "ADMIN"`.

### 1.5 Login com senha errada → 401
- **POST** `http://localhost:3333/api/auth/login`
```json
{
  "email": "admin@reservas.local",
  "senha": "errada"
}
```
Resposta: `"E-mail ou senha incorretos."`

### 1.6 Ver o próprio perfil (uso do JWT) → 200
- **GET** `http://localhost:3333/api/auth/perfil`
- Auth: Bearer `tokenUsuario`

---

## 2. Bloqueios de acesso

### 2.1 Requisição sem token → 401
- **GET** `http://localhost:3333/api/reservas`
- Auth: **nenhuma**

Resposta: `"Token não informado. Faça login."`

### 2.2 Token inválido → 401
- **GET** `http://localhost:3333/api/reservas`
- Auth: Bearer `abc.def.ghi`

### 2.3 Operação não autorizada: usuário comum criando equipamento → 403
- **POST** `http://localhost:3333/api/equipamentos`
- Auth: Bearer `tokenUsuario`
```json
{
  "nome": "Teste",
  "categoria": "Teste",
  "patrimonio": "X-1"
}
```
Resposta: `"Acesso negado: você não tem permissão para esta operação."`

---

## 3. Equipamentos (CRUD feito pelo admin)

### 3.1 Criar (CREATE) → 201
- **POST** `http://localhost:3333/api/equipamentos`
- Auth: Bearer `tokenAdmin`
```json
{
  "nome": "Projetor BenQ",
  "categoria": "Projetor",
  "patrimonio": "PRJ-050",
  "descricao": "Sala 12"
}
```
**Anote o `id` da resposta** (nos exemplos abaixo: `6`).
Enviando de novo com o mesmo patrimônio → **409** ("Já existe um equipamento com o patrimônio PRJ-050").

### 3.2 Listar (READ) → 200
- **GET** `http://localhost:3333/api/equipamentos`
- Auth: Bearer `tokenAdmin` (vê todos) ou `tokenUsuario` (vê só os ativos)

### 3.3 Detalhar um (READ) → 200
- **GET** `http://localhost:3333/api/equipamentos/6`
- Auth: Bearer `tokenUsuario`

Com um id que não existe, ex.: `/equipamentos/9999` → **404**.

### 3.4 Atualizar (UPDATE) → 200
- **PUT** `http://localhost:3333/api/equipamentos/6`
- Auth: Bearer `tokenAdmin`
```json
{
  "nome": "Projetor BenQ MS560",
  "categoria": "Projetor",
  "patrimonio": "PRJ-050",
  "descricao": "Sala 12 - com cabo HDMI",
  "ativo": true
}
```

### 3.5 Agenda do equipamento (horários ocupados) → 200
- **GET** `http://localhost:3333/api/equipamentos/6/agenda`
- Auth: Bearer `tokenUsuario`

A exclusão (DELETE) do equipamento fica para o fim (item 4.10), para mostrar a regra antes.

---

## 4. Reservas e regra de negócio

### 4.1 Criar reserva válida (CREATE) → 201
- **POST** `http://localhost:3333/api/reservas`
- Auth: Bearer `tokenUsuario`
```json
{
  "equipamentoId": 6,
  "inicio": "2026-11-30T14:00:00-03:00",
  "fim": "2026-11-30T15:00:00-03:00",
  "finalidade": "Aula de Matemática"
}
```
**Anote o `id` da reserva** (nos exemplos: `10`).

### 4.2 ⭐ REGRA DE NEGÓCIO: horário sobreposto → 409 (situação bloqueada)
Outro usuário tenta o mesmo equipamento das 14h30 às 16h:
- **POST** `http://localhost:3333/api/reservas`
- Auth: Bearer `tokenOutro`
```json
{
  "equipamentoId": 6,
  "inicio": "2026-11-30T14:30:00-03:00",
  "fim": "2026-11-30T16:00:00-03:00",
  "finalidade": "Palestra"
}
```
Resposta: `"Horário indisponível: o equipamento já está reservado de 30/11/2026, 14:00 até 30/11/2026, 15:00."`

### 4.3 ⭐ REGRA: horário encostado é permitido → 201 (situação aceita)
- **POST** `http://localhost:3333/api/reservas`
- Auth: Bearer `tokenOutro`
```json
{
  "equipamentoId": 6,
  "inicio": "2026-11-30T15:00:00-03:00",
  "fim": "2026-11-30T16:00:00-03:00",
  "finalidade": "Palestra"
}
```
Começa exatamente quando a outra termina, então não há conflito.

### 4.4 Fim antes do início → 422
- **POST** `http://localhost:3333/api/reservas`
- Auth: Bearer `tokenUsuario`
```json
{
  "equipamentoId": 6,
  "inicio": "2026-11-30T18:00:00-03:00",
  "fim": "2026-11-30T17:00:00-03:00",
  "finalidade": "Teste"
}
```

### 4.5 Horário no passado → 422
- **POST** `http://localhost:3333/api/reservas`
- Auth: Bearer `tokenUsuario`
```json
{
  "equipamentoId": 6,
  "inicio": "2020-01-01T10:00:00-03:00",
  "fim": "2020-01-01T11:00:00-03:00",
  "finalidade": "Teste"
}
```

### 4.6 Listar reservas (READ) → 200
- **GET** `http://localhost:3333/api/reservas`
- Com `tokenUsuario`: só as reservas da Maria.
- Com `tokenAdmin`: todas, com o nome de quem reservou.

### 4.7 Atualizar a própria reserva (UPDATE) → 200
- **PUT** `http://localhost:3333/api/reservas/10`
- Auth: Bearer `tokenUsuario`
```json
{
  "equipamentoId": 6,
  "inicio": "2026-11-30T13:00:00-03:00",
  "fim": "2026-11-30T15:00:00-03:00",
  "finalidade": "Aula de Matemática (estendida)"
}
```

### 4.8 ⭐ Operação não autorizada: outro usuário alterando/excluindo → 403
- **PUT** `http://localhost:3333/api/reservas/10`, Auth: Bearer `tokenOutro`, mesmo corpo do 4.7
- **DELETE** `http://localhost:3333/api/reservas/10`, Auth: Bearer `tokenOutro`

Resposta: `"Acesso negado: esta reserva pertence a outro usuário."`

### 4.9 Excluir equipamento que tem reservas → 409
- **DELETE** `http://localhost:3333/api/equipamentos/6`
- Auth: Bearer `tokenAdmin`

Resposta: "...não pode ser excluído. Marque-o como inativo."

### 4.10 Excluir (DELETE) → 204
1. **DELETE** `http://localhost:3333/api/reservas/10` com `tokenUsuario` → **204** (sem corpo).
2. **GET** `http://localhost:3333/api/reservas/10` → **404**, provando que foi apagada.
3. Apague também a reserva do João (item 4.3) com `tokenOutro`.
4. **DELETE** `http://localhost:3333/api/equipamentos/6` com `tokenAdmin` → **204**.

---

## Mostrar a persistência no banco

Em outro terminal, dentro de `backend`:
```
npm run db:studio
```
Abre o Prisma Studio no navegador com as tabelas `usuarios`, `equipamentos` e `reservas`. Mostre os registros criados pelo Insomnia e a coluna `senha_hash` (a senha não aparece em texto puro).

## Resumo rápido

| # | Método | URL | Token | Esperado |
| --- | --- | --- | --- | --- |
| 1 | POST | /auth/cadastro | – | 201 |
| 2 | POST | /auth/login | – | 200 / 401 |
| 3 | GET | /auth/perfil | usuário | 200 |
| 4 | GET | /reservas | nenhum | 401 |
| 5 | POST | /equipamentos | usuário | 403 |
| 6 | POST | /equipamentos | admin | 201 |
| 7 | GET | /equipamentos | qualquer | 200 |
| 8 | PUT | /equipamentos/:id | admin | 200 |
| 9 | POST | /reservas | usuário | 201 |
| 10 | POST | /reservas (mesmo horário) | outro | **409 – regra** |
| 11 | PUT/DELETE | /reservas/:id | outro | 403 |
| 12 | DELETE | /reservas/:id | dono | 204 |
| 13 | DELETE | /equipamentos/:id | admin | 409 (com reservas) / 204 |
