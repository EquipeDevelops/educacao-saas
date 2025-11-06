# Guia de Referência Rápida — Educa+ (`educacao-sassV3`)

## Visão Geral do Produto
- Plataforma SaaS de gestão escolar com foco em quatro perfis: Administrador corporativo, Gestor de unidade, Professor e Aluno.
- Abrange cadastro institucional, organização acadêmica (matrículas, turmas, matérias, horários), acompanhamento pedagógico (tarefas, provas, avaliações parciais, boletim, faltas), comunicação (mensagens, fóruns, comentários) e gamificação (conquistas).
- Oferece painéis específicos para Gestores, Professores e Alunos com métricas, agenda e ações rápidas.
- Inclui módulos complementares: geração de provas com IA (Google Gemini), armazenamento de anexos no Google Drive e controle financeiro (planos, mensalidades, transações, pagamentos).
- Todo o backend registra ações sensíveis em um módulo de auditoria de logs para rastreabilidade.

## Arquitetura Geral
- **Frontend (`frontend/`)**: Next.js 14 (App Router) + React + TypeScript, CSS Modules, `axios` para consumo de APIs, autenticação via contexto, proxies de rota (`src/app/api`) para encapsular chamadas ao backend e gestão de sessão com `cookies` + `localStorage`.
- **Backend (`backend/`)**: Express 5 + TypeScript, Prisma Client (datasource MongoDB), middlewares customizados (auth/JWT, validação com Zod, contexto Prisma para auditoria), serviços externos (Google Drive, Gemini), logging com Winston e upload com Multer.
- **Banco**: MongoDB (ver `backend/prisma/schema.prisma` com ~700 linhas de modelos; os IDs usam `@db.ObjectId`).
- **Integrações**: Google Drive (upload e compartilhamento de arquivos), Google Gemini (gera provas/questões), potencial uso de Google APIs adicionais via `googleapis`.
- **Deploy/Execução**: Projetos separados com `npm`. Backend compila para `dist/`, frontend usa build padrão Next.js. Scripts básicos de start/build e ausência de automação CI/CD nesta base.

## Backend (`backend/`)
### Stack e Configurações
- Scripts em `package.json`: `npm run dev` (ts-node-dev), `npm run build`, `npm start` (usa `dist/server.js`).
- `tsconfig.json` configurado para `src` → `dist`.
- `keepAlive.js` sugere job em produção para manter conexão com o banco.
- Middlewares principais em `src/middlewares/`: `auth.ts` (JWT + controle de papéis), `authorizeSuperAdmin.ts`, `prisma-context.ts` (injeta `req.prismaWithAudit`), `validate.ts` (Zod), `error.ts`.
- Arquitetura em camadas: cada módulo possui arquivos `*.routes.ts`, `*.controller.ts`, `*.service.ts`, `*.validator.ts`.

### Rotas de Topo
- `src/app.ts` registra `cors`, JSON, log global e aplica `protect` + `prismaContextMiddleware` em todas as rotas sob `/api`.
- `src/routes/index.ts` agrega módulos. Principais grupos:
  - **Identidade & Organização**: `auth`, `instituicao`, `unidadeEscolar`, `usuario`, `superadmin`, `professor`, `aluno`, `turma`, `materia`, `componenteCurricular`, `horarioAula`, `bimestre`.
  - **Processos Acadêmicos**: `matricula`, `tarefa`, `questao`, `opcaoMultiplaEscolha`, `submissao`, `respostaSubmissao`, `avaliacaoParcial`, `registroFalta`, `relatorios`.
  - **Dashboards**: `professorDashboard`, `alunoDashboard`, `gestorDashboard`.
  - **Comunicação & Gamificação**: `comentarioTarefa`, `conversa`, `mensagem`, `mensagemForum`, `topicoForum`, `conquista`, `conquistaUsuario`, `conquistasPorUnidade`, `eventos`.
  - **Financeiro**: `financeiro`, `categoriaTransacao`, (modelos relacionados: `Plano`, `Mensalidade`, `Transacao`, `Pagamento`).
  - **Suporte & Auditoria**: `auditLog` (consumo de logs), `geradorProvaIA` (IA generativa), `arquivo` (uploads), `alunoDashboard` (dados agregados).

### Fluxos-Chave
- **Autenticação**: `modules/auth` usa JWT (`JWT_SECRET`, `JWT_EXPIRES_IN`), expõe login, esqueci a senha e reset. Middleware `protect` valida token e papéis.
- **Auditoria**: `middlewares/prisma-context.ts` injeta cliente Prisma com middleware que cria logs (`modules/auditLog/auditLog.service.ts`). Documentação adicional em `README.md` (apesar de problemas de encoding no arquivo).
- **IA**: `modules/geradorProvaIA/geradorProvaIA.service.ts` chama `@google/generative-ai` com `GEMINI_API_KEY`, gera PDF com `pdf-lib`.
- **Arquivos**: `src/services/googleDrive.service.ts` realiza OAuth2 com refresh token e publica arquivos em pasta configurável.
- **Financeiro**: lógica em `financeiro.service.ts` (cálculo de receitas/despesas, inadimplência, conciliação de mensalidades e transações) e modelos Prisma (`Plano`, `Mensalidade`, `Transacao`, `Pagamento`, `CategoriaTransacao`).
- **Dashboards**: agregações específicas para cada papel (`gestorDashboard.routes.ts`, `professorDashboard.routes.ts`, `alunoDashboard.routes.ts`) retornam dados consolidados consumidos pelo frontend.

### Modelo de Dados (Prisma)
- Arquivo: `prisma/schema.prisma`. Destaques:
  - Enumerações: `PapelUsuario`, `StatusPagamento`, `TipoTransacao`, `TipoDeAvaliacao`, `PeriodoAvaliacao`, `TipoEvento`, etc.
  - Macroentidades: `Instituicao` → `Unidades_Escolares` → `Usuarios` (com perfis específicos `Usuarios_aluno`, `Usuarios_professor`), `Materias`, `Turmas`, `Componentes_Curriculares`.
  - Processos pedagógicos: `Tarefas`, `Submissoes`, `Questoes`, `Respostas_Submissoes`, `Avaliacoes_Parciais`, `Registro_Falta`, `Bimestres`.
  - Comunicação: `Conversa`, `Participante`, `Mensagem`, `Topico_Forum`, `Mensagens_Forum`, `ComentarioTarefa`.
  - Gamificação: `Conquistas`, `ConquistasPorUnidade`, `ConquistaUsuario`.
  - Eventos: `EventosCalendario` (relacionados a unidades e turmas).
  - Auditoria: `AuditLog` referencia a unidade escolar, autor e entidade afetada.
  - Financeiro: `Plano`, `Mensalidade`, `Transacao`, `Pagamento`, `CategoriaTransacao`.
  - Outros utilitários: `Arquivos` (metadados de upload), `GeradorProvaIA` opera sobre tarefas/provas via serviços.

## Frontend (`frontend/`)
### Stack e Estrutura
- Next.js App Router (`src/app`), TypeScript, hooks customizados em `src/hooks`, contexto de autenticação em `src/contexts/AuthContext.tsx`.
- CSS Modules (`*.module.css`) e componentes reutilizáveis em `src/components`.
- API layer: `src/services/api.ts` (instância `axios` com `baseURL` de `NEXT_PUBLIC_API_URL`).
- Providers em `src/providers/providers.tsx` encapsulam o `AuthProvider`.
- Assets em `src/assets`, estilos globais em `src/styles/global.css`.

### Organização por Perfis
- Diretórios principais em `src/app/`: `aluno`, `professor`, `gestor`, `administrador`, cada um com páginas (`page.tsx`), layouts dedicados e subrotas (e.g. `aluno/agenda`, `professor/provas/nova`, `gestor/usuarios`).
- Middleware (`src/middleware.ts`) protege rotas: redireciona para `/auth/login` se o cookie `plataforma.token` não existir; rotas públicas limitadas a `/auth/login` e `/auth/forgot-password`.
- Páginas de API (`src/app/api/auth/...`) funcionam como BFF: `POST /api/auth/login` chama o backend, seta cookie httpOnly, devolve token/usuário; `/api/auth/me` busca dados; `/api/auth/logout` limpa sessão.
- Hooks exemplares:
  - `useDashboardAluno` → consome `/aluno/dashboard` e monta cards de agenda, desempenho, tarefas.
  - `useMinhasTarefas` → consome `/tarefas` + `/submissoes`, aplica filtros e paginação client-side.
  - Outros hooks seguem padrão similar para professor/gestor.
- Componentes: dashboards (`components/aluno/dashboard/*`, `components/gestor/dashboard/*`), UI genérica (`loading`, `modal`, `pagination`), mensagens em tempo real (componentes de conversa/mensagens).

### Fluxo de Autenticação
1. Login: formulário em `src/app/auth/login/page.tsx` chama `AuthContext.signIn`.
2. `signIn` usa `/api/auth/login`, salva token no cookie (servidor) e usuário no `localStorage`. Define header `Authorization` em `axios`.
3. Middleware garante redirecionamento se não houver cookie.
4. `AuthContext` tenta recuperar sessão em `useEffect` via `/api/auth/me` e atualiza estado global.
5. Redirecionamento por papel (`ALUNO`, `ADMINISTRADOR`, `PROFESSOR`, `GESTOR`).

### UI e Bibliotecas
- Ícones: `react-icons`.
- Notificações: `react-toastify` (principalmente em páginas do gestor).
- Gráficos: componentes customizados (`ClassPerformanceChart`, `AttendanceChart`), verificar implementação para bibliotecas (ex: `recharts` — confirmar dentro dos componentes quando necessário).
- Uploads/Visualizações: suporte a anexos via Google Drive (consumidos do backend).

## Variáveis de Ambiente Conhecidas
### Backend (`backend/.env`)
- `DATABASE_URL` (MongoDB)
- `PORT`
- `NODE_ENV`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `GEMINI_API_KEY`
- `GOOGLE_DRIVE_CLIENT_ID`
- `GOOGLE_DRIVE_CLIENT_SECRET`
- `GOOGLE_DRIVE_REFRESH_TOKEN`
- `GOOGLE_DRIVE_REDIRECT_URI` (opcional)
- `GOOGLE_DRIVE_FOLDER_NAME` (default `anexos_educacaoSass`)
- Demais variáveis devem ser verificadas conforme integrações adicionais.

### Frontend (`frontend/.env.local`)
- `NEXT_PUBLIC_API_URL` → URL base do backend (ex: `http://localhost:3000/api` se o backend estiver hospedado separadamente; ajustar conforme proxy).

> **Importante:** valores reais não devem ser versionados. O backend faz log de `JWT_SECRET` em `src/server.ts:7` — revisar em produção para não expor segredos.

## Execução Local
1. **Backend**
   - `cd backend`
   - `npm install`
   - Configurar `.env` (copiar de exemplo, se existir, e preencher variáveis acima).
   - `npx prisma generate` (sempre que modificar `schema.prisma`).
   - `npm run dev` para desenvolvimento (porta padrão 3000).
2. **Frontend**
   - `cd frontend`
   - `npm install`
   - Criar `.env.local` com `NEXT_PUBLIC_API_URL` apontando para o backend.
   - `npm run dev` (Next.js em `http://localhost:3000`; ajustar porta se conflitar com backend).

> Em desenvolvimento simultâneo, configure portas diferentes (ex.: backend em 3333) ou use proxy no frontend para encaminhar para `localhost:3000/api`.

## Observações e Pontos de Atenção
- **Encoding:** arquivos como `README.md` e strings em código exibem caracteres corrompidos (ex.: `implementa��ǜo`). Ajustar encoding para UTF-8 ao editar.
- **Logs Sensíveis:** remover `console.log` de segredos em `src/server.ts`.
- **Testes:** não há testes automatizados (`npm test` retorna erro padrão). Avaliar futura cobertura (unitária e integração).
- **Documentação Técnica:** este arquivo deve ser atualizado sempre que módulos ou integrações relevantes forem modificados.
- **Auditoria:** seguir instruções descritas no `README.md` do backend para garantir que novos módulos façam uso de `req.prismaWithAudit`.
- **Integrações Externas:** revisar limites e custos das APIs Google (Drive e Gemini) antes de usar em produção; garantir renovação de tokens de refresh.

