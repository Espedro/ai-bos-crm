"use server";

import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { ConversationChannel } from "@prisma/client";
import {
  exchangeEmbeddedSignupCode,
  subscribeAppToWaba,
  fetchPhoneNumberDisplayName,
} from "@/lib/channels/whatsappEmbeddedSignup";

const REAL_CHANNELS: ConversationChannel[] = ["WHATSAPP", "FACEBOOK", "INSTAGRAM"];

function generateVerifyToken() {
  return randomBytes(16).toString("hex");
}

/**
 * Ensures a ChannelConnection row exists for every real channel, so the
 * Settings page always has a webhook URL + verify token to show the
 * client immediately, even before they've pasted in any credentials.
 */
export async function getChannelConnections() {
  await Promise.all(
    REAL_CHANNELS.map((channel) =>
      prisma.channelConnection.upsert({
        where: { channel },
        update: {},
        create: { channel, webhookVerifyToken: generateVerifyToken() },
      })
    )
  );

  const connections = await prisma.channelConnection.findMany({
    where: { channel: { in: REAL_CHANNELS } },
  });

  return REAL_CHANNELS.map(
    (channel) => connections.find((c) => c.channel === channel)!
  );
}

export async function saveWhatsAppCredentials(formData: FormData) {
  await prisma.channelConnection.update({
    where: { channel: "WHATSAPP" },
    data: {
      accessToken: String(formData.get("accessToken") ?? "").trim() || null,
      phoneNumberId: String(formData.get("phoneNumberId") ?? "").trim() || null,
      wabaId: String(formData.get("wabaId") ?? "").trim() || null,
      displayName: String(formData.get("displayName") ?? "").trim() || null,
      status: "CONNECTED",
      lastErrorMessage: null,
    },
  });

  revalidatePath("/settings/channels");
}

export type EmbeddedSignupState = { error: string } | null;

/**
 * Completes WhatsApp Embedded Signup: exchanges the FB.login() code for a
 * business access token, explicitly subscribes our app to the customer's
 * WABA webhooks (dashboard "connected" state doesn't guarantee this), and
 * stores the connection — no client-created Meta app needed.
 */
export async function connectWhatsAppEmbeddedSignup(
  code: string,
  wabaId: string,
  phoneNumberId: string
): Promise<EmbeddedSignupState> {
  try {
    const accessToken = await exchangeEmbeddedSignupCode(code);
    await subscribeAppToWaba(wabaId, accessToken);
    const displayName = await fetchPhoneNumberDisplayName(phoneNumberId, accessToken);

    await prisma.channelConnection.update({
      where: { channel: "WHATSAPP" },
      data: {
        accessToken,
        phoneNumberId,
        wabaId,
        displayName: displayName ?? null,
        status: "CONNECTED",
        lastErrorMessage: null,
      },
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "WhatsApp connection failed" };
  }

  revalidatePath("/settings/channels");
  revalidatePath("/setup");
  return null;
}

export async function saveMetaMessagingCredentials(
  channel: "FACEBOOK" | "INSTAGRAM",
  formData: FormData
) {
  await prisma.channelConnection.update({
    where: { channel },
    data: {
      accessToken: String(formData.get("accessToken") ?? "").trim() || null,
      pageId: String(formData.get("pageId") ?? "").trim() || null,
      displayName: String(formData.get("displayName") ?? "").trim() || null,
      status: "CONNECTED",
      lastErrorMessage: null,
    },
  });

  revalidatePath("/settings/channels");
}

export async function disconnectChannel(channel: ConversationChannel) {
  await prisma.channelConnection.update({
    where: { channel },
    data: {
      accessToken: null,
      phoneNumberId: null,
      wabaId: null,
      pageId: null,
      displayName: null,
      status: "DISCONNECTED",
      lastErrorMessage: null,
    },
  });

  revalidatePath("/settings/channels");
}
