# Roteiro de apresentação – Reserva de Equipamentos

O professor avalia o que for **demonstrado** e se você **entende o código**. Leia este roteiro inteiro antes e ensaie pelo menos uma vez.

## Checklist antes da aula

- [ ] Abrir a API publicada (`/api/saude`) uns 2 minutos antes, para "acordar" o Render.
- [ ] Abrir o site publicado (Vercel) em uma aba e o Postman/Insomnia com a coleção importada em outra.
- [ ] Ter à mão: e-mail/senha do admin e de um usuário comum já cadastrado.
- [ ] Deixar ao menos uma reserva futura cadastrada para demonstrar o conflito.
- [ ] VS Code aberto no projeto, para mostrar os trechos de código.

---

## Parte 1 – AV1: backend (Postman/Insomnia)

### 1. Contexto (1 min)
> "Na escola, projetores e notebooks são compartilhados e acontece de duas turmas precisarem do mesmo equipamento no mesmo horário. Fiz uma API para reservar equipamentos que impede esse conflito. O administrador cadastra os equipamentos e os usuários fazem reservas."

### 2. Estrutura do backend (2 min) – mostrar a pasta `backend/src`
- **routes/** define a URL, o método e quais middlewares rodam antes.
- **controllers/** só recebem a requisição e devolvem a resposta em JSON.
- **services/** têm as regras de negócio (ex.: conflito de horário).
- **models/** são o acesso aos dados: só eles usam o Prisma.
- **middlewares/** fazem a autenticação JWT, a autorização por perfil, a validação e o tratamento de erros.

> "Separei assim para cada camada ter uma responsabilidade. Se eu trocar o banco, mexo só nos models. Se a regra mudar, mexo só no service."

### 3. Modelagem (1 min) – abrir `prisma/schema.prisma`
- Três tabelas: `usuarios`, `equipamentos`, `reservas`.
- Uma reserva pertence a um usuário e a um equipamento (duas chaves estrangeiras).
- `papel` é um enum: ADMIN ou USUARIO. `patrimonio` e `email` são únicos.
- Mostrar a pasta `prisma/migrations`: o histórico do banco fica versionado no repositório.

### 4. Demonstração na ordem da coleção
| Pasta | O que falar |
| --- | --- |
| 1. Autenticação | Cadastro devolve **201** e um token. Mostrar que a resposta **não traz a senha**. Login com senha errada → **401**. |
| 2. Bloqueios | Sem token → **401**. Usuário comum tentando criar equipamento → **403** (não é admin). |
| 3. Equipamentos | CRUD completo com o token do admin. Patrimônio repetido → **409**. |
| 4. Reservas | Reserva válida → **201**. **Outro usuário no mesmo horário → 409 (regra de negócio)**. Fim antes do início → **422**. Outro usuário tentando alterar/excluir → **403**. Excluir a própria reserva → **204**. |

Para mostrar a **persistência**: rode `npx prisma studio` (ou `npm run db:studio`) e mostre os registros gravados nas tabelas.

Para mostrar o **JWT**: copie um token e cole em [jwt.io](https://jwt.io). Aparecem `sub` (id do usuário), `nome`, `papel` e `exp` (expiração). Explique que o token é **assinado** com o `JWT_SECRET`: se alguém alterar o papel para ADMIN, a assinatura deixa de valer e a API responde 401.

Para mostrar o **hash**: no Prisma Studio, a coluna `senha_hash` tem algo como `$2b$10$...`, e não a senha em texto.

---

## Parte 2 – AV2: frontend e publicação (site publicado)

1. **Contexto:** problema, público-alvo e solução (o mesmo da Parte 1).
2. **Cadastro** de um usuário novo → entra direto e aparece o toast "Conta criada".
3. **Logout** (botão Sair) → tentar abrir `/reservas` digitando a URL → volta para o login (página protegida).
4. **Login** como usuário comum: só aparecem equipamentos ativos e não há botões de editar/excluir.
5. **Reservar** um equipamento: o formulário mostra os **horários já reservados**.
6. **Regra de negócio:** tentar reservar o mesmo horário → aparece "Horário indisponível…" (mensagem vinda da API).
7. **Editar e cancelar** a própria reserva na página Reservas.
8. **Login como admin:** vê o equipamento "Em manutenção", cria, edita e exclui equipamentos. Tentar excluir o projetor que tem reserva → mensagem de bloqueio. Em Reservas, o admin vê a coluna "Reservado por".
9. **Erros:** enviar formulário vazio (validação), senha errada no login. Para sessão inválida: F12 → Application → Local Storage → altere `reservas.token` → clique em algo → "Sessão inválida. Faça login novamente."
10. **Responsividade:** F12 → modo celular: o menu vira hambúrguer e a tabela vira cartões.

---

## Trechos de código que o professor pode pedir

### Regra de negócio – `backend/src/models/reserva.model.js` → `buscarConflito`
```js
inicio: { lt: fim },   // reserva existente começa antes do fim da nova
fim: { gt: inicio },   // e termina depois do início da nova
```
> "Dois horários se sobrepõem quando um começa antes do outro terminar. Se 14h–15h já existe, 14h30–16h conflita, mas 15h–16h não, porque começa exatamente quando a outra termina."

Em `services/reserva.service.js`, `gravarSemConflito` faz a busca e a gravação **dentro de uma transação** `Serializable`. Assim, duas pessoas clicando ao mesmo tempo não conseguem as duas reservar o mesmo horário.

### Hash da senha – `services/auth.service.js`
- `bcrypt.hash(senha, 10)` no cadastro. O 10 é o custo: quanto maior, mais lento para um atacante testar senhas.
- `bcrypt.compare(senha, usuario.senhaHash)` no login.
- A mensagem é a mesma para e-mail ou senha errados, para não revelar se o e-mail existe.

### Geração e validação do JWT
- Geração: `jwt.sign({ nome, papel }, JWT_SECRET, { subject: id, expiresIn: '8h' })`.
- Validação: `middlewares/autenticacao.js` → `autenticar` lê `Authorization: Bearer ...`, roda `jwt.verify` e coloca o usuário em `req.usuario`. Token expirado → "Sessão expirada".

### Autorização (dois tipos)
- **Por perfil:** `autorizar('ADMIN')` na rota de equipamentos → 403 para quem não é admin.
- **Por dono do registro:** `verificarPermissao` em `reserva.service.js` → só o dono ou o admin podem mexer na reserva.

### Validação × regra de negócio
- **Validação** (`validators/schemas.js`, Zod) verifica formato: campo obrigatório, e-mail válido, data válida → **400**.
- **Regra de negócio** (services) verifica se a operação faz sentido no sistema: horário ocupado, horário no passado → **409/422**.

### Tratamento de erros – `middlewares/tratarErros.js`
O Express 5 envia para esse middleware qualquer erro lançado nas funções `async`. `AppError` leva o código HTTP correto; erros desconhecidos viram 500 sem expor detalhes internos.

### Variáveis de ambiente
`config/env.js` lê o `.env`. O `.env` está no `.gitignore`; no repositório só existe o `.env.example`, sem valores secretos. Em produção, as variáveis ficam no painel do Render e da Vercel.

### Prisma 7
- `prisma.config.ts` diz onde estão o schema e as migrations e lê a `DATABASE_URL`.
- No Prisma 7 o client usa um **driver adapter** (`@prisma/adapter-pg`), criado em `src/lib/prisma.js`.
- O client é gerado em `src/generated/prisma` pelo `prisma generate` (roda automaticamente no `npm install`).

### Frontend
- **`services/api.js`**: todas as chamadas passam por aqui. Ele coloca o token no cabeçalho, transforma erro da API em `ApiError` e, se receber 401, dispara o evento `sessao-invalida`.
- **`contexts/AuthContext.jsx`**: guarda o usuário logado; `entrar`, `cadastrar` e `logout`. Ao abrir o site, confirma o token com `/auth/perfil`.
- **`components/RotaProtegida.jsx`**: sem usuário logado, redireciona para `/login`.
- **Permissões na tela:** `ehAdmin` decide se aparecem os botões de editar/excluir. A segurança de verdade continua na API: esconder o botão é só para a experiência do usuário.
- **Estados:** `carregando` (spinner), `erro` (alerta com "Tentar novamente") e lista vazia (`EstadoVazio`).
- **Tailwind 4.3:** não tem `tailwind.config.js`. O CSS começa com `@import "tailwindcss"`, as cores da marca ficam em `@theme` e as classes próprias (`btn-primario`, `campo`) em `@utility` (`src/index.css`).

---

## Perguntas prováveis

- **Por que PostgreSQL?** É relacional, gratuito e o Render oferece hospedagem.
- **Onde fica o token no frontend?** No `localStorage`. Ele expira em 8 horas e a API valida a assinatura a cada requisição.
- **E se alguém chamar a API direto, sem usar o site?** A API valida token, perfil, dono e regras por conta própria. O frontend só melhora a experiência.
- **Por que 409 e 422?** 409 indica conflito com o estado atual (horário ocupado, valor repetido). 422 indica dados com formato válido mas que violam uma regra (fim antes do início, horário no passado).
- **Por que não excluir equipamento com reservas?** Para não perder o histórico de uso. A opção é marcá-lo como inativo.
