import { prisma } from "@/lib/prisma";
import {
  deliverCustomerMessage,
  findOrCreateConversationForExternalThread,
} from "@/lib/actions/conversations";
import { sendWhatsAppMessage } from "@/lib/channels/whatsapp";
import { sendMetaMessagingMessage } from "@/lib/channels/messenger";
import type { ChannelConnection, ConversationChannel } from "@prisma/client";

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
