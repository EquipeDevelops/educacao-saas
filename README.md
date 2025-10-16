# Implementação do Módulo de Auditoria de Logs

Este guia detalha como estender o sistema de auditoria de logs para qualquer módulo do backend. O objetivo é registrar todas as operações de criação, atualização e exclusão (`CREATE`, `UPDATE`, `DELETE`) realizadas no sistema, fornecendo ao gestor da escola um controle completo sobre as ações dos usuários.

## Pré-requisitos

Antes de começar, garanta que os seguintes arquivos de middleware e serviço já estejam configurados em seu projeto, pois eles são a base do sistema de auditoria:

1.  **`middlewares/auth.ts`**: Deve ser capaz de autenticar um usuário e anexar um objeto `user` ao `req`, contendo `id`, `nome`, e `unidadeEscolarId`.
2.  **`middlewares/prisma-context.ts`**: Responsável por criar uma instância do Prisma Client com o middleware de auditoria ativado (`prismaWithAudit`) e anexá-la ao `req`.
3.  **`modules/auditLog/auditLog.service.ts`**: Contém a lógica principal do middleware do Prisma, que intercepta as operações de banco de dados e cria os registros de log.
4.  **`app.ts`**: O arquivo principal da aplicação deve aplicar os middlewares `protect` e `prismaContextMiddleware` globalmente às rotas que necessitam de auditoria.

## Como Implementar a Auditoria em um Novo Módulo

O processo é simples e consiste em três passos principais:

1.  **Passo 1: (Verificação)** Assegurar que a rota está protegida.
2.  **Passo 2:** Modificar o **Controller** para passar a instância de auditoria do Prisma.
3.  **Passo 3:** Modificar o **Service** para usar a instância recebida.

Vamos usar o módulo de **Matérias** (`modules/materia/`) como exemplo prático.

---

### Passo 1: Verificar a Proteção da Rota

No arquivo de rotas do Express (`routes/index.ts`), certifique-se de que o middleware de auditoria (`prismaContextMiddleware`) está sendo aplicado antes das rotas do seu módulo. Em nossa configuração atual, isso já é feito globalmente em `app.ts` para todas as rotas em `/api`, então nenhuma ação é necessária aqui.

---

### Passo 2: Modificar o Controller

O objetivo aqui é receber o `req.prismaWithAudit` (que vem do `prismaContextMiddleware`) e passá-lo para a camada de serviço.

**Exemplo: `modules/materia/materia.controller.ts`**

```typescript
// modules/materia/materia.controller.ts

import { Response, NextFunction } from "express";
import { materiaService } from "./materia.service";
import { CreateMateriaInput } from "./materia.validator";
// 1. Importe o tipo RequestWithPrisma
import { RequestWithPrisma } from "../../middlewares/prisma-context";

export const materiaController = {
  create: async (
    req: RequestWithPrisma, // 2. Use o tipo RequestWithPrisma
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { unidadeEscolarId } = req.user;
      // ... (código de validação)
      const materia = await materiaService.create(
        req.body as CreateMateriaInput,
        unidadeEscolarId,
        req.prismaWithAudit // 3. Passe a instância com auditoria para o service
      );
      return res.status(201).json(materia);
    } catch (error) {
      next(error);
    }
  },

  update: async (
    req: RequestWithPrisma, // Repita para todas as funções de escrita
    res: Response,
    next: NextFunction
  ) => {
    try {
      // ... (código)
      const result = await materiaService.update(
        id,
        req.body,
        unidadeEscolarId,
        req.prismaWithAudit // Passe a instância aqui também
      );
      // ... (código)
    } catch (error) {
      next(error);
    }
  },

  remove: async (
    req: RequestWithPrisma, // Repita para todas as funções de escrita
    res: Response,
    next: NextFunction
  ) => {
    try {
      // ... (código)
      const result = await materiaService.remove(
        id,
        unidadeEscolarId,
        req.prismaWithAudit // E aqui
      );
      // ... (código)
    } catch (error) {
      next(error);
    }
  },

  // Funções de leitura (findAll, findById) não precisam de alteração.
  findAll: async (
    req: RequestWithPrisma,
    res: Response,
    next: NextFunction
  ) => {
    // ...código original...
  },
};
```

---

### Passo 3: Modificar o Service

Agora, o service precisa ser capaz de receber essa instância especial do Prisma e usá-la em vez da instância global para operações de escrita.

**Exemplo: `modules/materia/materia.service.ts`**

```typescript
// modules/materia/materia.service.ts

import { Prisma, PrismaClient } from "@prisma/client";
import { CreateMateriaInput } from "./materia.validator";

const prisma = new PrismaClient();

// 1. Defina um tipo genérico para o cliente Prisma
type PrismaTransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

const create = (
  data: CreateMateriaInput,
  unidadeEscolarId: string,
  prismaClient: PrismaTransactionClient = prisma // 2. Receba o cliente como parâmetro
) => {
  return prismaClient.materias.create({
    // 3. Use o cliente recebido
    data: {
      ...data,
      unidadeEscolarId,
    },
  });
};

const findAll = (unidadeEscolarId: string) => {
  // Funções de leitura não precisam de auditoria
  return prisma.materias.findMany({
    // ...código original...
  });
};

const update = (
  id: string,
  data: Prisma.MateriasUpdateInput,
  unidadeEscolarId: string,
  prismaClient: PrismaTransactionClient = prisma // Receba o cliente
) => {
  return prismaClient.materias.updateMany({
    // Use o cliente recebido
    where: {
      id,
      unidadeEscolarId,
    },
    data,
  });
};

const remove = async (
  id: string,
  unidadeEscolarId: string,
  prismaClient: PrismaTransactionClient = prisma // Receba o cliente
) => {
  const materiaExists = await prismaClient.materias.findFirst({
    where: { id, unidadeEscolarId },
  });

  if (!materiaExists) {
    return { count: 0 };
  }

  // A transação agora usará o cliente com auditoria
  try {
    await prismaClient.$transaction(async (tx) => {
      // Importante: use 'tx' para todas as operações dentro da transação
      await tx.componenteCurricular.deleteMany({ where: { materiaId: id } });
      await tx.materias.delete({ where: { id } });
    });
    return { count: 1 };
  } catch (error) {
    throw error;
  }
};

export const materiaService = {
  create,
  findAll,
  update,
  remove,
};
```

### Verificação

Após aplicar essas mudanças:

1.  **Reinicie o servidor** do backend.
2.  Execute uma operação de **criação, atualização ou exclusão** no módulo que você modificou (neste caso, Matérias).
3.  Acesse a página de **Auditoria de Logs** no frontend.
4.  O novo registro de log deve aparecer, confirmando que a implementação foi bem-sucedida.

Repita este processo para todos os outros módulos do sistema (`Turmas`, `Matrículas`, `Tarefas`, etc.) para ter uma cobertura completa de auditoria.
