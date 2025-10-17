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
import horarioRoutes from "../modules/horarioAula/horarioAula.routes";
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
import { financeiroRoutes } from "../modules/financeiro/financeiro.routes";
import { conquistaRoutes } from "../modules/conquista/conquista.routes";
import { conquistaUsuarioRoutes } from "../modules/conquistaUsuario/conquistaUsuario.routes";
import { comentarioRoutes } from "../modules/comentarioTarefa/comentarioTarefa.routes";
import { conversaRoutes } from "../modules/conversa/conversa.routes";
import { eventoRoutes } from "../modules/eventos/eventos.routes";
import { geradorProvaIARoutes } from "../modules/geradorProvaIA/geradorProvaIA.routes";
import { auditLogRoutes } from "../modules/auditLog/auditLog.routes";
import { categoriaTransacaoRoutes } from "../modules/categoriaTransacao/categoriaTransacao.routes";

const protectedRouter = Router();

protectedRouter.use("/super-admin", superAdminRoutes);
protectedRouter.use("/instituicoes", instituicaoRoutes);
protectedRouter.use("/unidades-escolares", unidadeEscolarRoutes);
protectedRouter.use("/usuarios", usuarioRoutes);
protectedRouter.use("/turmas", turmaRoutes);
protectedRouter.use("/materias", materiaRoutes);
protectedRouter.use("/professores", professorRoutes);
protectedRouter.use("/alunos", alunoRoutes);
protectedRouter.use("/componentes-curriculares", componenteCurricularRoutes);
protectedRouter.use("/horarios-aula", horarioRoutes);

protectedRouter.use("/matriculas", matriculaRoutes);
protectedRouter.use("/tarefas", tarefaRoutes);
protectedRouter.use("/questoes", questaoRoutes);
protectedRouter.use("/opcoes", opcaoRoutes);
protectedRouter.use("/submissoes", submissaoRoutes);
protectedRouter.use("/respostas", respostaRoutes);
protectedRouter.use("/avaliacoes", avaliacaoRoutes);
protectedRouter.use("/faltas", registroFaltaRoutes);

protectedRouter.use("/conquistas", conquistaRoutes);
protectedRouter.use("/conquistas-por-unidade", conquistasPorUnidadeRoutes);
protectedRouter.use("/conquistas-usuarios", conquistaUsuarioRoutes);
protectedRouter.use("/comentarios-tarefa", comentarioRoutes);
protectedRouter.use("/conversas", conversaRoutes);
protectedRouter.use("/eventos", eventoRoutes);
protectedRouter.use("/gerador-prova-ia", geradorProvaIARoutes);

protectedRouter.use("/professor/dashboard", professorDashboardRoutes);
protectedRouter.use("/gestor/dashboard", gestorDashboardRoutes);
protectedRouter.use("/gestor/relatorios", relatoriosRoutes);
protectedRouter.use("/financeiro", financeiroRoutes);
protectedRouter.use("/audit-logs", auditLogRoutes);
protectedRouter.use("/categorias-transacao", categoriaTransacaoRoutes);

export { authRoutes, protectedRouter };
