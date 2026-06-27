import { Router } from "express";
import { handleIncomingMessage } from "../lib/conversation-handler";
import { logger } from "../lib/logger";

const router = Router();

// WhatsApp Cloud API Webhook Verification (GET)
// Meta sends this to verify your webhook endpoint
router.get("/whatsapp/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    logger.info("WhatsApp webhook verified successfully");
    res.status(200).send(challenge);
  } else {
    logger.warn({ mode, token }, "WhatsApp webhook verification failed");
    res.sendStatus(403);
  }
});

// WhatsApp Cloud API Incoming Messages (POST)
// Meta sends incoming messages here
router.post("/whatsapp/webhook", async (req, res) => {
  // Always acknowledge receipt immediately (WhatsApp requires 200 OK)
  res.sendStatus(200);

  try {
    const body = req.body;

    // Verify it's a WhatsApp business account event
    if (body.object !== "whatsapp_business_account") {
      return;
    }

    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value;
        const messages = value.messages ?? [];
        const contacts = value.contacts ?? [];

        for (const msg of messages) {
          // Only process text messages
          if (msg.type !== "text") continue;

          const phoneNumber = msg.from;
          const messageText = msg.text?.body ?? "";

          // Find contact name (fallback to phone number)
          const contact = contacts.find((c: { wa_id: string; profile?: { name?: string } }) => c.wa_id === phoneNumber);
          const contactName = contact?.profile?.name ?? phoneNumber;

          // Process message asynchronously
          handleIncomingMessage(phoneNumber, contactName, messageText).catch((err) => {
            logger.error({ err, phoneNumber }, "Error in async message handler");
          });
        }
      }
    }
  } catch (err) {
    logger.error({ err }, "Error processing WhatsApp webhook payload");
  }
});

// Status callback endpoint (optional - for delivery receipts)
router.post("/whatsapp/status", (req, res) => {
  res.sendStatus(200);
});

export default router;
