import { Router } from "express";

// Importação das rotas de autenticação (Públicas)
import { authRoutes } from "../modules/auth/auth.routes";

// Importação das rotas Administrativas e de Base
import { instituicaoRoutes } from "../modules/instituicao/instituicao.routes";
import { unidadeEscolarRoutes } from "../modules/unidadeEscolar/unidadeEscolar.routes";
import { usuarioRoutes } from "../modules/usuario/usuario.routes";
import { turmaRoutes } from "../modules/turma/turma.routes";

import { componenteRoutes } from "../modules/componenteCurricular/componenteCurricular.routes";
import { horarioRoutes } from "../modules/horarioAula/horarioAula.routes";

// Importação das rotas de fluxo do Aluno/Professor
import { matriculaRoutes } from "../modules/matricula/matricula.routes";
import { tarefaRoutes } from "../modules/tarefa/tarefa.routes";
import { questaoRoutes } from "../modules/questao/questao.routes";
import { opcaoRoutes } from "../modules/opcaoMultiplaEscolha/opcaoMultiplaEscolha.routes";
import { submissaoRoutes } from "../modules/submissao/submissao.routes";
import { respostaRoutes } from "../modules/respostaSubmissao/respostaSubmissao.routes";
import { avaliacaoRoutes } from "../modules/avaliacaoParcial/avaliacaoParcial.routes";
import { registroFaltaRoutes } from "../modules/registroFalta/registroFalta.routes";

// Importação das rotas de Engajamento e Comunicação
import { conquistaRoutes } from "../modules/conquista/conquista.routes";
import { conquistaUsuarioRoutes } from "../modules/conquistaUsuario/conquistaUsuario.routes";
import { comentarioRoutes } from "../modules/comentarioTarefa/comentarioTarefa.routes";
import { conversaRoutes } from "../modules/conversa/conversa.routes";

const mainRouter = Router();

// --- ROTAS PÚBLICAS DE AUTENTICAÇÃO ---
mainRouter.use("/auth", authRoutes);

// --- ROTAS DE GESTÃO (ADMIN / SUPER ADMIN) ---
mainRouter.use("/instituicoes", instituicaoRoutes);
mainRouter.use("/unidades-escolares", unidadeEscolarRoutes);
mainRouter.use("/usuarios", usuarioRoutes);
mainRouter.use("/turmas", turmaRoutes);

mainRouter.use("/componentes-curriculares", componenteRoutes);
mainRouter.use("/horarios", horarioRoutes);

// --- ROTAS DO FLUXO ACADÊMICO ---
mainRouter.use("/matriculas", matriculaRoutes);
mainRouter.use("/tarefas", tarefaRoutes);
mainRouter.use("/questoes", questaoRoutes);
mainRouter.use("/opcoes", opcaoRoutes);
mainRouter.use("/submissoes", submissaoRoutes);
mainRouter.use("/respostas", respostaRoutes);
mainRouter.use("/avaliacoes", avaliacaoRoutes);
mainRouter.use("/faltas", registroFaltaRoutes);

// --- ROTAS DE ENGAJAMENTO E COMUNICAÇÃO ---
mainRouter.use("/conquistas", conquistaRoutes);
mainRouter.use("/conquistas-usuarios", conquistaUsuarioRoutes);
mainRouter.use("/comentarios-tarefa", comentarioRoutes);
mainRouter.use("/conversas", conversaRoutes);

export default mainRouter;
