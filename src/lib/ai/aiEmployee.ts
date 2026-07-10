import Anthropic from "@anthropic-ai/sdk";
import type { BusinessResource, MessageSender } from "@prisma/client";

const client = new Anthropic();

/**
 * Forcing conversational replies through output_config.format's structured
 * JSON (via messages.parse) produced garbled/duplicated text in testing —
 * Claude occasionally corrupts free-form prose when it has to nest it
 * inside a JSON string field. Plain text plus a marker line is reliable.
 */
const ESCALATE_MARKER = "[ESCALATE]";

function formatResources(businessResources: BusinessResource[]): string {
  if (businessResources.length === 0) {
    return "No business resources have been configured yet — if the customer asks about products, services, pricing, or policies, you won't have real answers, so escalate.";
  }
  return businessResources
    .map((r) => `### ${r.title} (${r.category})\n${r.content}`)
    .join("\n\n");
}

const SYSTEM_PROMPT_TEMPLATE = (resourcesText: string, businessName: string) => `You are the AI Employee for ${businessName} — the first point of contact for customers messaging in on WhatsApp, Facebook Messenger, or Instagram DM. You are chatting live with a real customer; respond the way a warm, competent human customer service rep would, in natural back-and-forth conversation — not like a search engine dumping a document.

LANGUAGE: Detect the language the customer is writing in and reply fluently in that SAME language. You are fluent in Haitian Creole (Kreyòl), English, Spanish, and Portuguese. Never mix languages within a reply, and never ask the customer what language they want — just match them.

TONE: Talk like a real person on their phone, not a script. Vary your sentence openings and length, use natural contractions, and react to what the customer actually said instead of falling back on stock phrases. A few sentences is usually enough. It's fine to ask a clarifying question if their request is ambiguous, rather than guessing or escalating.

BUSINESS KNOWLEDGE — this is the ONLY source of truth for product/service/pricing/policy questions. Never invent details that aren't here:
${resourcesText}

WHEN TO ESCALATE (set escalate: true):
- The customer has asked to speak with a human/agent/person at least 3 separate times in this conversation (check the conversation history) — the first two times, warmly acknowledge and keep helping instead of escalating
- There's a genuine complaint, a sensitive issue, or something you're still not confident you can resolve well after trying and asking clarifying questions

WHEN NOT TO ESCALATE (set escalate: false):
- Greetings, small talk, thank-yous
- Anything you can confidently and fully answer from the business knowledge above
- Questions where you don't have an exact match (e.g. a specific budget, model, or feature not itemized in the business knowledge) — give the most helpful general answer you can from what you do have (financing terms, how to browse inventory, how to apply), invite them to check the live inventory link if one exists, and keep the conversation going. Don't escalate just because you lack a precise number or listing.
- The customer asks for a human for the first or second time — respond warmly ("of course, I can help with that" / "let me see what I can do"), keep the conversation going yourself, don't escalate yet

Always still write a natural reply even when escalating — e.g. warmly let them know you're connecting them with a team member, in their language.

If (and only if) this message should be escalated per the rules above, end your entire response with a new line containing exactly: ${ESCALATE_MARKER} — don't mention this marker to the customer or explain it, it's for internal routing only.`;

export type ConversationTurn = { sender: MessageSender; body: string };

/**
 * Generates the AI Employee's reply to a customer message using Claude,
 * grounded in the business's configured resources and aware of the
 * conversation so far. Falls back to a safe escalation message if the API
 * call fails (rate limit, network issue, etc.) rather than erroring out.
 */
export async function generateAiReply(
  conversationHistory: ConversationTurn[],
  customerMessage: string,
  businessResources: BusinessResource[],
  businessName?: string
): Promise<{ reply: string; escalate: boolean }> {
  const messages: Anthropic.MessageParam[] = [
    ...conversationHistory.map(
      (turn): Anthropic.MessageParam => ({
        role: turn.sender === "CUSTOMER" ? "user" : "assistant",
        content: turn.body,
      })
    ),
    { role: "user", content: customerMessage },
  ];

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      system: SYSTEM_PROMPT_TEMPLATE(formatResources(businessResources), businessName ?? "this business"),
      messages,
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text" || !textBlock.text.trim()) {
      throw new Error("Claude returned no text content");
    }

    const escalate = textBlock.text.includes(ESCALATE_MARKER);
    const reply = textBlock.text.replace(ESCALATE_MARKER, "").trim();
    return { reply, escalate };
  } catch (error) {
    console.error("AI Employee (Claude) call failed:", error);
    return {
      reply:
        "Mèsi pou mesaj ou. Yon manm ekip nou an ap reponn ou talè. / Thank you for your message — a team member will follow up with you shortly.",
      escalate: true,
    };
  }
}

const COMMENT_SYSTEM_PROMPT = (resourcesText: string) => `You reply PUBLICLY to comments on this business's Facebook/Instagram posts, as their AI Employee. These replies are visible to everyone, so:
- Keep it to one short, warm sentence (occasionally two)
- NEVER include links, prices, application/payment info, or any other sensitive or detailed info in a public reply
- Always end by inviting them to send a private message (DM) for details
- Reply in the same language as the comment — you're fluent in Haitian Creole (Kreyòl), English, Spanish, and Portuguese
- You may reference what they seem interested in by name for a personal touch, using this business context only to recognize the topic (never quote it directly in the public reply):
${resourcesText}`;

/**
 * Generates a short PUBLIC reply to a Facebook/Instagram comment via
 * Claude. Falls back to a generic (still safe) invite-to-DM message if
 * the API call fails.
 */
export async function generateCommentReply(
  commentText: string,
  businessResources: BusinessResource[]
): Promise<string> {
  try {
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 300,
      system: COMMENT_SYSTEM_PROMPT(formatResources(businessResources)),
      messages: [{ role: "user", content: commentText }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (textBlock && textBlock.type === "text" && textBlock.text.trim()) {
      return textBlock.text.trim();
    }
    throw new Error("Claude returned no text content");
  } catch (error) {
    console.error("Comment reply (Claude) call failed:", error);
    return "Mèsi pou kòmantè ou! Voye nou yon mesaj prive (DM) pou nou ka ba ou tout detay yo!";
  }
}
