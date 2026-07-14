import { Router } from "express";
import { registerSchema, loginSchema } from "@workspace/db";
import { db, usersTable } from "@workspace/db";
import {
  hashPassword,
  comparePassword,
  generateToken,
  getUserByEmail,
} from "../lib/auth";
import { authMiddleware, AuthRequest } from "../lib/middleware";

const router = Router();

router.post("/auth/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos", details: parsed.error });
    return;
  }

  const { name, email, password } = parsed.data;

  try {
    const existing = await getUserByEmail(email);
    if (existing) {
      res.status(409).json({ error: "Este email já está cadastrado" });
      return;
    }

    const passwordHash = await hashPassword(password);

    const [user] = await db
      .insert(usersTable)
      .values({
        name,
        email,
        passwordHash,
        plan: "free",
      })
      .returning({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        plan: usersTable.plan,
      });

    const token = generateToken(user.id, user.email);

    res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email, plan: user.plan },
      token,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to register user");
    res.status(500).json({ error: "Erro ao criar conta" });
  }
});

router.post("/auth/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos", details: parsed.error });
    return;
  }

  const { email, password } = parsed.data;

  try {
    const user = await getUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: "Email ou senha incorretos" });
      return;
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Email ou senha incorretos" });
      return;
    }

    const token = generateToken(user.id, user.email);

    res.json({
      user: { id: user.id, name: user.name, email: user.email, plan: user.plan },
      token,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to login");
    res.status(500).json({ error: "Erro ao fazer login" });
  }
});

router.get("/auth/me", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: "Não autenticado" });
      return;
    }
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      plan: user.plan,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get user");
    res.status(500).json({ error: "Erro ao buscar usuário" });
  }
});

export default router;
