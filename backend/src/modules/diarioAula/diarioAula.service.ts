import { PrismaClient } from '@prisma/client';
import { CreateDiarioAulaInput } from './diarioAula.validator';
import { AuthenticatedRequest } from '../../middlewares/auth';

const prisma = new PrismaClient();

export async function getByDate(
  componenteCurricularId: string,
  data: string,
  user: AuthenticatedRequest['user'],
) {
  console.log(
    `[DiarioAula] getByDate - Componente: ${componenteCurricularId}, Data: ${data}, User: ${user.id}`,
  );

  if (!user.perfilId) {
    throw new Error('Usuário não possui perfil de professor.');
  }

  // Verify ownership
  const componente = await prisma.componenteCurricular.findFirst({
    where: {
      id: componenteCurricularId,
      professorId: user.perfilId,
    },
  });

  if (!componente) {
    console.error(
      `[DiarioAula] Componente não encontrado ou sem permissão. ID: ${componenteCurricularId}, Prof: ${user.perfilId}`,
    );
    throw new Error('Componente curricular não encontrado ou sem permissão.');
  }

  // Normalize date to UTC midnight
  const dateObj = new Date(data);
  dateObj.setUTCHours(0, 0, 0, 0);

  const diario = await prisma.diarioAula.findFirst({
    where: {
      componenteCurricularId,
      data: dateObj,
    },
    include: {
      objetivos: true, // Habilidades BNCC
      registros_presenca: true,
    },
  });

  return diario;
}

export async function upsert(
  data: CreateDiarioAulaInput & {
    id?: string;
    objetivos?: { codigo: string; descricao: string }[];
    status?: 'RASCUNHO' | 'CONSOLIDADO';
  },
  user: AuthenticatedRequest['user'],
) {
  console.log(
    `[DiarioAula] upsert - Componente: ${data.componenteCurricularId}, Data: ${
      data.data
    }, ID: ${data.id || 'novo'}`,
  );

  if (!user.perfilId) {
    throw new Error('Usuário não possui perfil de professor.');
  }

  if (!user.unidadeEscolarId) {
    throw new Error('Usuário não está vinculado a uma unidade escolar.');
  }

  // Verify ownership
  const componente = await prisma.componenteCurricular.findFirst({
    where: {
      id: data.componenteCurricularId,
      professorId: user.perfilId,
    },
  });

  if (!componente) {
    throw new Error('Componente curricular não encontrado ou sem permissão.');
  }

  // Normalize date to UTC midnight
  const dataAula = new Date(data.data);
  dataAula.setUTCHours(0, 0, 0, 0);

  // Check if exists by id or by componenteCurricular + date
  let diario = null;
  if (data.id) {
    diario = await prisma.diarioAula.findUnique({
      where: { id: data.id },
    });
  }

  if (!diario) {
    diario = await prisma.diarioAula.findFirst({
      where: {
        componenteCurricularId: data.componenteCurricularId,
        data: dataAula,
      },
    });
  }

  const diarioData = {
    componenteCurricularId: data.componenteCurricularId,
    data: dataAula,
    objetivoCodigo: data.conteudo?.objetivoCodigo || 'GERAL',
    objetivoDescricao:
      data.conteudo?.objetivoDescricao || 'Registro de frequência',
    tema: data.conteudo?.tema,
    atividade: data.conteudo?.atividade,
    observacoes: data.conteudo?.observacoes,
    status: data.status || 'RASCUNHO',
    professorId: user.perfilId!,
    unidadeEscolarId: user.unidadeEscolarId!,
  };

  if (!diario) {
    console.log(
      `[DiarioAula] Criando novo diário para ${dataAula.toISOString()}`,
    );
    diario = await prisma.diarioAula.create({
      data: diarioData,
    });
  } else {
    console.log(`[DiarioAula] Atualizando diário existente ${diario.id}`);
    diario = await prisma.diarioAula.update({
      where: { id: diario.id },
      data: diarioData,
    });
  }

  // Handle BNCC objectives
  if (data.objetivos && data.objetivos.length > 0) {
    console.log(
      `[DiarioAula] Processando ${data.objetivos.length} objetivos BNCC`,
    );

    // Delete existing objectives
    await prisma.diarioAulaObjetivo.deleteMany({
      where: { diarioAulaId: diario.id },
    });

    // Create new objectives
    for (const obj of data.objetivos) {
      await prisma.diarioAulaObjetivo.create({
        data: {
          diarioAulaId: diario.id,
          codigo: obj.codigo,
          descricao: obj.descricao,
        },
      });
    }
  }

  // Handle presences
  console.log(`[DiarioAula] Processando ${data.presencas.length} presenças`);
  const results = [];
  for (const p of data.presencas) {
    const presence = await prisma.diarioAulaPresenca.upsert({
      where: {
        diarioAulaId_matriculaId: {
          diarioAulaId: diario.id,
          matriculaId: p.matriculaId,
        },
      },
      create: {
        diarioAulaId: diario.id,
        matriculaId: p.matriculaId,
        situacao: p.situacao,
        observacao: p.observacao,
      },
      update: {
        situacao: p.situacao,
        observacao: p.observacao,
      },
    });
    results.push(presence);
  }

  // Fetch complete diary with relations
  const diarioComplete = await prisma.diarioAula.findUnique({
    where: { id: diario.id },
    include: {
      objetivos: true,
      registros_presenca: true,
    },
  });

  return diarioComplete;
}

export async function getAll(user: AuthenticatedRequest['user']) {
  if (!user.perfilId) {
    throw new Error('Usuário não possui perfil de professor.');
  }

  const diarios = await prisma.diarioAula.findMany({
    where: {
      professorId: user.perfilId,
    },
    include: {
      componenteCurricular: {
        include: {
          turma: true,
          materia: true,
        },
      },
      objetivos: true,
      registros_presenca: true,
    },
    orderBy: {
      data: 'desc',
    },
  });

  return diarios;
}

export const diarioAulaService = {
  getByDate,
  upsert,
  getAll,
};
