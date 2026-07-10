import { prisma } from "@/lib/prisma";
import { handleWebhookVerification } from "@/lib/channels/verifyWebhook";
import { parseMetaMessagingWebhook } from "@/lib/channels/messenger";
import { processInboundMessage } from "@/lib/channels/inbound";
import { parseFacebookCommentWebhook } from "@/lib/channels/facebookComments";
import { processInboundComment } from "@/lib/channels/commentInbound";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ connectionId: string }> }
) {
  const { connectionId } = await params;
  const connection = await prisma.channelConnection.findUnique({ where: { id: connectionId } });
  if (!connection) return new Response("Not found", { status: 404 });

  return handleWebhookVerification(request, connection.webhookVerifyToken);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ connectionId: string }> }
) {
  const { connectionId } = await params;
  const connection = await prisma.channelConnection.findUnique({ where: { id: connectionId } });
  if (!connection) return new Response("Not found", { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  // TEMPORARY diagnostic (remove once webhook delivery is confirmed):
  // vercel logs is unreliable here, so dump the raw payload where we can
  // actually query it.
  await prisma.channelConnection.update({
    where: { id: connectionId },
    data: {
      lastErrorMessage: `DEBUG ${new Date().toISOString()}: ${JSON.stringify(body).slice(0, 800)}`,
    },
  });

  // Page webhooks deliver both private messages (`messaging`) and public
  // feed activity like comments (`changes` with field "feed") to the same
  // callback URL — check both. Awaited deliberately: serverless functions
  // can freeze/terminate as soon as a response is returned, so
  // fire-and-forget work here would silently never complete.
  const parsedMessage = parseMetaMessagingWebhook(body);
  if (parsedMessage) {
    try {
      await processInboundMessage({
        connection,
        channel: "FACEBOOK",
        externalThreadId: parsedMessage.externalThreadId,
        senderDisplayName: parsedMessage.senderDisplayName,
        text: parsedMessage.text,
      });
    } catch (error) {
      console.error("Messenger inbound processing failed:", error);
    }
  }

  const parsedComment = parseFacebookCommentWebhook(body);
  if (parsedComment) {
    try {
      await processInboundComment({
        connection,
        channel: "FACEBOOK",
        comment: parsedComment,
      });
    } catch (error) {
      console.error("Facebook comment processing failed:", error);
    }
  }

  return new Response("EVENT_RECEIVED", { status: 200 });
}
