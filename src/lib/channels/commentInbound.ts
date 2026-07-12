import { prisma } from "@/lib/prisma";
import { generateCommentReply } from "@/lib/ai/aiEmployee";
import { sendPublicCommentReply, sendPrivateReply } from "@/lib/channels/facebookComments";
import {
  findOrCreateConversationForExternalThread,
  deliverCustomerMessage,
} from "@/lib/actions/conversations";
import type { ChannelConnection, ConversationChannel } from "@prisma/client";
import type { ParsedComment } from "@/lib/channels/facebookComments";

/**
 * Handles one inbound public comment: skips comments the Page itself
 * posted (its own replies would otherwise loop), skips ones we've already
 * replied to (webhook retries), generates a short public nudge-to-DM
 * reply via the AI Employee, posts it back publicly, and logs it. Also
 * sends a real private reply (DM) grounded in the business's full
 * knowledge — via the same Conversation/AI pipeline real Messenger
 * messages use, so it shows up in /inbox and continues naturally if the
 * commenter replies.
 */
export async function processInboundComment(params: {
  connection: ChannelConnection;
  channel: ConversationChannel;
  comment: ParsedComment;
}) {
  const { connection, channel, comment } = params;

  if (comment.commenterId && comment.commenterId === connection.pageId) {
    return;
  }

  const existing = await prisma.commentReply.findUnique({
    where: { externalCommentId: comment.externalCommentId },
  });
  if (existing) return;

  const resources = await prisma.businessResource.findMany({
    where: { businessId: connection.businessId },
  });
  const replyText = await generateCommentReply(comment.commentText, resources);

  try {
    await sendPublicCommentReply(connection, comment.externalCommentId, replyText);

    if (connection.status === "ERROR") {
      await prisma.channelConnection.update({
        where: { id: connection.id },
        data: { status: "CONNECTED", lastErrorMessage: null },
      });
    }
  } catch (error) {
    console.error(`Failed to send public comment reply for connection ${connection.id}:`, error);
    await prisma.channelConnection.update({
      where: { id: connection.id },
      data: {
        status: "ERROR",
        lastErrorMessage: error instanceof Error ? error.message : String(error),
      },
    });
    return;
  }

  await prisma.commentReply.create({
    data: {
      businessId: connection.businessId,
      channelConnectionId: connection.id,
      channel,
      externalCommentId: comment.externalCommentId,
      postId: comment.postId,
      commenterName: comment.commenterName,
      commentText: comment.commentText,
      replyText,
    },
  });

  // Best-effort — a failure here (e.g. read_page_mailboxes not yet granted,
  // or Meta's private-reply window has passed) shouldn't undo the public
  // reply that already succeeded above.
  if (comment.commenterId) {
    try {
      const conversation = await findOrCreateConversationForExternalThread({
        businessId: connection.businessId,
        channelConnectionId: connection.id,
        channel,
        externalThreadId: comment.commenterId,
        senderDisplayName: comment.commenterName,
      });
      const { aiReply } = await deliverCustomerMessage(conversation.id, comment.commentText);
      if (aiReply) {
        await sendPrivateReply(connection, comment.externalCommentId, aiReply);
      }
    } catch (error) {
      console.error(`Failed to send private reply for connection ${connection.id}:`, error);
    }
  }
}
