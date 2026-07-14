import { db, conversations, messages } from "@workspace/db";
import { eq, desc, asc } from "drizzle-orm";
import { sendTextMessage } from "./whatsapp";
import { logger } from "./logger";

const SYSTEM_PROMPT = `Você é o CopyZap AI - um assistente de vendas brasileiro especialista em conversão pelo WhatsApp.

REGRAS FUNDAMENTAIS:
1. Você é um vendedor consultivo - nunca pareça robô
2. Responda de forma natural e conversacional, como um brasileiro
3. Seja breve e direto (máximo 3 parágrafos no WhatsApp)
4. Conheça o cliente e use o nome dele
5. Guie a conversa para a venda de forma natural
6. Supere objeções com empatia e argumentos concretos
7. Peça ação específica no final (WhatsApp, agendamento, etc.)
8. NUNCA use markdown ou asteriscos - apenas texto puro
9. Use linguagem brasileira autêntica (contrações, gírias leves)
10. Máximo 1-2 emojis relevantes

CONTEXTO: Você está conversando com leads no WhatsApp de uma empresa.
Seu objetivo é qualificar, nutrir e converter esses leads em clientes.`;

interface MessageHistory {
  role: "assistant" | "user";
  content: string;
}

export async function getOrCreateConversation(phoneNumber: string, contactName: string): Promise<number> {
  const conversationTitle = `wa:${phoneNumber}`;

  // Try to find existing conversation first
  const existingConversations = await db
    .select()
    .from(conversations)
    .where(eq(conversations.title, conversationTitle))
    .limit(1);

  if (existingConversations.length > 0) {
    return existingConversations[0].id;
  }

  // Create new conversation — handle race condition gracefully
  try {
    const [newConversation] = await db
      .insert(conversations)
      .values({ title: conversationTitle })
      .returning();
    return newConversation.id;
  } catch (err) {
    // If insert failed (unique constraint race), retry the select
    const retry = await db
      .select()
      .from(conversations)
      .where(eq(conversations.title, conversationTitle))
      .limit(1);
    if (retry.length > 0) {
      return retry[0].id;
    }
    throw err;
  }
}

export async function saveMessage(
  conversationId: number,
  role: "assistant" | "user",
  content: string,
): Promise<void> {
  await db.insert(messages).values({
    conversationId,
    role,
    content,
  });
}

export async function getConversationHistory(conversationId: number): Promise<MessageHistory[]> {
  const history = await db
    .select({ role: messages.role, content: messages.content })
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt))
    .limit(20);

  // Map database role to our MessageHistory format
  return history.map((m) => ({
    role: m.role as "assistant" | "user",
    content: m.content,
  }));
}

function buildProductInfo(): string {
  const product = process.env.WHATSAPP_PRODUCT || "nossos produtos/serviços";
  const company = process.env.WHATSAPP_COMPANY || "nossa empresa";
  return `Empresa: ${company}\nProduto/Serviço: ${product}`;
}

async function generateAIResponse(
  userMessage: string,
  history: MessageHistory[],
): Promise<string> {
  const Groq = (await import("groq-sdk")).default;

  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY must be set");
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const productInfo = buildProductInfo();

  // Build messages array — avoid duplicate user messages.
  // History already includes the current user message (saved before calling this function),
  // so we only append history and do NOT add userMessage again.
  const messages_list = [
    { role: "system" as const, content: `${SYSTEM_PROMPT}\n\nINFORMAÇÕES DO NEGÓCIO:\n${productInfo}` },
    // History already contains the user's latest message at the end, so we exclude it from history
    // and pass it explicitly as the final user message.
    ...history.slice(0, -1).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: userMessage },
  ];

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: messages_list,
    max_tokens: 512,
    temperature: 0.8,
  });

  const response = completion.choices[0]?.message?.content?.trim() ?? "";
  return response || "Desculpe, não consegui processar sua mensagem agora. Pode repetir?";
}

export async function handleIncomingMessage(
  phoneNumber: string,
  contactName: string,
  messageText: string,
): Promise<void> {
  logger.info({ phoneNumber, contactName, messageText }, "Processing incoming WhatsApp message");

  try {
    // Get or create conversation
    const conversationId = await getOrCreateConversation(phoneNumber, contactName);

    // Save user message
    await saveMessage(conversationId, "user", messageText);

    // Get conversation history
    const history = await getConversationHistory(conversationId);

    // Generate AI response
    const aiResponse = await generateAIResponse(messageText, history);

    // Save AI response
    await saveMessage(conversationId, "assistant", aiResponse);

    // Send response via WhatsApp
    await sendTextMessage(phoneNumber, aiResponse);

    logger.info({ phoneNumber, conversationId }, "WhatsApp conversation handled successfully");
  } catch (err) {
    logger.error({ err, phoneNumber }, "Failed to handle WhatsApp message");
    // Try to send a fallback message
    try {
      await sendTextMessage(
        phoneNumber,
        "Olá! Obrigado pela mensagem. Nosso time está analisando e logo retornaremos. 😊",
      );
    } catch {
      // Ignore fallback errors
    }
  }
}
