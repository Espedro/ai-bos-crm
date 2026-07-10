import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

const client = new Anthropic();

const ExtractedResourceSchema = z.object({
  title: z.string(),
  category: z.enum(["PRODUCT", "SERVICE", "FAQ", "POLICY", "PRICE_LIST", "OTHER"]),
  content: z.string(),
});

const ExtractionSchema = z.object({
  resources: z.array(ExtractedResourceSchema),
});

export type ExtractedResource = z.infer<typeof ExtractedResourceSchema>;

const SYSTEM_PROMPT = `You extract structured business knowledge from raw website text so it can be stored as a business's knowledge base for a customer-service AI. Read the page content and produce a list of resources:
- One resource per distinct product or vehicle listing (category PRODUCT), including name, price, and key specs/features mentioned.
- Group pricing/financing terms as PRICE_LIST.
- Group frequently asked questions as FAQ.
- Group policies (returns, warranty, hours, location) as POLICY.
- Use SERVICE for offered services, OTHER for anything else worth keeping.

Only include real information found in the text — never invent details. Skip navigation links, cookie banners, and boilerplate. If the page has no useful business content, return an empty resources array.`;

/**
 * Calls Claude once at import time to turn raw scraped website text into
 * structured BusinessResource rows. This is a one-time extraction, separate
 * from the per-message calls generateAiReply makes during conversations.
 */
export async function extractResourcesFromWebsiteText(
  pageText: string
): Promise<ExtractedResource[]> {
  const response = await client.messages.parse({
    model: "claude-opus-4-8",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: pageText }],
    output_config: { format: zodOutputFormat(ExtractionSchema) },
  });

  if (!response.parsed_output) {
    throw new Error("Claude returned no parsed output");
  }

  return response.parsed_output.resources;
}
