import type { ChannelConnection } from "@prisma/client";

const GRAPH_API_VERSION = "v22.0";

export type ParsedInboundMessage = {
  externalThreadId: string;
  senderDisplayName?: string;
  text: string;
};

export type ParsedWhatsAppWebhook = ParsedInboundMessage & {
  /**
   * Meta's `whatsapp_business_account` Webhooks product only supports ONE
   * callback URL per app — every WABA subscribed to this app delivers here,
   * regardless of which business connected it. `phoneNumberId` comes from
   * `value.metadata.phone_number_id`, which the webhook route uses to look
   * up the right business's ChannelConnection instead of trusting the
   * URL's connectionId segment.
   */
  phoneNumberId: string;
};

/**
 * Parses a WhatsApp Cloud API webhook POST body. Returns null when the
 * payload isn't an inbound text message (e.g. a delivery/read status
 * update), which WhatsApp also sends to the same webhook.
 */
export function parseWhatsAppWebhook(body: unknown): ParsedWhatsAppWebhook | null {
  const entry = (body as { entry?: unknown[] })?.entry?.[0] as
    | { changes?: unknown[] }
    | undefined;
  const change = entry?.changes?.[0] as { value?: unknown } | undefined;
  const value = change?.value as
    | {
        metadata?: { phone_number_id?: string };
        contacts?: { profile?: { name?: string }; wa_id?: string }[];
        messages?: { from?: string; text?: { body?: string }; type?: string }[];
      }
    | undefined;

  const message = value?.messages?.[0];
  const phoneNumberId = value?.metadata?.phone_number_id;
  if (!message || message.type !== "text" || !message.text?.body || !message.from || !phoneNumberId) {
    return null;
  }

  return {
    phoneNumberId,
    externalThreadId: message.from,
    senderDisplayName: value?.contacts?.[0]?.profile?.name,
    text: message.text.body,
  };
}

export async function sendWhatsAppMessage(
  connection: ChannelConnection,
  to: string,
  text: string
): Promise<void> {
  if (!connection.accessToken || !connection.phoneNumberId) {
    throw new Error("WhatsApp connection is missing an access token or phone number ID");
  }

  const response = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${connection.phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${connection.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`WhatsApp send failed (${response.status}): ${errorBody}`);
  }
}
