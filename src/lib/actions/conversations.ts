"use server";

import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { generateAiReply } from "@/lib/ai/aiEmployee";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentAgent } from "@/lib/current-agent";
import type { ConversationChannel, ConversationStatus } from "@prisma/client";

const CHANNEL_LABELS: Record<ConversationChannel, string> = {
  WHATSAPP: "WhatsApp",
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  EMAIL: "Email",
  WEBCHAT: "Web Chat",
};

export async function getConversations(channel?: ConversationChannel) {
  const agent = await getCurrentAgent();
  return prisma.conversation.findMany({
    where: { businessId: agent.businessId, ...(channel ? { channel } : {}) },
    include: {
      contact: true,
      assignedAgent: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getConversation(id: string) {
  const agent = await getCurrentAgent();
  return prisma.conversation.findFirst({
    where: { id, businessId: agent.businessId },
    include: {
      contact: {
        include: {
          deals: { include: { stage: true }, orderBy: { createdAt: "desc" } },
        },
      },
      assignedAgent: true,
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function startConversation(contactId: string) {
  const agent = await getCurrentAgent();
  const conversation = await prisma.conversation.create({
    data: { businessId: agent.businessId, contactId },
  });

  await logActivity({
    businessId: agent.businessId,
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
 * No session exists on the webhook path, so businessId is always derived
 * from the conversation row itself rather than passed in.
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
  const businessId = conversation.businessId;

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
    data: { businessId, conversationId, sender: "CUSTOMER", body: text },
  });

  let aiReply: string | null = null;

  if (conversation.status === "AI_HANDLING") {
    const [resources, business] = await Promise.all([
      prisma.businessResource.findMany({ where: { businessId } }),
      prisma.business.findUnique({ where: { id: businessId } }),
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
      business?.name
    );
    aiReply = reply;

    await prisma.message.create({
      data: { businessId, conversationId, sender: "AI", body: reply },
    });

    if (escalate) {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { status: "ESCALATED" },
      });
      await logActivity({
        businessId,
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
 * always include enough profile info to do better than that). No session
 * exists here, so the caller passes `businessId` straight from the
 * ChannelConnection row it already has in hand.
 */
export async function findOrCreateConversationForExternalThread(params: {
  businessId: string;
  channelConnectionId: string;
  channel: ConversationChannel;
  externalThreadId: string;
  senderDisplayName?: string;
}) {
  const { businessId } = params;
  const existing = await prisma.conversation.findFirst({
    where: {
      businessId,
      channelConnectionId: params.channelConnectionId,
      externalThreadId: params.externalThreadId,
      status: { not: "CLOSED" },
    },
    orderBy: { createdAt: "desc" },
  });
  if (existing) return existing;

  let contact =
    params.channel === "WHATSAPP"
      ? await prisma.contact.findFirst({ where: { businessId, phone: params.externalThreadId } })
      : null;

  if (!contact) {
    const label = CHANNEL_LABELS[params.channel];
    const [firstName, ...rest] = (params.senderDisplayName ?? `${label} Customer`).split(" ");

    contact = await prisma.contact.create({
      data: {
        businessId,
        firstName: firstName || label,
        lastName: rest.join(" ") || "Customer",
        phone: params.channel === "WHATSAPP" ? params.externalThreadId : null,
      },
    });

    await logActivity({
      businessId,
      type: "CONTACT_CREATED",
      description: `${contact.firstName} ${contact.lastName} was added as a contact.`,
      contactId: contact.id,
    });
  }

  const conversation = await prisma.conversation.create({
    data: {
      businessId,
      contactId: contact.id,
      channel: params.channel,
      channelConnectionId: params.channelConnectionId,
      externalThreadId: params.externalThreadId,
    },
  });

  await logActivity({
    businessId,
    type: "CONVERSATION_STARTED",
    description: `A new ${CHANNEL_LABELS[params.channel]} conversation was started.`,
    contactId: contact.id,
  });

  return conversation;
}

/**
 * Regenerates what the AI Employee would say next, without sending or
 * storing anything — lets an agent taking over an escalated conversation
 * see (and edit) a real AI-drafted starting point instead of typing from
 * scratch. Reuses the exact same engine as real customer replies.
 */
export async function getSuggestedReply(conversationId: string): Promise<string | null> {
  const agent = await getCurrentAgent();
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, businessId: agent.businessId },
    include: { messages: { orderBy: { createdAt: "desc" }, take: 20 } },
  });
  if (!conversation) return null;

  const lastCustomerMessage = conversation.messages.find((m) => m.sender === "CUSTOMER");
  if (!lastCustomerMessage) return null;

  const history = conversation.messages
    .filter((m) => m.id !== lastCustomerMessage.id)
    .slice()
    .reverse()
    .map((m) => ({ sender: m.sender, body: m.body }));

  const [resources, business] = await Promise.all([
    prisma.businessResource.findMany({ where: { businessId: agent.businessId } }),
    prisma.business.findUnique({ where: { id: agent.businessId } }),
  ]);

  const { reply } = await generateAiReply(history, lastCustomerMessage.body, resources, business?.name);
  return reply;
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
  const agent = await getCurrentAgent();
  const text = body.trim();
  if (!text) return;

  await prisma.message.create({
    data: { businessId: agent.businessId, conversationId, sender: "AGENT", body: text },
  });

  await prisma.conversation.updateMany({
    where: { id: conversationId, businessId: agent.businessId },
    data: {
      updatedAt: new Date(),
      ...(assignedAgentId ? { assignedAgentId } : {}),
    },
  });

  revalidatePath(`/inbox/${conversationId}`);
  revalidatePath("/inbox");
}

export async function assignConversationToSelf(conversationId: string) {
  const agent = await getCurrentAgent();
  await prisma.conversation.updateMany({
    where: { id: conversationId, businessId: agent.businessId },
    data: { assignedAgentId: agent.id },
  });

  revalidatePath(`/inbox/${conversationId}`);
  revalidatePath("/inbox");
}

export async function setConversationStatus(
  conversationId: string,
  status: ConversationStatus
) {
  const agent = await getCurrentAgent();
  const conversation = await prisma.conversation.findFirstOrThrow({
    where: { id: conversationId, businessId: agent.businessId },
  });
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { status },
  });

  if (status === "ESCALATED") {
    await logActivity({
      businessId: agent.businessId,
      type: "CONVERSATION_ESCALATED",
      description: "Conversation manually escalated to a human agent.",
      contactId: conversation.contactId,
    });
  }

  revalidatePath(`/inbox/${conversationId}`);
  revalidatePath("/inbox");
}
