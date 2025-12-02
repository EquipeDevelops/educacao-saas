import { PrismaClient } from '@prisma/client';
import { CreateDiarioInput } from './diario.validator';
import { AppError } from '../../errors/AppError';

const prisma = new PrismaClient();

export class DiarioService {
  async create(data: CreateDiarioInput, professorId: string) {
    const componente = await prisma.componenteCurricular.findFirst({
      where: {
        id: data.componenteCurricularId,
        professorId: professorId,
      },
      include: { turma: true },
    });

    if (!componente) {
      throw new AppError(
        'Turma não encontrada ou não pertence a este professor.',
        403,
      );
    }

    // Check for existing diary
    let diario = await prisma.diarioAula.findFirst({
      where: {
        componenteCurricularId: data.componenteCurricularId,
        data: new Date(data.data),
      },
    });

    // If exists and is CONSOLIDATED, throw error (or allow update if that was the requirement, but user said "Consolidation point")
    // Assuming we can overwrite/update even if consolidated, but for now let's stick to the logic:
    // If it exists, we update it. If it's RASCUNHO, it becomes CONSOLIDADO.

    const principalSkill = data.habilidades[0] || {
      codigo: 'GERAL',
      descricao: 'Aula Geral',
    };

    const result = await prisma.$transaction(async (tx) => {
      let currentDiario;

      if (diario) {
        // Update existing diary
        currentDiario = await tx.diarioAula.update({
          where: { id: diario.id },
          data: {
            tema: data.tema || 'Sem tema',
            atividade: data.conteudo || '',
            observacoes: `Duração: ${data.duracao} min`,
            objetivoCodigo: principalSkill.codigo,
            objetivoDescricao: principalSkill.descricao.substring(0, 100),
            status: 'CONSOLIDADO', // Force consolidation
          },
        });

        // Update objectives (delete old, insert new for simplicity)
        await tx.diarioAulaObjetivo.deleteMany({
          where: { diarioAulaId: diario.id },
        });
      } else {
        // Create new diary
        currentDiario = await tx.diarioAula.create({
          data: {
            data: new Date(data.data),
            tema: data.tema || 'Sem tema',
            atividade: data.conteudo || '',
            observacoes: `Duração: ${data.duracao} min`,
            objetivoCodigo: principalSkill.codigo,
            objetivoDescricao: principalSkill.descricao.substring(0, 100),
            professorId: professorId,
            componenteCurricularId: data.componenteCurricularId,
            unidadeEscolarId: componente.turma.unidadeEscolarId,
            status: 'CONSOLIDADO',
          },
        });
      }

      if (data.habilidades.length > 0) {
        await tx.diarioAulaObjetivo.createMany({
          data: data.habilidades.map((h) => ({
            diarioAulaId: currentDiario.id,
            codigo: h.codigo,
            descricao: h.descricao,
          })),
        });
      }

      // Handle presences and absences (RegistroFalta)
      if (data.frequencia.length > 0) {
        const matriculas = await tx.matriculas.findMany({
          where: {
            turmaId: componente.turmaId,
            alunoId: { in: data.frequencia.map((f) => f.alunoId) },
            status: 'ATIVA',
          },
          select: { id: true, alunoId: true },
        });

        const matriculaMap = new Map(matriculas.map((m) => [m.alunoId, m.id]));

        // 1. Update/Create DiarioAulaPresenca
        for (const freq of data.frequencia) {
          const matriculaId = matriculaMap.get(freq.alunoId);
          if (matriculaId) {
            // Map FrequenciaStatus (frontend) to SituacaoPresenca (database)
            // Frontend: PRESENTE, AUSENTE, AUSENTE_JUSTIFICADO
            // Database: PRESENTE, FALTA, FALTA_JUSTIFICADA
            let situacao: 'PRESENTE' | 'FALTA' | 'FALTA_JUSTIFICADA' =
              'PRESENTE';
            if (freq.status === 'AUSENTE') {
              situacao = 'FALTA';
            } else if (freq.status === 'AUSENTE_JUSTIFICADO') {
              situacao = 'FALTA_JUSTIFICADA';
            }

            await tx.diarioAulaPresenca.upsert({
              where: {
                diarioAulaId_matriculaId: {
                  diarioAulaId: currentDiario.id,
                  matriculaId: matriculaId,
                },
              },
              create: {
                diarioAulaId: currentDiario.id,
                matriculaId: matriculaId,
                situacao: situacao,
              },
              update: {
                situacao: situacao,
              },
            });
          }
        }

        // 2. Handle RegistroFalta (The official record)
        // First, remove existing RegistroFalta for this day/matriculas to avoid duplicates or stale data
        // We only remove for the students we are processing to be safe, or for the whole day/turma?
        // Safer to remove for the whole day for this component's students if we are consolidating the whole class.
        // But RegistroFalta is linked to Matricula.

        // Let's find all matriculas for this class to clean up potential old faults if they are now present.
        const allClassMatriculas = await tx.matriculas.findMany({
          where: { turmaId: componente.turmaId },
          select: { id: true },
        });
        const allMatriculaIds = allClassMatriculas.map((m) => m.id);

        // Clean up old RegistroFalta records for this date
        // This ensures that consolidation is the single source of truth
        // Any previous attendance records are replaced by this consolidation
        await tx.registroFalta.deleteMany({
          where: {
            matriculaId: { in: allMatriculaIds },
            data: new Date(data.data),
          },
        });

        // Now insert new faults (both justified and unjustified)
        const faltas = data.frequencia.filter(
          (f) => f.status === 'AUSENTE' || f.status === 'AUSENTE_JUSTIFICADO',
        );
        const faltasParaSalvar = faltas
          .map((f) => {
            const matId = matriculaMap.get(f.alunoId);
            if (!matId) return null;
            return {
              matriculaId: matId,
              data: new Date(data.data),
              justificada: f.status === 'AUSENTE_JUSTIFICADO',
            };
          })
          .filter((f) => f !== null);

        if (faltasParaSalvar.length > 0) {
          await tx.registroFalta.createMany({
            data: faltasParaSalvar as any,
          });
        }
      }

      return currentDiario;
    });

    return result;
  }
}
