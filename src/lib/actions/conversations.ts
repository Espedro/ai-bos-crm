"use server";

import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { generateAiReply } from "@/lib/ai/aiEmployee";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ConversationChannel, ConversationStatus } from "@prisma/client";

const CHANNEL_LABELS: Record<ConversationChannel, string> = {
  WHATSAPP: "WhatsApp",
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  EMAIL: "Email",
  WEBCHAT: "Web Chat",
};

export async function getConversations(channel?: ConversationChannel) {
  return prisma.conversation.findMany({
    where: channel ? { channel } : undefined,
    include: {
      contact: true,
      assignedAgent: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getConversation(id: string) {
  return prisma.conversation.findUnique({
    where: { id },
    include: {
      contact: true,
      assignedAgent: true,
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function startConversation(contactId: string) {
  const conversation = await prisma.conversation.create({
    data: { contactId },
  });

  await logActivity({
    type: "CONVERSATION_STARTED",
    description: "A new WhatsApp conversation was started.",
    contactId,
  });

  revalidatePath("/inbox");
  revalidatePath(`/contacts/${contactId}`);
  redirect(`/inbox/${conversation.id}`);
}

/**
 * Core delivery logic shared by the simulated "type as customer" UI path
 * and the real webhook path (src/lib/channels/inbound.ts). Stores the
 * customer message, runs the AI Employee if the conversation is AI-handled,
 * and escalates when needed. Returns the AI's reply text (if any) so a
 * caller connected to a real channel can send it back out to the customer.
 */
export async function deliverCustomerMessage(
  conversationId: string,
  text: string
): Promise<{ aiReply: string | null }> {
  const MAX_HISTORY_MESSAGES = 20;

  const conversation = await prisma.conversation.findUniqueOrThrow({
    where: { id: conversationId },
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: MAX_HISTORY_MESSAGES },
    },
  });

  // WhatsApp (and other channel) webhooks retry delivery when our response
  // is slow, resending the identical message — this treats a same-text
  // repeat within a minute as a retry rather than reprocessing it, which
  // previously caused racing duplicate AI calls for one customer message.
  const lastMessage = conversation.messages[0];
  const DUPLICATE_WINDOW_MS = 60_000;
  if (
    lastMessage?.sender === "CUSTOMER" &&
    lastMessage.body === text &&
    Date.now() - lastMessage.createdAt.getTime() < DUPLICATE_WINDOW_MS
  ) {
    return { aiReply: null };
  }

  await prisma.message.create({
    data: { conversationId, sender: "CUSTOMER", body: text },
  });

  let aiReply: string | null = null;

  if (conversation.status === "AI_HANDLING") {
    const [resources, profile] = await Promise.all([
      prisma.businessResource.findMany(),
      prisma.businessProfile.findFirst(),
    ]);
    const history = conversation.messages
      .slice()
      .reverse()
      .map((m) => ({
        sender: m.sender,
        body: m.body,
      }));
    const { reply, escalate } = await generateAiReply(
      history,
      text,
      resources,
      profile?.name
    );
    aiReply = reply;

    await prisma.message.create({
      data: { conversationId, sender: "AI", body: reply },
    });

    if (escalate) {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { status: "ESCALATED" },
      });
      await logActivity({
        type: "CONVERSATION_ESCALATED",
        description: "AI Employee escalated the conversation to a human agent.",
        contactId: conversation.contactId,
      });
    }
  }

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  return { aiReply };
}

/**
 * Used by the real-channel webhook path (src/lib/channels/inbound.ts) to
 * find the ongoing conversation for a given customer on a given connected
 * channel, or start a new one (creating a placeholder Contact if this is
 * the first time we've seen this external thread — Meta webhooks don't
 * always include enough profile info to do better than that).
 */
export async function findOrCreateConversationForExternalThread(params: {
  channelConnectionId: string;
  channel: ConversationChannel;
  externalThreadId: string;
  senderDisplayName?: string;
}) {
  const existing = await prisma.conversation.findFirst({
    where: {
      channelConnectionId: params.channelConnectionId,
      externalThreadId: params.externalThreadId,
      status: { not: "CLOSED" },
    },
    orderBy: { createdAt: "desc" },
  });
  if (existing) return existing;

  let contact =
    params.channel === "WHATSAPP"
      ? await prisma.contact.findFirst({ where: { phone: params.externalThreadId } })
      : null;

  if (!contact) {
    const label = CHANNEL_LABELS[params.channel];
    const [firstName, ...rest] = (params.senderDisplayName ?? `${label} Customer`).split(" ");

    contact = await prisma.contact.create({
      data: {
        firstName: firstName || label,
        lastName: rest.join(" ") || "Customer",
        phone: params.channel === "WHATSAPP" ? params.externalThreadId : null,
      },
    });

    await logActivity({
      type: "CONTACT_CREATED",
      description: `${contact.firstName} ${contact.lastName} was added as a contact.`,
      contactId: contact.id,
    });
  }

  const conversation = await prisma.conversation.create({
    data: {
      contactId: contact.id,
      channel: params.channel,
      channelConnectionId: params.channelConnectionId,
      externalThreadId: params.externalThreadId,
    },
  });

  await logActivity({
    type: "CONVERSATION_STARTED",
    description: `A new ${CHANNEL_LABELS[params.channel]} conversation was started.`,
    contactId: contact.id,
  });

  return conversation;
}

export async function sendCustomerMessage(conversationId: string, body: string) {
  const text = body.trim();
  if (!text) return;

  await deliverCustomerMessage(conversationId, text);

  revalidatePath(`/inbox/${conversationId}`);
  revalidatePath("/inbox");
}

export async function sendAgentMessage(
  conversationId: string,
  body: string,
  assignedAgentId?: string
) {
  const text = body.trim();
  if (!text) return;

  await prisma.message.create({
    data: { conversationId, sender: "AGENT", body: text },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      updatedAt: new Date(),
      ...(assignedAgentId ? { assignedAgentId } : {}),
    },
  });

  revalidatePath(`/inbox/${conversationId}`);
  revalidatePath("/inbox");
}

export async function setConversationStatus(
  conversationId: string,
  status: ConversationStatus
) {
  const conversation = await prisma.conversation.update({
    where: { id: conversationId },
    data: { status },
  });

  if (status === "ESCALATED") {
    await logActivity({
      type: "CONVERSATION_ESCALATED",
      description: "Conversation manually escalated to a human agent.",
      contactId: conversation.contactId,
    });
  }

  revalidatePath(`/inbox/${conversationId}`);
  revalidatePath("/inbox");
}
