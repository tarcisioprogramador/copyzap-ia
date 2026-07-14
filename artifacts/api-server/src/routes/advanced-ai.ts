import { Router } from "express";
import { z } from "zod";
import { db, copiesTable } from "@workspace/db";
import { authMiddleware, AuthRequest } from "../lib/middleware";
import { canGenerateCopy, incrementCopiesUsed } from "../lib/auth";

const router = Router();

function getGroq() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY não configurada");
  }
  // Dynamic import to avoid module-level crash
  return import("groq-sdk").then(
    (m) => new m.default({ apiKey: process.env.GROQ_API_KEY })
  );
}

// POST /ai/seller-mode - Modo Vendedor IA
router.post("/ai/seller-mode", authMiddleware, async (req: AuthRequest, res) => {
  const schema = z.object({
    clientDescription: z.string().min(10, "Descreva o cenário do cliente com mais detalhes"),
    product: z.string().min(1, "Produto é obrigatório"),
    context: z.string().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos", details: parsed.error });
    return;
  }

  const userId = req.user!.id;
  const { allowed } = await canGenerateCopy(userId);
  if (!allowed) {
    res.status(429).json({ error: "Limite diário atingido. Faça upgrade para Pro!" });
    return;
  }

  const { clientDescription, product, context } = parsed.data;

  try {
    const groq = await getGroq();
    const prompt = `Você é um vendedor humano experiente conversando pelo WhatsApp. Responda EXATAMENTE como um vendedor humano responderia.

CENÁRIO DO CLIENTE:
${clientDescription}

PRODUTO/SERVIÇO: ${product}
${context ? `CONTEXTO EXTRA: ${context}` : ""}

INSTRUÇÕES:
- Responda como se fosse um vendedor humano real escrevendo no WhatsApp
- Use linguagem natural, brasileira, com gírias leves se apropriado
- Seja empático e consultivo
- Não pareça robô nem script
- Máximo 3 parágrafos curtos
- 1-2 emojis no máximo
- Termine com uma pergunta ou CTA natural
- NÃO use markdown ou asteriscos
- A resposta deve ser uma ÚNICA mensagem pronta para enviar`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "Você é um vendedor humano consultivo especialista em WhatsApp. Responda sempre em português brasileiro." },
        { role: "user", content: prompt },
      ],
      max_tokens: 512,
      temperature: 0.85,
    });

    const generatedText = completion.choices[0]?.message?.content?.trim() ?? "";
    if (!generatedText) {
      res.status(500).json({ error: "IA não retornou texto" });
      return;
    }

    const [inserted] = await db
      .insert(copiesTable)
      .values({
        userId,
        clientName: clientDescription.slice(0, 100),
        product,
        context: context ?? null,
        messageType: "venda",
        tone: "amigavel",
        generatedText,
      })
      .returning();

    await incrementCopiesUsed(userId);

    res.status(201).json({
      id: inserted.id,
      generatedText,
      createdAt: inserted.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed seller mode generation");
    const msg = err instanceof Error ? err.message : "Erro ao gerar resposta";
    res.status(502).json({ error: msg });
  }
});

// POST /ai/improve-copy - Correção de Copy
router.post("/ai/improve-copy", authMiddleware, async (req: AuthRequest, res) => {
  const schema = z.object({
    originalMessage: z.string().min(10, "Mensagem muito curta para melhorar"),
    goal: z.enum(["venda", "profissional", "amigavel", "urgencia", "emocional"]).optional(),
    additionalInstructions: z.string().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos", details: parsed.error });
    return;
  }

  const userId = req.user!.id;
  const { allowed } = await canGenerateCopy(userId);
  if (!allowed) {
    res.status(429).json({ error: "Limite diário atingido. Faça upgrade para Pro!" });
    return;
  }

  const { originalMessage, goal = "venda", additionalInstructions } = parsed.data;

  const goalLabels: Record<string, string> = {
    venda: "vendas persuasivo e conversão",
    profissional: "profissional e corporativo",
    amigavel: "amigável e próximo",
    urgencia: "urgência e escassez",
    emocional: "emocional e empático",
  };

  try {
    const groq = await getGroq();
    const prompt = `Você é um copywriter profissional especializado em mensagens de WhatsApp para vendas no Brasil.

MENSAGEM ORIGINAL DO USUÁRIO:
"""
${originalMessage}
"""

OBJETIVO: Melhorar esta mensagem para ser mais ${goalLabels[goal]}
${additionalInstructions ? `INSTRUÇÕES EXTRAS: ${additionalInstructions}` : ""}

REGRAS PARA MELHORIA:
1. Mantenha a essência e a intenção da mensagem original
2. Torne mais persuasiva e envolvente
3. Use linguagem natural brasileira para WhatsApp
4. Adicione 1-2 emojis estratégicos se apropriado
5. Inclua um CTA (chamada para ação) claro no final
6. Máximo de 5 parágrafos curtos
7. NÃO use markdown ou asteriscos para formatação
8. A mensagem deve parecer escrita por um humano
9. Não remova informações importantes da mensagem original

Escreva APENAS a mensagem melhorada, sem explicações ou introdução.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "Você é um copywriter profissional. Responda sempre em português brasileiro." },
        { role: "user", content: prompt },
      ],
      max_tokens: 512,
      temperature: 0.75,
    });

    const improvedText = completion.choices[0]?.message?.content?.trim() ?? "";
    if (!improvedText) {
      res.status(500).json({ error: "IA não retornou texto" });
      return;
    }

    const [inserted] = await db
      .insert(copiesTable)
      .values({
        userId,
        clientName: "Correção de Copy",
        product: "Mensagem melhorada",
        context: `Original: ${originalMessage.slice(0, 200)}`,
        messageType: goal === "urgencia" ? "urgencia" : goal === "emocional" ? "posVenda" : "venda",
        tone: goal === "amigavel" ? "amigavel" : goal === "emocional" ? "emocional" : goal === "profissional" ? "profissional" : "direto",
        generatedText: improvedText,
      })
      .returning();

    await incrementCopiesUsed(userId);

    res.status(201).json({
      id: inserted.id,
      originalText: originalMessage,
      improvedText,
      createdAt: inserted.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to improve copy");
    const msg = err instanceof Error ? err.message : "Erro ao melhorar copy";
    res.status(502).json({ error: msg });
  }
});

// POST /ai/follow-up - Gerador de Follow-up Automático
router.post("/ai/follow-up", authMiddleware, async (req: AuthRequest, res) => {
  const schema = z.object({
    clientName: z.string().min(1),
    product: z.string().min(1),
    lastInteraction: z.string().min(5, "Descreva a última interação"),
    daysSinceLastContact: z.number().min(0),
    previousOutcome: z.enum(["interested", "no_response", "objection", "ghosted"]).optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos", details: parsed.error });
    return;
  }

  const userId = req.user!.id;
  const { allowed } = await canGenerateCopy(userId);
  if (!allowed) {
    res.status(429).json({ error: "Limite diário atingido. Faça upgrade para Pro!" });
    return;
  }

  const { clientName, product, lastInteraction, daysSinceLastContact, previousOutcome = "no_response" } = parsed.data;

  const outcomeContext: Record<string, string> = {
    interested: "O cliente demonstrou interesse mas não fechou",
    no_response: "O cliente não respondeu à última mensagem",
    objection: "O cliente fez uma objeção que não foi superada",
    ghosted: "O cliente sumiu e parou de responder",
  };

  try {
    const groq = await getGroq();
    const prompt = `Você é um especialista em follow-up de vendas pelo WhatsApp no Brasil.

DADOS:
- Cliente: ${clientName}
- Produto/Serviço: ${product}
- Última interação: ${lastInteraction}
- Dias desde o último contato: ${daysSinceLastContact}
- Situação: ${outcomeContext[previousOutcome]}

INSTRUÇÕES:
- Gere uma mensagem de follow-up natural e não-agressiva
- Considere os ${daysSinceLastContact} dias de silêncio
- Use a situação anterior para escolher a abordagem
- Se passou mais de 7 dias, use abordagem suave
- Se foram poucos dias, pode ser mais direto
- Máximo 3 parágrafos curtos
- 1 emoji no máximo
- CTA suave no final
- NÃO use markdown ou asteriscos
- Pareça um humano escrevendo, não uma IA

Escreva APENAS a mensagem de follow-up, pronta para enviar.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "Você é um especialista em follow-up de vendas via WhatsApp. Responda em português brasileiro." },
        { role: "user", content: prompt },
      ],
      max_tokens: 384,
      temperature: 0.8,
    });

    const generatedText = completion.choices[0]?.message?.content?.trim() ?? "";
    if (!generatedText) {
      res.status(500).json({ error: "IA não retornou texto" });
      return;
    }

    const [inserted] = await db
      .insert(copiesTable)
      .values({
        userId,
        clientName,
        product,
        context: `Follow-up automático - ${daysSinceLastContact} dias sem contato`,
        messageType: "followup",
        tone: "amigavel",
        generatedText,
      })
      .returning();

    await incrementCopiesUsed(userId);

    res.status(201).json({
      id: inserted.id,
      generatedText,
      followUpStrategy: getFollowUpStrategy(daysSinceLastContact, previousOutcome),
      createdAt: inserted.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed follow-up generation");
    const msg = err instanceof Error ? err.message : "Erro ao gerar follow-up";
    res.status(502).json({ error: msg });
  }
});

function getFollowUpStrategy(days: number, outcome: string): string {
  if (days <= 1) return "Follow-up rápido. Aguarde mais 24h antes do próximo.";
  if (days <= 3) return "Follow-up adequado. Ofereça valor adicional na próxima mensagem.";
  if (days <= 7) return "Gap moderado. Considere enviar conteúdo útil antes de pedir decisão.";
  return "Gap longo. Use abordagem suave com proposta de valor clara.";
}

export default router;
