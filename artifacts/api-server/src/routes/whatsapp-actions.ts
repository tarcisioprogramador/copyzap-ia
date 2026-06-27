import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { sendTextMessage } from "../lib/whatsapp";
import { db, conversations, messages } from "@workspace/db";
import { logger } from "../lib/logger";
import Groq from "groq-sdk";

const router = Router();

const SendMessageSchema = z.object({
  phoneNumber: z.string().min(1, "Número de telefone é obrigatório"),
  message: z.string().min(1, "Mensagem é obrigatória").max(4096, "Mensagem muito longa"),
  contactName: z.string().optional().default("Lead"),
});

// POST /whatsapp/send - Enviar mensagem proativa para um lead
router.post("/whatsapp/send", async (req, res) => {
  const parsed = SendMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error });
    return;
  }

  const { phoneNumber, message, contactName } = parsed.data;

  try {
    const result = await sendTextMessage(phoneNumber, message);

    // Save to conversation history
    const conversationTitle = `wa:${phoneNumber}`;
    const existing = await db
      .select()
      .from(conversations)
      .where(eq(conversations.title, conversationTitle))
      .limit(1);

    let conversationId: number;
    if (existing.length > 0) {
      conversationId = existing[0].id;
    } else {
      const [newConv] = await db
        .insert(conversations)
        .values({ title: conversationTitle })
        .returning();
      conversationId = newConv.id;
    }

    await db.insert(messages).values({
      conversationId,
      role: "assistant",
      content: `[Mensagem enviada via WhatsApp para ${phoneNumber}]: ${message}`,
    });

    logger.info({ phoneNumber, messageId: result.messages?.[0]?.id }, "Proactive WhatsApp message sent");
    res.json({ success: true, messageId: result.messages?.[0]?.id });
  } catch (err) {
    req.log.error({ err, phoneNumber }, "Failed to send proactive WhatsApp message");
    const msg = err instanceof Error ? err.message : "Erro ao enviar mensagem WhatsApp";
    res.status(502).json({ error: msg });
  }
});

// POST /whatsapp/generate-and-send - Gerar copy com IA e enviar para lead
router.post("/whatsapp/generate-and-send", async (req, res) => {
  const bodySchema = z.object({
    phoneNumber: z.string().min(1),
    clientName: z.string().min(1, "Nome do cliente é obrigatório"),
    product: z.string().min(1, "Produto é obrigatório"),
    messageType: z.enum(["venda", "followup", "urgencia", "posVenda", "objecao"]),
    value: z.string().optional(),
    context: z.string().optional(),
    tone: z.enum(["profissional", "amigavel", "direto", "emocional"]).default("direto"),
  });

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error });
    return;
  }

  const { phoneNumber, clientName, product, messageType, value, context, tone } = parsed.data;

  if (!process.env.GROQ_API_KEY) {
    res.status(500).json({ error: "GROQ_API_KEY não configurada" });
    return;
  }

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const toneLabels: Record<string, string> = {
      profissional: "profissional e confiante",
      amigavel: "amigável e descontraído",
      direto: "direto e objetivo",
      emocional: "emocional e empático",
    };

    const typeLabels: Record<string, string> = {
      venda: "Venda / Primeiro contato",
      followup: "Follow-up / Acompanhamento",
      urgencia: "Urgência / Escassez",
      posVenda: "Pós-venda / Fidelização",
      objecao: "Quebra de objeção",
    };

    const prompt = `Gere uma mensagem de WhatsApp para vendas no Brasil.

TIPO: ${typeLabels[messageType] ?? messageType}
TOM: ${toneLabels[tone] ?? tone}
CLIENTE: ${clientName}
PRODUTO: ${product}
${value ? `VALOR: R$ ${value}` : ""}
${context ? `CONTEXTO: ${context}` : ""}

REGRAS:
- Escreva APENAS a mensagem final, sem introduções
- Máximo 4 parágrafos curtos
- Linguagem natural brasileira
- 1-2 emojis no máximo
- CTA claro no final
- NÃO use markdown ou asteriscos`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "Você é um copywriter especialista em vendas pelo WhatsApp no Brasil." },
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

    // Send to WhatsApp
    const result = await sendTextMessage(phoneNumber, generatedText);

    res.status(201).json({
      success: true,
      messageId: result.messages?.[0]?.id,
      generatedText,
    });
  } catch (err) {
    req.log.error({ err, phoneNumber }, "Failed to generate and send WhatsApp message");
    const msg = err instanceof Error ? err.message : "Erro ao gerar/enviar mensagem";
    res.status(502).json({ error: msg });
  }
});

export default router;
