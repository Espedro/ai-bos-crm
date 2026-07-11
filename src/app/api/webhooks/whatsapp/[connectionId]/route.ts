import { prisma } from "@/lib/prisma";
import { handleWebhookVerification } from "@/lib/channels/verifyWebhook";
import { parseWhatsAppWebhook } from "@/lib/channels/whatsapp";
import { processInboundMessage, resolveConnectionForRecipient } from "@/lib/channels/inbound";

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

  const parsed = parseWhatsAppWebhook(body);
  if (parsed) {
    // Awaited deliberately: serverless functions can freeze/terminate as
    // soon as a response is returned, so fire-and-forget work here would
    // silently never complete.
    try {
      const realConnection = await resolveConnectionForRecipient(connection, {
        channel: "WHATSAPP",
        phoneNumberId: parsed.phoneNumberId,
      });
      await processInboundMessage({
        connection: realConnection,
        channel: "WHATSAPP",
        externalThreadId: parsed.externalThreadId,
        senderDisplayName: parsed.senderDisplayName,
        text: parsed.text,
      });
    } catch (error) {
      console.error("WhatsApp inbound processing failed:", error);
    }
  }

  return new Response("EVENT_RECEIVED", { status: 200 });
}
