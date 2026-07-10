import type { ChannelConnection } from "@prisma/client";
import type { ParsedInboundMessage } from "@/lib/channels/whatsapp";

const GRAPH_API_VERSION = "v22.0";

/**
 * Facebook Messenger and Instagram DM webhooks share the same
 * `entry[].messaging[]` payload shape (Messenger Platform) — this parser
 * works for both, distinguished only by which webhook route received it.
 */
export function parseMetaMessagingWebhook(body: unknown): ParsedInboundMessage | null {
  const entry = (body as { entry?: unknown[] })?.entry?.[0] as
    | { messaging?: unknown[] }
    | undefined;
  const event = entry?.messaging?.[0] as
    | { sender?: { id?: string }; message?: { text?: string; is_echo?: boolean } }
    | undefined;

  if (!event?.sender?.id || !event.message?.text || event.message.is_echo) {
    return null;
  }

  return {
    externalThreadId: event.sender.id,
    text: event.message.text,
  };
}

export async function sendMetaMessagingMessage(
  connection: ChannelConnection,
  recipientId: string,
  text: string
): Promise<void> {
  if (!connection.accessToken) {
    throw new Error("Connection is missing an access token");
  }

  const response = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/me/messages?access_token=${encodeURIComponent(
      connection.accessToken
    )}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text },
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Send failed (${response.status}): ${errorBody}`);
  }
}
