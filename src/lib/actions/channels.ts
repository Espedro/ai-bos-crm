"use server";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { ConversationChannel } from "@prisma/client";
import {
  exchangeEmbeddedSignupCode,
  subscribeAppToWaba,
  fetchPhoneNumberDisplayName,
} from "@/lib/channels/whatsappEmbeddedSignup";
import { fetchManagedPages, subscribeAppToPage } from "@/lib/channels/facebookOAuth";
import { requireAdminAction, getCurrentAgent } from "@/lib/current-agent";

const REAL_CHANNELS: ConversationChannel[] = ["WHATSAPP", "FACEBOOK", "INSTAGRAM"];
const PENDING_PAGES_COOKIE = "fb_pending_pages";

function generateVerifyToken() {
  return randomBytes(16).toString("hex");
}

/**
 * Ensures a ChannelConnection row exists for every real channel for the
 * current business, so the Settings page always has a webhook URL + verify
 * token to show the client immediately, even before they've pasted in any
 * credentials.
 */
export async function getChannelConnections() {
  const agent = await getCurrentAgent();

  await Promise.all(
    REAL_CHANNELS.map((channel) =>
      prisma.channelConnection.upsert({
        where: { businessId_channel: { businessId: agent.businessId, channel } },
        update: {},
        create: { businessId: agent.businessId, channel, webhookVerifyToken: generateVerifyToken() },
      })
    )
  );

  const connections = await prisma.channelConnection.findMany({
    where: { businessId: agent.businessId, channel: { in: REAL_CHANNELS } },
  });

  return REAL_CHANNELS.map(
    (channel) => connections.find((c) => c.channel === channel)!
  );
}

export async function saveWhatsAppCredentials(formData: FormData) {
  const agent = await requireAdminAction();
  await prisma.channelConnection.update({
    where: { businessId_channel: { businessId: agent.businessId, channel: "WHATSAPP" } },
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
  const agent = await requireAdminAction();

  // Nothing in Meta's flow stops the same WhatsApp number from being handed
  // back to a second business — without this check, resolveConnectionForRecipient
  // (src/lib/channels/inbound.ts) would have two ChannelConnection rows
  // sharing one phoneNumberId and could route a real customer's messages to
  // the wrong business.
  const existing = await prisma.channelConnection.findFirst({
    where: { channel: "WHATSAPP", phoneNumberId, businessId: { not: agent.businessId } },
  });
  if (existing) {
    return {
      error:
        "This WhatsApp number is already connected to a different business on this system. Disconnect it there first, or use a different number.",
    };
  }

  try {
    const accessToken = await exchangeEmbeddedSignupCode(code);
    await subscribeAppToWaba(wabaId, accessToken);
    const displayName = await fetchPhoneNumberDisplayName(phoneNumberId, accessToken);

    await prisma.channelConnection.update({
      where: { businessId_channel: { businessId: agent.businessId, channel: "WHATSAPP" } },
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
  const agent = await requireAdminAction();
  await prisma.channelConnection.update({
    where: { businessId_channel: { businessId: agent.businessId, channel } },
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
  const agent = await requireAdminAction();
  await prisma.channelConnection.update({
    where: { businessId_channel: { businessId: agent.businessId, channel } },
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

/**
 * Reads the short-lived pending-pages cookie left by the Facebook OAuth
 * callback when the connecting account manages more than one Page, and
 * re-fetches the live page list so the admin can pick the right one for
 * this business. Never trusts the cookie's businessId alone — it must
 * match the currently logged-in admin's own business.
 */
export async function getPendingFacebookPages() {
  const agent = await requireAdminAction();
  const cookieStore = await cookies();
  const raw = cookieStore.get(PENDING_PAGES_COOKIE)?.value;
  if (!raw) return null;

  let businessId: string | undefined;
  let longLivedUserToken: string | undefined;
  try {
    const parsed = JSON.parse(raw);
    businessId = parsed?.businessId;
    longLivedUserToken = parsed?.longLivedUserToken;
  } catch {
    return null;
  }
  if (!businessId || !longLivedUserToken || businessId !== agent.businessId) return null;

  const pages = await fetchManagedPages(longLivedUserToken);
  return pages.map((page) => ({
    id: page.id,
    name: page.name,
    hasInstagram: !!page.instagram_business_account?.id,
  }));
}

export async function connectFacebookPage(pageId: string) {
  const agent = await requireAdminAction();
  const cookieStore = await cookies();
  const raw = cookieStore.get(PENDING_PAGES_COOKIE)?.value;

  let businessId: string | undefined;
  let longLivedUserToken: string | undefined;
  try {
    const parsed = raw ? JSON.parse(raw) : null;
    businessId = parsed?.businessId;
    longLivedUserToken = parsed?.longLivedUserToken;
  } catch {
    businessId = undefined;
  }
  if (!businessId || !longLivedUserToken || businessId !== agent.businessId) {
    redirect("/settings/channels?fb_error=invalid_state");
  }

  const pages = await fetchManagedPages(longLivedUserToken);
  const page = pages.find((p) => p.id === pageId);
  if (!page) {
    redirect("/settings/channels?fb_error=page_not_found");
  }

  const existingPage = await prisma.channelConnection.findFirst({
    where: { channel: "FACEBOOK", pageId: page.id, businessId: { not: agent.businessId } },
  });
  if (existingPage) {
    redirect("/settings/channels?fb_error=page_already_connected");
  }

  await subscribeAppToPage(page.id, page.access_token);

  await prisma.channelConnection.update({
    where: { businessId_channel: { businessId: agent.businessId, channel: "FACEBOOK" } },
    data: {
      accessToken: page.access_token,
      pageId: page.id,
      displayName: page.name,
      status: "CONNECTED",
      lastErrorMessage: null,
    },
  });

  if (page.instagram_business_account?.id) {
    await prisma.channelConnection.update({
      where: { businessId_channel: { businessId: agent.businessId, channel: "INSTAGRAM" } },
      data: {
        accessToken: page.access_token,
        pageId: page.instagram_business_account.id,
        displayName: page.name,
        status: "CONNECTED",
        lastErrorMessage: null,
      },
    });
  }

  cookieStore.delete(PENDING_PAGES_COOKIE);
  revalidatePath("/settings/channels");
  redirect(`/settings/channels?fb_connected=${encodeURIComponent(page.name)}`);
}
