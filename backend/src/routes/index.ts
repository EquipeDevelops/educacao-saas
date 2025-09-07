import { Router } from "express";

import { instituicaoRoutes } from "../modules/instituicao/instituicao.routes";
import { usuarioRoutes } from "../modules/usuario/usuario.routes";
import { unidadeEscolarRoutes } from "../modules/unidadeEscolar/unidadeEscolar.routes";
import { turmaRoutes } from "../modules/turma/turma.routes";
import { matriculaRoutes } from "../modules/matricula/matricula.routes";
import { tarefaRoutes } from "../modules/tarefa/tarefa.routes";
import { questaoRoutes } from "../modules/questao/questao.routes";
import { opcaoRoutes } from "../modules/opcaoMultiplaEscolha/opcaoMultiplaEscolha.routes";
import { submissaoRoutes } from "../modules/submissao/submissao.routes";
import { topicoRoutes } from "../modules/topicoForum/topicoForum.routes";
import { conquistaRoutes } from "../modules/conquista/conquista.routes";
import { conquistaUsuarioRoutes } from "../modules/conquistaUsuario/conquistaUsuario.routes";
import { arquivoRoutes } from "../modules/arquivo/arquivo.routes";

const mainRouter = Router();

mainRouter.use("/instituicoes", instituicaoRoutes);
mainRouter.use("/usuarios", usuarioRoutes);
mainRouter.use("/unidades-escolares", unidadeEscolarRoutes);
mainRouter.use("/turmas", turmaRoutes);
mainRouter.use("/matriculas", matriculaRoutes);
mainRouter.use("/tarefas", tarefaRoutes);
mainRouter.use("/questoes", questaoRoutes);
mainRouter.use("/opcoes", opcaoRoutes);
mainRouter.use("/submissoes", submissaoRoutes);
mainRouter.use("/topicos", topicoRoutes);
mainRouter.use("/conquistas", conquistaRoutes);
mainRouter.use("/conquistas-usuarios", conquistaUsuarioRoutes);
mainRouter.use("/arquivos", arquivoRoutes);

export default mainRouter;
