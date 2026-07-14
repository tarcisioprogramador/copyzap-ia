import { Router } from "express";
import { db } from "@workspace/db";
import { copiesTable } from "@workspace/db";
import { GenerateCopyBody, DeleteCopyParams } from "@workspace/api-zod";
import Groq from "groq-sdk";
import { eq, sql, desc, and } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../lib/middleware";
import { canGenerateCopy, incrementCopiesUsed } from "../lib/auth";

const router = Router();

const messageTypeLabels: Record<string, string> = {
  venda: "Venda / Primeiro contato",
  followup: "Follow-up / Acompanhamento",
  urgencia: "Urgência / Escassez",
  posVenda: "Pós-venda / Fidelização",
  objecao: "Quebra de objeção",
};

const toneLabels: Record<string, string> = {
  profissional: "profissional e confiante",
  amigavel: "amigável e descontraído",
  direto: "direto e objetivo",
  emocional: "emocional e empático",
};

export function buildPrompt(
  clientName: string,
  product: string,
  messageType: string,
  tone: string,
  value?: string,
  context?: string
): string {
  const typeLabel = messageTypeLabels[messageType] ?? messageType;
  const toneLabel = toneLabels[tone] ?? tone;

  let prompt = `Você é um especialista em copywriting para vendas pelo WhatsApp no Brasil.

Gere uma mensagem de WhatsApp do tipo "${typeLabel}" com tom ${toneLabel}.

Dados:
- Nome do cliente: ${clientName}
- Produto/Serviço: ${product}`;

  if (value) prompt += `\n- Valor: R$ ${value}`;
  if (context) prompt += `\n- Contexto adicional: ${context}`;

  prompt += `

Regras importantes:
- Escreva diretamente a mensagem, sem introduções como "Aqui está" ou "Segue a mensagem"
- Use linguagem natural brasileira
- Máximo de 5 parágrafos curtos
- Pode usar 1-2 emojis relevantes, mas não exagere
- Inclua uma chamada para ação clara no final
- A mensagem deve parecer escrita por um humano, não por IA
- Não use asteriscos para negrito
- Adapte o tom conforme solicitado

Escreva apenas a mensagem final, pronta para enviar.`;

  return prompt;
}

router.get("/copies/stats", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const total = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(copiesTable)
      .where(eq(copiesTable.userId, userId));

    const byTypeRows = await db
      .select({
        messageType: copiesTable.messageType,
        count: sql<number>`count(*)::int`,
      })
      .from(copiesTable)
      .where(eq(copiesTable.userId, userId))
      .groupBy(copiesTable.messageType);

    const todayRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(copiesTable)
      .where(and(eq(copiesTable.userId, userId), sql`date(created_at) = current_date`));

    const byType: Record<string, number> = {};
    for (const row of byTypeRows) {
      byType[row.messageType] = row.count;
    }

    res.json({
      total: total[0]?.count ?? 0,
      byType,
      todayCount: todayRows[0]?.count ?? 0,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get copy stats");
    res.status(500).json({ error: "Failed to get stats" });
  }
});

router.get("/copies", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    const offset = (page - 1) * limit;

    const copies = await db
      .select()
      .from(copiesTable)
      .where(eq(copiesTable.userId, userId))
      .orderBy(desc(copiesTable.createdAt))
      .limit(limit)
      .offset(offset);

    const totalResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(copiesTable)
      .where(eq(copiesTable.userId, userId));

    res.json({
      copies: copies.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
      })),
      total: totalResult[0]?.count ?? 0,
      page,
      limit,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to list copies");
    res.status(500).json({ error: "Failed to list copies" });
  }
});

router.post("/copies", authMiddleware, async (req: AuthRequest, res) => {
  const parsed = GenerateCopyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error });
    return;
  }

  const userId = req.user!.id;

  // Check usage limit
  const { allowed, remaining } = await canGenerateCopy(userId);
  if (!allowed) {
    res.status(429).json({
      error: "Limite diário atingido",
      message: "Você atingiu o limite do seu plano. Faça upgrade para o Pro!",
    });
    return;
  }

  const { clientName, product, value, context, messageType, tone = "profissional" } = parsed.data;

  if (!process.env.GROQ_API_KEY) {
    res.status(500).json({ error: "Chave da API de IA não configurada" });
    return;
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  try {
    const prompt = buildPrompt(clientName, product, messageType, tone, value ?? undefined, context ?? undefined);

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 512,
    });

    const generatedText = completion.choices[0]?.message?.content?.trim() ?? "";

    if (!generatedText) {
      res.status(500).json({ error: "A IA não retornou texto. Tente novamente." });
      return;
    }

    const [inserted] = await db
      .insert(copiesTable)
      .values({
        userId,
        clientName,
        product,
        value: value ?? null,
        context: context ?? null,
        messageType,
        tone,
        generatedText,
      })
      .returning();

    await incrementCopiesUsed(userId);

    res.status(201).json({
      id: inserted.id,
      clientName: inserted.clientName,
      product: inserted.product,
      value: inserted.value,
      context: inserted.context,
      messageType: inserted.messageType,
      tone: inserted.tone,
      generatedText: inserted.generatedText,
      createdAt: inserted.createdAt.toISOString(),
      remaining,
    });
  } catch (err: unknown) {
    req.log.error({ err }, "Failed to generate copy");
    const msg = err instanceof Error ? err.message : "Erro ao gerar copy com IA";
    res.status(502).json({ error: msg });
  }
});

router.delete("/copies/:id", authMiddleware, async (req: AuthRequest, res) => {
  const parsed = DeleteCopyParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    const userId = req.user!.id;
    await db
      .delete(copiesTable)
      .where(and(eq(copiesTable.id, parsed.data.id), eq(copiesTable.userId, userId)));
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Failed to delete copy");
    res.status(500).json({ error: "Failed to delete copy" });
  }
});

export default router;
