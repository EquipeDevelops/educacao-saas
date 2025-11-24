import { PrismaClient } from "@prisma/client";
import { CreateDiarioInput } from "./diario.validator";
import { AppError } from "../../errors/AppError";

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
        "Turma não encontrada ou não pertence a este professor.",
        403
      );
    }

    const aulaExistente = await prisma.diarioAula.findFirst({
      where: {
        componenteCurricularId: data.componenteCurricularId,
        data: new Date(data.data),
      },
    });

    if (aulaExistente) {
      throw new AppError(
        "Já existe um diário registrado para esta data nesta turma."
      );
    }

    const principalSkill = data.habilidades[0] || {
      codigo: "GERAL",
      descricao: "Aula Geral",
    };

    const diario = await prisma.$transaction(async (tx) => {
      const novoDiario = await tx.diarioAula.create({
        data: {
          data: new Date(data.data),
          tema: data.tema || "Sem tema",
          atividade: data.conteudo || "",
          observacoes: `Duração: ${data.duracao} min`,

          objetivoCodigo: principalSkill.codigo,
          objetivoDescricao: principalSkill.descricao.substring(0, 100),

          professorId: professorId,
          componenteCurricularId: data.componenteCurricularId,
          unidadeEscolarId: componente.turma.unidadeEscolarId,
        },
      });

      if (data.habilidades.length > 0) {
        await tx.diarioAulaObjetivo.createMany({
          data: data.habilidades.map((h) => ({
            diarioAulaId: novoDiario.id,
            codigo: h.codigo,
            descricao: h.descricao,
          })),
        });
      }

      if (data.frequencia.length > 0) {
        const matriculas = await tx.matriculas.findMany({
          where: {
            turmaId: componente.turmaId,
            alunoId: { in: data.frequencia.map((f) => f.alunoId) },
            status: "ATIVA",
          },
          select: { id: true, alunoId: true },
        });

        const matriculaMap = new Map(matriculas.map((m) => [m.alunoId, m.id]));

        const presencasParaSalvar = data.frequencia
          .map((freq) => {
            const matriculaId = matriculaMap.get(freq.alunoId);
            if (!matriculaId) return null;

            return {
              diarioAulaId: novoDiario.id,
              matriculaId: matriculaId,
              situacao: freq.status === "AUSENTE" ? "FALTA" : "PRESENTE",
            } as any;
          })
          .filter((p) => p !== null);

        if (presencasParaSalvar.length > 0) {
          await tx.diarioAulaPresenca.createMany({
            data: presencasParaSalvar,
          });

          const faltas = presencasParaSalvar.filter(
            (p: any) => p.situacao === "FALTA"
          );
          if (faltas.length > 0) {
            await tx.registroFalta.createMany({
              data: faltas.map((f: any) => ({
                matriculaId: f.matriculaId,
                data: new Date(data.data),
                justificada: false,
              })),
            });
          }
        }
      }

      return novoDiario;
    });

    return diario;
  }
}
