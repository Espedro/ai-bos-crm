import { prisma } from "@/lib/prisma";
import {
  deliverCustomerMessage,
  findOrCreateConversationForExternalThread,
} from "@/lib/actions/conversations";
import { sendWhatsAppMessage } from "@/lib/channels/whatsapp";
import { sendMetaMessagingMessage } from "@/lib/channels/messenger";
import type { ChannelConnection, ConversationChannel } from "@prisma/client";

/**
 * Meta only supports ONE Webhooks callback URL per app per object type
 * (`page`, `whatsapp_business_account`) — every business's Page/WABA
 * subscribed to this shared app delivers to that same URL, so the
 * connectionId in the webhook route's own path can't be trusted to
 * identify which business an event belongs to once more than one business
 * shares the app. Re-resolves the real ChannelConnection from the
 * payload's own Page ID / phone number ID instead, falling back to the
 * URL-derived connection only if no match is found (e.g. malformed
 * payload) so a single-business deployment keeps working unchanged.
 */
export async function resolveConnectionForRecipient(
  urlConnection: ChannelConnection,
  match: { channel: ConversationChannel; pageId?: string; phoneNumberId?: string }
): Promise<ChannelConnection> {
  if (match.phoneNumberId) {
    const found = await prisma.channelConnection.findFirst({
      where: { channel: match.channel, phoneNumberId: match.phoneNumberId },
    });
    if (found) return found;
  }
  if (match.pageId) {
    const found = await prisma.channelConnection.findFirst({
      where: { channel: match.channel, pageId: match.pageId },
    });
    if (found) return found;
  }
  return urlConnection;
}

/**
 * Entry point for every real-channel webhook route. Finds/creates the
 * Conversation, runs the same AI Employee logic the simulated inbox uses,
 * and — if the AI (or an agent, in future) produced a reply — sends it
 * back out to the real customer over the connection's channel.
 */
export async function processInboundMessage(params: {
  connection: ChannelConnection;
  channel: ConversationChannel;
  externalThreadId: string;
  senderDisplayName?: string;
  text: string;
}) {
  const { connection, channel, externalThreadId, senderDisplayName, text } = params;

  const conversation = await findOrCreateConversationForExternalThread({
    businessId: connection.businessId,
    channelConnectionId: connection.id,
    channel,
    externalThreadId,
    senderDisplayName,
  });

  const { aiReply } = await deliverCustomerMessage(conversation.id, text);

  if (!aiReply) return;

  try {
    if (channel === "WHATSAPP") {
      await sendWhatsAppMessage(connection, externalThreadId, aiReply);
    } else {
      await sendMetaMessagingMessage(connection, externalThreadId, aiReply);
    }

    if (connection.status === "ERROR") {
      await prisma.channelConnection.update({
        where: { id: connection.id },
        data: { status: "CONNECTED", lastErrorMessage: null },
      });
    }
  } catch (error) {
    console.error(`Failed to send ${channel} reply for connection ${connection.id}:`, error);
    await prisma.channelConnection.update({
      where: { id: connection.id },
      data: {
        status: "ERROR",
        lastErrorMessage: error instanceof Error ? error.message : String(error),
      },
    });
  }
}
