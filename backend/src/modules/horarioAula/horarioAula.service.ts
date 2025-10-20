import prisma from "../../utils/prisma";
import { AppError } from "../../errors/AppError";
import { DiaDaSemana } from "@prisma/client";

class HorarioAulaService {
  async getHorariosByProfessorId(professorId: string) {
    const horarios = await prisma.horarioAula.findMany({
      where: {
        componenteCurricular: {
          professorId: professorId,
        },
      },
      include: {
        componenteCurricular: {
          include: {
            materia: true,
            professor: {
              include: {
                usuario: true,
              },
            },
            turma: true,
          },
        },
      },
    });
    return horarios;
  }

  async createHorarioAula(
    turmaId: string,
    componenteCurricularId: string,
    horarioInicio: string,
    horarioFim: string,
    diaSemana: string
  ) {
    const turma = await prisma.turmas.findUnique({
      where: { id: turmaId },
      select: { unidadeEscolarId: true },
    });

    if (!turma) {
      throw new AppError("Turma não encontrada.", 404);
    }

    const componenteCurricular = await prisma.componenteCurricular.findUnique({
      where: { id: componenteCurricularId },
      select: { professorId: true },
    });

    if (!componenteCurricular || !componenteCurricular.professorId) {
      throw new AppError(
        "Componente curricular ou professor não encontrado.",
        404
      );
    }
    const professorId = componenteCurricular.professorId;

    const diaSemanaEnum = diaSemana as DiaDaSemana;

    const isHorarioOcupadoParaTurma = await prisma.horarioAula.findFirst({
      where: {
        turmaId,
        dia_semana: diaSemanaEnum,
        hora_inicio: horarioInicio,
      },
    });
    if (isHorarioOcupadoParaTurma) {
      throw new AppError("Este horário já está ocupado para esta turma.");
    }

    const isHorarioOcupadoParaProfessor = await prisma.horarioAula.findFirst({
      where: {
        componenteCurricular: {
          professorId: professorId,
        },
        dia_semana: diaSemanaEnum,
        hora_inicio: horarioInicio,
      },
    });
    if (isHorarioOcupadoParaProfessor) {
      throw new AppError(
        "Este professor já está alocado em outra turma neste horário."
      );
    }

    const novoHorario = await prisma.horarioAula.create({
      data: {
        turmaId,
        componenteCurricularId,
        hora_inicio: horarioInicio,
        hora_fim: horarioFim,
        dia_semana: diaSemanaEnum,
        unidadeEscolarId: turma.unidadeEscolarId,
      },
      include: {
        componenteCurricular: {
          include: {
            materia: true,
            professor: {
              include: {
                usuario: true,
              },
            },
          },
        },
      },
    });

    return novoHorario;
  }

  async getHorariosByTurma(turmaId: string) {
    const horarios = await prisma.horarioAula.findMany({
      where: {
        turmaId,
      },
      include: {
        componenteCurricular: {
          include: {
            materia: true,
            professor: {
              include: {
                usuario: true,
              },
            },
          },
        },
      },
    });
    return horarios;
  }

  async deleteHorarioAula(id: string) {
    const horario = await prisma.horarioAula.findUnique({ where: { id } });
    if (!horario) {
      throw new AppError("Horário não encontrado", 404);
    }
    await prisma.horarioAula.delete({ where: { id } });
  }

  async getHorariosAsEventos(unidadeEscolarId: string, mes?: string) {
    const whereClause: any = { unidadeEscolarId };

    const horarios = await prisma.horarioAula.findMany({
      where: whereClause,
      include: {
        componenteCurricular: {
          include: {
            materia: true,
            professor: {
              include: {
                usuario: true,
              },
            },
          },
        },
        turma: true,
      },
    });

    const eventos = this.transformarHorariosEmEventos(horarios, mes);
    return eventos;
  }

  private transformarHorariosEmEventos(horarios: any[], mes?: string) {
    const eventos: any[] = [];

    const hoje = new Date();
    let dataInicio: Date;
    let dataFim: Date;

    if (mes) {
      const [ano, mesNum] = mes.split("-").map(Number);
      dataInicio = new Date(ano, mesNum - 1, 1);
      dataFim = new Date(ano, mesNum, 0);
    } else {
      dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    }

    const diasSemanaMap: { [key: string]: number } = {
      DOMINGO: 0,
      SEGUNDA: 1,
      TERCA: 2,
      QUARTA: 3,
      QUINTA: 4,
      SEXTA: 5,
      SABADO: 6,
    };

    horarios.forEach((horario) => {
      const diaSemanaNum = diasSemanaMap[horario.dia_semana];

      for (
        let data = new Date(dataInicio);
        data <= dataFim;
        data.setDate(data.getDate() + 1)
      ) {
        if (data.getDay() === diaSemanaNum) {
          const [horaInicio, minutoInicio] = horario.hora_inicio
            .split(":")
            .map(Number);
          const [horaFim, minutoFim] = horario.hora_fim.split(":").map(Number);

          const dataInicioEvento = new Date(data);
          dataInicioEvento.setHours(horaInicio, minutoInicio, 0, 0);

          const dataFimEvento = new Date(data);
          dataFimEvento.setHours(horaFim, minutoFim, 0, 0);

          eventos.push({
            id: `horario-${horario.id}-${data.toISOString().split("T")[0]}`,
            titulo: horario.componenteCurricular.materia.nome,
            descricao: `Professor: ${horario.componenteCurricular.professor.usuario.nome}\nTurma: ${horario.turma.serie} ${horario.turma.nome}`,
            tipo: "AULA" as any,
            data_inicio: dataInicioEvento,
            data_fim: dataFimEvento,
            dia_inteiro: false,
            turmaId: horario.turmaId,
            horarioAulaId: horario.id,
            local: horario.local,
            isHorarioAula: true,
          });
        }
      }
    });

    return eventos;
  }
}

export default new HorarioAulaService();
