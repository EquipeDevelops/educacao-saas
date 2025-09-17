import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient, PapelUsuario } from "@prisma/client";

const prisma = new PrismaClient();

// ARQUITETURA: Definimos uma interface customizada que estende a Request do Express.
// Isso nos permite adicionar a propriedade 'user' à requisição de forma tipada.
export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    instituicaoId: string | null; // Pode ser nulo para o Super Admin
    papel: PapelUsuario;
    perfilId: string | null; // ID do perfil de aluno ou professor
  };
}

/**
 * Middleware de AUTENTICAÇÃO (`protect`).
 * Verifica a validade do token JWT e anexa os dados do usuário à requisição.
 */
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let token;

  // 1. Pega o token do header Authorization
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res
      .status(401)
      .json({ message: "Não autenticado. Faça o login para obter acesso." });
  }

  try {
    // 2. Verifica se o token é válido e não expirou
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
    };

    // 3. Busca o usuário no banco de dados
    const usuario = await prisma.usuarios.findUnique({
      where: { id: decoded.id },
      include: {
        perfil_aluno: { select: { id: true } },
        perfil_professor: { select: { id: true } },
      },
    });

    if (!usuario) {
      return res
        .status(401)
        .json({ message: "O usuário dono deste token não existe mais." });
    }

    // 4. Anexa o objeto 'user' à requisição para ser usado nos próximos middlewares e controllers
    (req as AuthenticatedRequest).user = {
      id: usuario.id,
      instituicaoId: usuario.instituicaoId,
      papel: usuario.papel,
      // OTIMIZAÇÃO: Já buscamos e anexamos o ID do perfil para não precisar de outra query no futuro
      perfilId:
        usuario.perfil_aluno?.id || usuario.perfil_professor?.id || null,
    };

    next(); // Passa para o próximo middleware
  } catch (error) {
    return res.status(401).json({ message: "Token inválido ou expirado." });
  }
};

/**
 * Middleware de AUTORIZAÇÃO (`authorize`).
 * Recebe uma lista de papéis e verifica se o usuário autenticado tem permissão.
 * Deve ser usado SEMPRE DEPOIS do middleware `protect`.
 * @param roles - Papéis permitidos (ex: 'ADMINISTRADOR', 'PROFESSOR')
 */
export const authorize = (...roles: PapelUsuario[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;

    if (!roles.includes(user.papel)) {
      return res.status(403).json({
        message: `Acesso negado. Apenas usuários com os seguintes papéis são permitidos: ${roles.join(
          ", "
        )}`,
      });
    }

    next();
  };
};
