import { Router } from "express";

import { authRoutes } from "../modules/auth/auth.routes";

import { instituicaoRoutes } from "../modules/instituicao/instituicao.routes";
import { unidadeEscolarRoutes } from "../modules/unidadeEscolar/unidadeEscolar.routes";
import { usuarioRoutes } from "../modules/usuario/usuario.routes";
import { turmaRoutes } from "../modules/turma/turma.routes";
import { materiaRoutes } from "../modules/materia/materia.routes";
import { professorRoutes } from "../modules/professor/professor.routes";
import { alunoRoutes } from "../modules/aluno/aluno.routes";
import { superAdminRoutes } from "../modules/superadmin/superadmin.routes";
import { componenteCurricularRoutes } from "../modules/componenteCurricular/componenteCurricular.routes";
import { horarioRoutes } from "../modules/horarioAula/horarioAula.routes";
import { conquistasPorUnidadeRoutes } from "../modules/conquistasPorUnidade/conquistasPorUnidade.routes";

import { matriculaRoutes } from "../modules/matricula/matricula.routes";
import { tarefaRoutes } from "../modules/tarefa/tarefa.routes";
import { questaoRoutes } from "../modules/questao/questao.routes";
import { opcaoRoutes } from "../modules/opcaoMultiplaEscolha/opcaoMultiplaEscolha.routes";
import { submissaoRoutes } from "../modules/submissao/submissao.routes";
import { respostaRoutes } from "../modules/respostaSubmissao/respostaSubmissao.routes";
import { avaliacaoRoutes } from "../modules/avaliacaoParcial/avaliacaoParcial.routes";
import { registroFaltaRoutes } from "../modules/registroFalta/registroFalta.routes";
import { professorDashboardRoutes } from "../modules/professorDashboard/professorDashboard.routes";
import { gestorDashboardRoutes } from "../modules/gestorDashboard/gestorDashboard.routes";
import { relatoriosRoutes } from "../modules/relatorios/relatorios.routes";

import { conquistaRoutes } from "../modules/conquista/conquista.routes";
import { conquistaUsuarioRoutes } from "../modules/conquistaUsuario/conquistaUsuario.routes";
import { comentarioRoutes } from "../modules/comentarioTarefa/comentarioTarefa.routes";
import { conversaRoutes } from "../modules/conversa/conversa.routes";
import { eventoRoutes } from "../modules/eventos/eventos.routes";
import { geradorProvaIARoutes } from "../modules/geradorProvaIA/geradorProvaIA.routes";

const mainRouter = Router();

mainRouter.use("/auth", authRoutes);

mainRouter.use("/super-admin", superAdminRoutes);
mainRouter.use("/instituicoes", instituicaoRoutes);
mainRouter.use("/unidades-escolares", unidadeEscolarRoutes);
mainRouter.use("/usuarios", usuarioRoutes);
mainRouter.use("/turmas", turmaRoutes);
mainRouter.use("/materias", materiaRoutes);
mainRouter.use("/professores", professorRoutes);
mainRouter.use("/alunos", alunoRoutes);
mainRouter.use("/componentes-curriculares", componenteCurricularRoutes);
mainRouter.use("/horarios", horarioRoutes);

mainRouter.use("/matriculas", matriculaRoutes);
mainRouter.use("/tarefas", tarefaRoutes);
mainRouter.use("/questoes", questaoRoutes);
mainRouter.use("/opcoes", opcaoRoutes);
mainRouter.use("/submissoes", submissaoRoutes);
mainRouter.use("/respostas", respostaRoutes);
mainRouter.use("/avaliacoes", avaliacaoRoutes);
mainRouter.use("/faltas", registroFaltaRoutes);

mainRouter.use("/conquistas", conquistaRoutes);
mainRouter.use("/conquistas-por-unidade", conquistasPorUnidadeRoutes);
mainRouter.use("/conquistas-usuarios", conquistaUsuarioRoutes);
mainRouter.use("/comentarios-tarefa", comentarioRoutes);
mainRouter.use("/conversas", conversaRoutes);
mainRouter.use("/eventos", eventoRoutes);
mainRouter.use("/gerador-prova-ia", geradorProvaIARoutes);

mainRouter.use("/professor/dashboard", professorDashboardRoutes);
mainRouter.use("/gestor/dashboard", gestorDashboardRoutes);
mainRouter.use("/gestor/relatorios", relatoriosRoutes);

export default mainRouter;
