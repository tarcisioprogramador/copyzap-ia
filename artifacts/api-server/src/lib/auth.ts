import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be set in production");
  }
  console.warn("[auth] WARNING: JWT_SECRET not set, using insecure fallback for development only");
}
const SECRET = JWT_SECRET || "fallback-dev-secret-change-in-production";
const JWT_EXPIRES_IN = "7d";
const SALT_ROUNDS = 10;

const PLAN_LIMITS: Record<string, number> = {
  free: 10,
  pro: 999999,
};

export function getPlanLimit(plan: string): number {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(userId: number, email: string): string {
  return jwt.sign({ userId, email }, SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): { userId: number; email: string } | null {
  try {
    const decoded = jwt.verify(token, SECRET) as { userId: number; email: string };
    return decoded;
  } catch {
    return null;
  }
}

export async function getUserById(id: number) {
  const users = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  return users[0] ?? null;
}

export async function getUserByEmail(email: string) {
  const users = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  return users[0] ?? null;
}

export async function canGenerateCopy(userId: number): Promise<{ allowed: boolean; remaining: number }> {
  const user = await getUserById(userId);
  if (!user) return { allowed: false, remaining: 0 };

  const now = new Date();
  const resetAt = new Date(user.copiesResetAt);

  // Reset daily counter if it's a new day
  if (now.toDateString() !== resetAt.toDateString()) {
    await db
      .update(usersTable)
      .set({ copiesUsedToday: 0, copiesResetAt: now })
      .where(eq(usersTable.id, userId));
    return { allowed: true, remaining: getPlanLimit(user.plan) };
  }

  const remaining = getPlanLimit(user.plan) - user.copiesUsedToday;
  return { allowed: remaining > 0, remaining: Math.max(0, remaining) };
}

export async function incrementCopiesUsed(userId: number): Promise<void> {
  await db.execute(
    sql`UPDATE users SET copies_used_today = copies_used_today + 1 WHERE id = ${userId}`
  );
}
