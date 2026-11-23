# Reserva de Equipamentos

Aplicação web full stack para **reservar equipamentos compartilhados da escola** (projetores, notebooks, caixas de som, câmeras, kits de robótica).

**Problema:** hoje professores e alunos combinam o uso dos equipamentos "de boca" ou em planilhas. Duas turmas acabam precisando do mesmo projetor no mesmo horário, e ninguém sabe quem está com o quê.

**Público-alvo:** professores, alunos e a coordenação/TI que cuida dos equipamentos.

**Solução:** o administrador cadastra os equipamentos; cada usuário consulta os horários livres e reserva. O sistema **impede reservas com horários sobrepostos para o mesmo equipamento**.

> Trabalho de DSW – AV1 (backend) e AV2 (frontend e publicação) – 4º bimestre.
> Aluno: **Miguel Maximus** – 3º TIB.

- **Aplicação publicada (Vercel):** https://reserva-equipamentos-miguel.vercel.app
- **API publicada (Render):** https://reservas-api-160g.onrender.com/api (teste: [`/api/saude`](https://reservas-api-160g.onrender.com/api/saude))
- **Banco de dados:** PostgreSQL gerenciado no Render (`reservas-db`), acessado só pela API.

> A API usa o plano gratuito do Render e "dorme" após 15 min sem uso: o primeiro acesso pode demorar até 1 minuto.

---

## Tecnologias e versões

| Camada | Tecnologia | Versão |
| --- | --- | --- |
| Backend | Node.js | 24.x (mínimo 22.18) |
| Backend | Express (arquitetura MVC) | 5.x |
| ORM | **Prisma** (`prisma` e `@prisma/client`) | **7.10.0** (fixado, sem `^`/`~`) |
| ORM | `@prisma/adapter-pg` (driver adapter do Prisma 7) | 7.10.0 |
| Banco | PostgreSQL (relacional) | 16+ |
| Autenticação | `jsonwebtoken` (JWT) + `bcryptjs` (hash de senha) | 9.x / 3.x |
| Validação | Zod | 4.x |
| Frontend | React + React Router | 19.x / 7.x |
| Frontend | **Tailwind CSS** (`tailwindcss` e `@tailwindcss/vite`) | **4.3.0** (fixado, sem `^`/`~`) |
| Build | Vite | 8.x |
| Deploy | Render (API + PostgreSQL) e Vercel (frontend) | – |

---

## Estrutura do projeto

```
reserva-equipamentos/
├── backend/                     API REST (AV1)
│   ├── prisma/
│   │   ├── schema.prisma        modelagem do banco
│   │   ├── migrations/          migrations versionadas
│   │   └── seed.js              cria o admin e equipamentos de exemplo
│   ├── prisma.config.ts         configuração do Prisma 7 (lê DATABASE_URL)
│   ├── src/
│   │   ├── server.js            sobe o servidor
│   │   ├── app.js               Express: CORS, JSON, rotas, erros
│   │   ├── config/env.js        variáveis de ambiente
│   │   ├── lib/prisma.js        instância do Prisma Client
│   │   ├── routes/              ROTAS: URL + middlewares + controller
│   │   ├── controllers/         CONTROLLERS: recebem req, devolvem JSON
│   │   ├── services/            REGRAS DE NEGÓCIO
│   │   ├── models/              ACESSO AOS DADOS (consultas Prisma)
│   │   ├── middlewares/         autenticação JWT, autorização, validação, erros
│   │   ├── validators/          schemas Zod (formato dos dados)
│   │   └── utils/AppError.js    erro com código HTTP
│   └── test/api.test.js         testes automáticos de ponta a ponta
├── frontend/                    interface React (AV2)
│   └── src/
│       ├── services/api.js      cliente HTTP (fetch + token JWT + erros)
│       ├── contexts/            AuthContext (sessão) e ToastContext (mensagens)
│       ├── components/          Layout, RotaProtegida, Modal, formulários, ui
│       ├── pages/               Login, Cadastro, Equipamentos, Reservas
│       └── utils/datas.js       formatação de datas
├── docs/
│   ├── INSOMNIA.md              requisições para a demonstração no Insomnia
│   ├── postman_collection.json  coleção para demonstrar a API
│   └── ROTEIRO-APRESENTACAO.md  roteiro da apresentação
└── render.yaml                  blueprint de deploy no Render
```

**Fluxo de uma requisição (MVC):** `rota` → `middlewares` (JWT, perfil, validação) → `controller` → `service` (regras) → `model` (Prisma) → banco.

---

## Modelagem do banco

```
usuarios (1) ──────< (N) reservas (N) >────── (1) equipamentos
```

| Tabela | Campos principais |
| --- | --- |
| `usuarios` | id, nome, email (único), senha_hash, papel (`ADMIN` / `USUARIO`), criado_em |
| `equipamentos` | id, nome, categoria, patrimonio (único), descricao, ativo, criado_em, atualizado_em |
| `reservas` | id, inicio, fim, finalidade, usuario_id (FK), equipamento_id (FK), criado_em, atualizado_em |

Índice em `reservas (equipamento_id, inicio, fim)` para acelerar a busca de conflitos.

---

## Regras de negócio

1. **Principal:** não é permitido reservar um equipamento em um horário que se sobreponha a outra reserva do mesmo equipamento (`409 Conflict`). Dois intervalos se sobrepõem quando `inicioExistente < fimNovo` **e** `fimExistente > inicioNovo`; uma reserva pode começar exatamente quando a anterior termina. A verificação e a gravação ocorrem na mesma transação `Serializable`.
2. O fim deve ser posterior ao início; não é possível reservar horários passados; duração máxima de 8 horas (`422`).
3. Equipamento inativo (em manutenção) não pode ser reservado (`422`).
4. Equipamento com reservas registradas não pode ser excluído; deve ser marcado como inativo (`409`).
5. Reservas já encerradas não podem ser alteradas (`422`).

## Controle de acesso

| Ação | Visitante | USUARIO | ADMIN |
| --- | --- | --- | --- |
| Cadastro e login | ✅ | – | – |
| Listar/consultar equipamentos | ❌ 401 | ✅ (somente ativos) | ✅ (todos) |
| Criar/editar/excluir equipamentos | ❌ 401 | ❌ 403 | ✅ |
| Criar reserva | ❌ 401 | ✅ | ✅ |
| Listar reservas | ❌ 401 | ✅ somente as próprias | ✅ todas |
| Editar/excluir reserva | ❌ 401 | ✅ somente as próprias (outra → 403) | ✅ qualquer uma |

Todo cadastro público recebe o perfil `USUARIO`. O `ADMIN` é criado pelo seed.

---

## Como executar localmente

Pré-requisito: **Node.js 22.18 ou superior** (recomendado 24). Não é preciso instalar o PostgreSQL: o próprio Prisma fornece um Postgres local com `prisma dev`.

### 1. Backend

```bash
cd backend
npm install                    # instala dependências e gera o Prisma Client
cp .env.example .env           # no Windows: copy .env.example .env
```

Banco local (deixe este terminal aberto, ou use `--detach`):

```bash
npx prisma dev --name reservas --detach
```

O comando mostra uma URL **TCP** do tipo `postgres://postgres:postgres@localhost:51214/template1?sslmode=disable`. Coloque-a em `DATABASE_URL` no `.env` e preencha `JWT_SECRET`, `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD`. Também é possível usar qualquer PostgreSQL já instalado.

```bash
npm run db:migrate             # aplica as migrations (prisma migrate dev)
npm run db:seed                # cria o administrador e equipamentos de exemplo
npm run dev                    # API em http://localhost:3333
npm test                       # (opcional) 14 testes automáticos da API
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env           # VITE_API_URL=http://localhost:3333
npm run dev                    # http://localhost:5173
```

### Variáveis de ambiente

**backend/.env** (veja `backend/.env.example`)

| Variável | Descrição |
| --- | --- |
| `DATABASE_URL` | URL de conexão do PostgreSQL |
| `JWT_SECRET` | segredo para assinar os tokens (texto longo e aleatório) |
| `JWT_EXPIRES_IN` | validade do token, ex.: `8h` |
| `PORT` | porta da API (padrão 3333) |
| `CORS_ORIGIN` | URL(s) do frontend, separadas por vírgula |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | credenciais do administrador criado pelo seed |

**frontend/.env** (veja `frontend/.env.example`)

| Variável | Descrição |
| --- | --- |
| `VITE_API_URL` | URL da API, sem `/api` e sem barra final. É pública: nunca coloque segredos aqui. |

Os arquivos `.env` estão no `.gitignore` e **não vão para o repositório**.

---

## Rotas da API

Base: `/api`. Rotas protegidas exigem o cabeçalho `Authorization: Bearer <token>`.

| Método | Rota | Acesso | Descrição |
| --- | --- | --- | --- |
| GET | `/saude` | público | verifica se a API está no ar |
| POST | `/auth/cadastro` | público | cria usuário `{ nome, email, senha }` → `201 { usuario, token }` |
| POST | `/auth/login` | público | `{ email, senha }` → `200 { usuario, token }` |
| GET | `/auth/perfil` | logado | dados do usuário do token |
| GET | `/equipamentos` | logado | lista (usuário comum vê só os ativos) |
| GET | `/equipamentos/:id` | logado | detalha um equipamento |
| GET | `/equipamentos/:id/agenda` | logado | horários futuros já reservados (sem dados pessoais) |
| POST | `/equipamentos` | ADMIN | cria `{ nome, categoria, patrimonio, descricao?, ativo? }` |
| PUT | `/equipamentos/:id` | ADMIN | atualiza |
| DELETE | `/equipamentos/:id` | ADMIN | exclui (bloqueado se tiver reservas) |
| GET | `/reservas` | logado | próprias reservas (ADMIN: todas) |
| GET | `/reservas/:id` | dono/ADMIN | detalha |
| POST | `/reservas` | logado | cria `{ equipamentoId, inicio, fim, finalidade }` (datas ISO 8601) |
| PUT | `/reservas/:id` | dono/ADMIN | altera |
| DELETE | `/reservas/:id` | dono/ADMIN | cancela/exclui |

**Códigos de resposta:** `200` OK · `201` criado · `204` excluído · `400` dados inválidos (com `detalhes` por campo) · `401` sem token/token inválido/expirado · `403` sem permissão · `404` não encontrado · `409` conflito (horário ocupado, e-mail/patrimônio repetido) · `422` regra de negócio violada · `500` erro interno.

Exemplo de erro de validação:

```json
{ "erro": "Dados inválidos.", "detalhes": [{ "campo": "email", "mensagem": "E-mail inválido." }] }
```

**Demonstração no Insomnia:** o guia [`docs/INSOMNIA.md`](docs/INSOMNIA.md) traz cada requisição (método, URL, token, corpo JSON e resposta esperada) na ordem da apresentação. A coleção `docs/postman_collection.json` tem as mesmas requisições para o Postman, onde tokens e IDs são salvos automaticamente.

---

## Publicação (deploy)

### Backend + banco no Render

1. Envie o repositório para o GitHub.
2. No Render: **New → Blueprint**, selecione o repositório. O `render.yaml` cria o PostgreSQL `reservas-db` e o web service `reservas-api` (pasta `backend`).
3. Preencha as variáveis pedidas: `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` e `CORS_ORIGIN` (URL da Vercel; pode ajustar depois). O `JWT_SECRET` é gerado automaticamente e o `DATABASE_URL` vem do banco.
4. Build: `npm ci && npm run db:deploy && npm run db:seed` (instala, aplica as migrations e cria o admin). Start: `npm start`.
5. Teste: `https://SEU-SERVICO.onrender.com/api/saude` → `{ "status": "ok" }`.

> Sem Blueprint: crie um PostgreSQL no Render (ou no Neon) e um Web Service com Root Directory `backend`, os mesmos comandos e as variáveis da tabela acima.
> No plano gratuito a API "dorme" após 15 minutos sem uso; a primeira requisição pode levar até 1 minuto. Abra a URL antes da apresentação.

### Frontend na Vercel

1. **Add New → Project**, importe o repositório e defina **Root Directory = `frontend`** (Vite é detectado automaticamente).
2. Variável de ambiente: `VITE_API_URL = https://SEU-SERVICO.onrender.com`.
3. Deploy. O `vercel.json` redireciona todas as rotas para o `index.html` (necessário para o React Router).
4. Volte ao Render e coloque a URL da Vercel em `CORS_ORIGIN` (ex.: `https://reservas.vercel.app`).

---

## Fontes de componentes e recursos de terceiros

- Os componentes de interface (cartões, tabela, modal, formulários, menu, toasts) foram escritos para este projeto com classes utilitárias do **Tailwind CSS 4.3**, usando o elemento nativo `<dialog>` no modal.
- Ícones SVG: [Heroicons](https://heroicons.com) (licença MIT), da equipe do Tailwind CSS: `archive-box-x-mark`, `bars-3` e `x-mark`.
- Fonte: [Inter](https://fonts.google.com/specimen/Inter) via Google Fonts (SIL Open Font License).

## Usuário administrador de teste (local)

Criado pelo seed com os valores de `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` do `.env`. No `.env.example` esses campos ficam vazios. Em produção use uma senha diferente da local.
