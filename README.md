#  Plataforma Educacional Interativa

Uma plataforma SaaS (Software as a Service) de aprendizado interativo, projetada para permitir que escolas e municípios gerenciem turmas, criem tarefas e acompanhem o progresso dos alunos de forma engajadora e eficiente.

---

##  Stack de Tecnologias

Este projeto é um monorepo gerenciado com `npm`, contendo o backend e o frontend da aplicação.

### Backend

* **Runtime:** [Node.js](https://nodejs.org/)
* **Framework:** [Express.js](https://expressjs.com/pt-br/)
* **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
* **ORM:** [Prisma](https://www.prisma.io/)
* **Banco de Dados:** [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
* **Validação:** [Zod](https://zod.dev/)
* **Autenticação:** JWT (JSON Web Tokens) com `jsonwebtoken` e `bcryptjs`

### Frontend

* **Framework:** [Next.js](https://nextjs.org/)
* **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
* **UI:** [React](https://react.dev/)

---

##  Começando: Configuração do Ambiente

Siga estes passos para configurar e rodar o projeto na sua máquina local.

### Pré-requisitos

* [Node.js](https://nodejs.org/) (versão 18.x ou superior)
* [npm](https://www.npmjs.com/)
* [Git](https://git-scm.com/)

### 1. Clonando o Repositório

```bash
git clone <URL_DO_SEU_REPOSITORIO>
cd plataforma-educacional
```

### 2. Instalando as Dependências

Este é um monorepo. Você precisa instalar as dependências para o backend e para o frontend separadamente.

```bash
# Instalar dependências do Backend
cd backend
npm install

# Voltar para a raiz e instalar dependências do Frontend
cd ../frontend
npm install
```

### 3. Configurando o Banco de Dados (MongoDB Atlas)

Este projeto usa um banco de dados compartilhado na nuvem através do MongoDB Atlas para garantir que toda a equipe trabalhe com os mesmos dados.

1.  **Crie uma Conta:** Se você ainda não tem, crie uma conta gratuita no [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register).
2.  **Peça Acesso:** Peça ao administrador do projeto para te convidar para o projeto "plataforma-educacional" no Atlas.
3.  **Libere seu IP:** Após aceitar o convite, acesse o projeto, vá até a seção **"Network Access"** no menu esquerdo e clique em **"Add Current IP Address"**. Isso permitirá que sua máquina se conecte ao banco de dados.

### 4. Configurando as Variáveis de Ambiente (`.env`)

O arquivo `.env` armazena as chaves secretas e configurações do ambiente. Ele não é enviado para o Git por segurança.

1.  Navegue até a pasta do backend: `cd backend`.
2.  Crie uma cópia do arquivo de exemplo `.env.example` (se ele existir) ou crie um novo arquivo chamado `.env`.
3.  Adicione as seguintes variáveis:

    ```env
    # backend/.env

    # URL de Conexão do MongoDB Atlas
    # Peça esta URL ao administrador do projeto. Ela contém o usuário e a senha.
    DATABASE_URL="mongodb+srv://<user>:<password>@cluster....mongodb.net/plataforma-educacional?retryWrites=true&w=majority"

    # Chave secreta para gerar os tokens de autenticação (JWT)
    # Pode ser qualquer string longa e aleatória
    JWT_SECRET="SEGREDO_ALEATORIO_E_MUITO_SEGURO_PARA_SUA_API"
    ```

### 5. Sincronizando o Prisma Client

Após configurar o `.env`, você precisa garantir que o seu Prisma Client esteja sincronizado com o schema.

```bash
# Dentro da pasta backend/
npx prisma generate
```

### 6. Populando o Banco com Dados Iniciais (Seeding)

Para ter dados iniciais de teste (como usuários admin ou configurações padrão), rode o comando de "seeding":

```bash
# Dentro da pasta backend/
npx prisma db seed
```

---

##  Comandos Úteis

### Rodando a Aplicação em Modo de Desenvolvimento

Você precisará de dois terminais abertos para rodar o backend e o frontend simultaneamente.

**Terminal 1: Rodar o Backend**
```bash
cd backend
npm run dev
```
> 🚀 O servidor da API estará rodando em `http://localhost:3000`.

**Terminal 2: Rodar o Frontend**
```bash
cd frontend
npm run dev
```
> ✨ A aplicação Next.js estará rodando em `http://localhost:3001` (ou outra porta se a 3000 estiver ocupada).

### Comandos do Prisma

Todos os comandos devem ser executados de dentro da pasta `backend/`.

* `npx prisma generate`: Atualiza o Prisma Client após mudanças no `schema.prisma`.
* `npx prisma studio`: Abre uma interface visual no navegador para ver e editar os dados do seu banco.
* `npx prisma db seed`: Popula o banco com os dados definidos em `prisma/seed.ts`.

---

## 📖 Documentação da API (Exemplos)

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `POST` | `/api/instituicoes` | Cria uma nova instituição. |
| `GET` | `/api/instituicoes` | Lista todas as instituições. |

*(Esta seção pode ser expandida conforme a API cresce)*
