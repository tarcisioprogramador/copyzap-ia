import { Request, Response, NextFunction } from "express";
import { verifyToken, getUserById } from "./auth";
import { logger } from "./logger";

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
    plan: string;
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token de autenticação necessário" });
    return;
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    res.status(401).json({ error: "Token inválido ou expirado" });
    return;
  }

  getUserById(decoded.userId)
    .then((user) => {
      if (!user) {
        res.status(401).json({ error: "Usuário não encontrado" });
        return;
      }
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
      };
      next();
    })
    .catch((err) => {
      logger.error({ err }, "Auth middleware error");
      res.status(500).json({ error: "Erro interno de autenticação" });
    });
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next();
    return;
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    next();
    return;
  }

  getUserById(decoded.userId)
    .then((user) => {
      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          name: user.name,
          plan: user.plan,
        };
      }
      next();
    })
    .catch(() => {
      next();
    });
}
