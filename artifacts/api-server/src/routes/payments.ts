import { Router } from "express";
import { z } from "zod";
import { db, usersTable } from "@workspace/db";
import { authMiddleware, AuthRequest } from "../lib/middleware";
import { eq } from "drizzle-orm";

const router = Router();

// Stripe/Mercado Pago integration placeholder
// In production, replace with actual Stripe SDK calls

const PLANS = {
  free: { name: "Free", price: 0, copiesPerDay: 10, features: ["10 copies/dia", "Templates básicos", "Histórico de copies"] },
  pro: { name: "Pro", price: 29.9, copiesPerDay: 999999, features: ["Copies ilimitadas", "Modo Vendedor IA", "Correção de Copy", "Follow-up automático", "Analytics avançados", "Suporte prioritário"] },
};

router.get("/plans", (req, res) => {
  res.json(PLANS);
});

router.post("/checkout", authMiddleware, async (req: AuthRequest, res) => {
  const schema = z.object({
    plan: z.enum(["free", "pro"]),
    paymentMethod: z.enum(["stripe", "mercadopago"]).optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos", details: parsed.error });
    return;
  }

  const { plan, paymentMethod = "stripe" } = parsed.data;

  if (plan === "free") {
    // Downgrade to free
    await db
      .update(usersTable)
      .set({ plan: "free" })
      .where(eq(usersTable.id, req.user!.id));

    res.json({ success: true, plan: "free", message: "Plano alterado para Free" });
    return;
  }

  // In production, create a Stripe Checkout Session or Mercado Pago preference here
  // For now, return a mock checkout URL
  const checkoutUrl = paymentMethod === "stripe"
    ? `https://checkout.stripe.com/pay/cs_mock_${req.user!.id}`
    : `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=mock_${req.user!.id}`;

  res.json({
    success: true,
    checkoutUrl,
    message: "Redirecionando para pagamento...",
    plan: PLANS.pro,
  });
});

router.post("/webhook/stripe", async (req, res) => {
  // In production, verify Stripe webhook signature here
  // const sig = req.headers['stripe-signature'];
  // const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);

  // Handle checkout.session.completed
  // Update user plan to "pro"

  res.json({ received: true });
});

router.post("/webhook/mercadopago", async (req, res) => {
  // In production, verify Mercado Pago webhook
  // Handle payment approved
  // Update user plan to "pro"

  res.json({ received: true });
});

router.get("/subscription", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);
    if (!user.length) {
      res.status(404).json({ error: "Usuário não encontrado" });
      return;
    }

    res.json({
      plan: user[0].plan,
      planDetails: PLANS[user[0].plan as keyof typeof PLANS] || PLANS.free,
      copiesUsedToday: user[0].copiesUsedToday,
      copiesResetAt: user[0].copiesResetAt,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get subscription");
    res.status(500).json({ error: "Erro ao buscar assinatura" });
  }
});

export default router;
