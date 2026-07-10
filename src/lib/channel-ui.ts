import type { ConversationChannel } from "@prisma/client";

export const CHANNEL_TITLES: Record<ConversationChannel, string> = {
  WHATSAPP: "WhatsApp",
  FACEBOOK: "Messenger",
  INSTAGRAM: "Instagram",
  EMAIL: "Email",
  WEBCHAT: "Web Chat",
};

export function parseChannelParam(value?: string): ConversationChannel | undefined {
  return value && value in CHANNEL_TITLES ? (value as ConversationChannel) : undefined;
}
