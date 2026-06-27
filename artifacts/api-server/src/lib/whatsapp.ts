import { logger } from "./logger";

const API_VERSION = "v22.0";
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

interface WhatsAppText {
  body: string;
  preview_url?: boolean;
}

interface WhatsAppResponse {
  messaging_product: "whatsapp";
  contacts: { input: string; wa_id: string }[];
  messages: { id: string }[];
}

function getPhoneNumberId(): string {
  const id = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!id) throw new Error("WHATSAPP_PHONE_NUMBER_ID must be set");
  return id;
}

function getAccessToken(): string {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token) throw new Error("WHATSAPP_ACCESS_TOKEN must be set");
  return token;
}

export async function sendTextMessage(to: string, text: string): Promise<WhatsAppResponse> {
  const phoneNumberId = getPhoneNumberId();
  const accessToken = getAccessToken();

  const url = `${BASE_URL}/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: {
      body: text,
      preview_url: false,
    } satisfies WhatsAppText,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error({ status: response.status, body: errorBody, to }, "Failed to send WhatsApp message");
    throw new Error(`WhatsApp API error: ${response.status} - ${errorBody}`);
  }

  const data = (await response.json()) as WhatsAppResponse;
  logger.info({ to, messageId: data.messages?.[0]?.id }, "WhatsApp message sent");
  return data;
}
