import { Router } from "express";
import { db } from "@workspace/db";
import { copiesTable } from "@workspace/db";
import { GenerateCopyBody, DeleteCopyParams, UpdateCopyOutcomeParams, UpdateCopyOutcomeBody } from "@workspace/api-zod";
import Groq from "groq-sdk";
import { eq, sql, desc } from "drizzle-orm";

if (!process.env.GROQ_API_KEY) {
  throw new Error("GROQ_API_KEY must be set.");
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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

const salesFrameworks: Record<string, string> = {
  venda: `Frameworks obrigatórios para esta mensagem:
- AIDA: capture atenção na 1ª linha, gere interesse com benefício concreto, crie desejo com prova social ou resultado, finalize com CTA claro
- SPIN: identifique a situação do cliente, explore o problema que o produto resolve, mostre implicação de não agir, conduza à necessidade de solução
- Use gatilho de autoridade ou prova social quando fizer sentido
- Personalize com o nome do cliente de forma natural`,

  followup: `Frameworks obrigatórios para esta mensagem:
- Reciprocidade: ofereça algo de valor (dica, insight, conteúdo) antes de pedir resposta
- Referência temporal: mencione o último contato ou proposta enviada
- CTA suave: convite para conversa, não pressão agressiva
- Mostre que você lembra do contexto específico do cliente`,

  urgencia: `Frameworks obrigatórios para esta mensagem:
- Escassez real: prazo, vagas limitadas ou bônus que expira (use apenas se plausível no contexto)
- FOMO: o que o cliente perde se não agir agora
- Deadline concreto: data ou horário específico
- Mantenha credibilidade — urgência falsa destrói confiança`,

  posVenda: `Frameworks obrigatórios para esta mensagem:
- Gratidão genuína pela compra
- Check-in de satisfação (NPS informal)
- Peça indicação de forma natural, oferecendo benefício mútuo
- Abra porta para upsell ou recompra futura sem ser invasivo`,

  objecao: `Frameworks obrigatórios para esta mensagem:
- Técnica "Sinto, Senti, Descobri": valide a objeção, normalize com outros clientes, redirecione com solução
- Reframe: transforme a objeção (ex: "caro") em investimento ou valor percebido
- Comparativo: custo de não resolver o problema vs. investimento no produto
- Nunca confronte — empatia primeiro, argumento depois`,
};

const SYSTEM_PROMPT = `Você é o CopyZap AI — um especialista elite em vendas pelo WhatsApp no Brasil, com 15+ anos de experiência em copywriting de conversão, neuromarketing e técnicas de fechamento.

Seu conhecimento inclui:
- Frameworks: AIDA, PAS, SPIN, BAB (Before-After-Bridge), Feel-Felt-Found
- Gatilhos mentais: escassez, urgência, prova social, reciprocidade, autoridade, ancoragem
- Comunicação WhatsApp: mensagens curtas, parágrafos de 1-2 linhas, tom conversacional brasileiro
- Anti-padrões: nunca parecer robô, nunca usar linguagem corporativa fria, nunca ser agressivo demais

Você escreve APENAS a mensagem final pronta para colar no WhatsApp. Sem introduções, sem explicações, sem markdown.`;

function buildPrompt(
  clientName: string,
  product: string,
  messageType: string,
  tone: string,
  value?: string,
  context?: string
): string {
  const typeLabel = messageTypeLabels[messageType] ?? messageType;
  const toneLabel = toneLabels[tone] ?? tone;
  const framework = salesFrameworks[messageType] ?? "";

  let prompt = `Gere uma mensagem de WhatsApp do tipo "${typeLabel}" com tom ${toneLabel}.

DADOS DO LEAD:
- Nome do cliente: ${clientName}
- Produto/Serviço: ${product}`;

  if (value) prompt += `\n- Valor: R$ ${value}`;
  if (context) prompt += `\n- Contexto da conversa: ${context}`;

  prompt += `

${framework}

REGRAS DE FORMATO:
- Escreva diretamente a mensagem, sem "Aqui está" ou "Segue"
- Linguagem natural brasileira (como um vendedor top escreveria no celular)
- Máximo 4 parágrafos curtos (ideal para WhatsApp)
- 1-2 emojis relevantes no máximo
- CTA claro e específico no final (ex: "Posso te mandar os detalhes?", "Fechamos hoje?")
- Parecer 100% humano — varie estrutura, use contrações naturais
- Não use asteriscos, negrito ou formatação markdown
- Use o nome "${clientName}" de forma natural (não em toda frase)

Escreva APENAS a mensagem final.`;

  return prompt;
}

const MESSAGE_TYPES = ["venda", "followup", "urgencia", "posVenda", "objecao"] as const;

function serializeCopy(c: typeof copiesTable.$inferSelect) {
  return {
    ...c,
    createdAt: c.createdAt.toISOString(),
    outcomeAt: c.outcomeAt?.toISOString() ?? null,
  };
}

interface TypeMetrics {
  total: number;
  sent: number;
  responded: number;
  noResponse: number;
  pending: number;
  responseRate: number;
}

function computeMetrics(rows: { messageType: string; outcome: string | null }[]) {
  const byType: Record<string, TypeMetrics> = {};

  for (const type of MESSAGE_TYPES) {
    byType[type] = { total: 0, sent: 0, responded: 0, noResponse: 0, pending: 0, responseRate: 0 };
  }

  for (const row of rows) {
    const bucket = byType[row.messageType] ?? {
      total: 0,
      sent: 0,
      responded: 0,
      noResponse: 0,
      pending: 0,
      responseRate: 0,
    };
    if (!byType[row.messageType]) byType[row.messageType] = bucket;

    bucket.total++;
    if (!row.outcome) bucket.pending++;
    else if (row.outcome === "sent") bucket.sent++;
    else if (row.outcome === "responded") bucket.responded++;
    else if (row.outcome === "no_response") bucket.noResponse++;

    const resolved = bucket.responded + bucket.noResponse;
    bucket.responseRate = resolved > 0 ? Math.round((bucket.responded / resolved) * 1000) / 10 : 0;
  }

  const overall: TypeMetrics = { total: 0, sent: 0, responded: 0, noResponse: 0, pending: 0, responseRate: 0 };
  for (const m of Object.values(byType)) {
    overall.total += m.total;
    overall.sent += m.sent;
    overall.responded += m.responded;
    overall.noResponse += m.noResponse;
    overall.pending += m.pending;
  }
  const overallResolved = overall.responded + overall.noResponse;
  overall.responseRate =
    overallResolved > 0 ? Math.round((overall.responded / overallResolved) * 1000) / 10 : 0;

  return { overall, byType };
}

router.get("/copies/stats", async (req, res) => {
  try {
    const total = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(copiesTable);

    const byTypeRows = await db
      .select({
        messageType: copiesTable.messageType,
        count: sql<number>`count(*)::int`,
      })
      .from(copiesTable)
      .groupBy(copiesTable.messageType);

    const todayRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(copiesTable)
      .where(sql`date(created_at) = current_date`);

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

router.get("/copies/analytics", async (req, res) => {
  try {
    const rows = await db
      .select({
        messageType: copiesTable.messageType,
        outcome: copiesTable.outcome,
      })
      .from(copiesTable);

    res.json(computeMetrics(rows));
  } catch (err) {
    req.log.error({ err }, "Failed to get copy analytics");
    res.status(500).json({ error: "Failed to get analytics" });
  }
});

router.get("/copies", async (req, res) => {
  try {
    const copies = await db
      .select()
      .from(copiesTable)
      .orderBy(desc(copiesTable.createdAt))
      .limit(50);

    res.json(copies.map(serializeCopy));
  } catch (err) {
    req.log.error({ err }, "Failed to list copies");
    res.status(500).json({ error: "Failed to list copies" });
  }
});

router.post("/copies", async (req, res) => {
  const parsed = GenerateCopyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error });
    return;
  }

  const { clientName, product, value, context, messageType, tone = "profissional" } = parsed.data;

  try {
    const prompt = buildPrompt(clientName, product, messageType, tone, value ?? undefined, context ?? undefined);

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      max_tokens: 512,
      temperature: 0.85,
    });

    const generatedText = completion.choices[0]?.message?.content?.trim() ?? "";

    if (!generatedText) {
      res.status(500).json({ error: "A IA não retornou texto. Tente novamente." });
      return;
    }

    const [inserted] = await db
      .insert(copiesTable)
      .values({
        clientName,
        product,
        value: value ?? null,
        context: context ?? null,
        messageType,
        tone,
        generatedText,
      })
      .returning();

    res.status(201).json(serializeCopy(inserted));
  } catch (err: unknown) {
    req.log.error({ err }, "Failed to generate copy");
    const msg = err instanceof Error ? err.message : "Erro ao gerar copy com IA";
    res.status(502).json({ error: msg });
  }
});

router.patch("/copies/:id/outcome", async (req, res) => {
  const paramsParsed = UpdateCopyOutcomeParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const bodyParsed = UpdateCopyOutcomeBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Invalid input", details: bodyParsed.error });
    return;
  }

  try {
    const [updated] = await db
      .update(copiesTable)
      .set({
        outcome: bodyParsed.data.outcome,
        outcomeAt: new Date(),
      })
      .where(eq(copiesTable.id, paramsParsed.data.id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Copy not found" });
      return;
    }

    res.json(serializeCopy(updated));
  } catch (err) {
    req.log.error({ err }, "Failed to update copy outcome");
    res.status(500).json({ error: "Failed to update outcome" });
  }
});

router.delete("/copies/:id", async (req, res) => {
  const parsed = DeleteCopyParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    await db.delete(copiesTable).where(eq(copiesTable.id, parsed.data.id));
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Failed to delete copy");
    res.status(500).json({ error: "Failed to delete copy" });
  }
});

export default router;
