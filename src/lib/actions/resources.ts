"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { ResourceCategory } from "@prisma/client";
import { extractResourcesFromWebsiteText } from "@/lib/ai/websiteImport";
import { requireAdminAction } from "@/lib/current-agent";

function htmlToText(html: string): string {
  return html
    .replace(/<(script|style|nav|footer|noscript)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&(lt|gt|quot|#39);/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export type ImportWebsiteState = { message: string } | null;

export async function importResourcesFromWebsite(
  _prevState: ImportWebsiteState,
  formData: FormData
): Promise<ImportWebsiteState> {
  const url = String(formData.get("url") ?? "").trim();
  if (!/^https?:\/\//i.test(url)) {
    return { message: "Enter a full URL starting with http:// or https://" };
  }

  let html: string;
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; AIBOSCRM-Import/1.0)" },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      return { message: `Could not fetch that page (HTTP ${response.status})` };
    }
    html = await response.text();
  } catch {
    return { message: "Could not reach that website. Check the URL and try again." };
  }

  const text = htmlToText(html).slice(0, 15000);
  if (text.length < 50) {
    return { message: "That page didn't have enough readable text to import." };
  }

  let extracted;
  try {
    extracted = await extractResourcesFromWebsiteText(text);
  } catch {
    return { message: "The AI couldn't process that page. Try again in a moment." };
  }

  if (extracted.length === 0) {
    return { message: "No usable business info was found on that page." };
  }

  await prisma.businessResource.createMany({
    data: extracted.map((r) => ({ title: r.title, category: r.category, content: r.content })),
  });

  revalidatePath("/resources");
  revalidatePath("/setup");
  return { message: `Imported ${extracted.length} resource(s) from the website.` };
}

export async function getResources() {
  return prisma.businessResource.findMany({ orderBy: { createdAt: "desc" } });
}

export async function createResource(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  if (!title || !content) throw new Error("Title and content are required");

  await prisma.businessResource.create({
    data: {
      title,
      content,
      category: (String(formData.get("category") ?? "OTHER") as ResourceCategory) || "OTHER",
    },
  });

  revalidatePath("/resources");
}

export async function deleteResource(id: string) {
  await requireAdminAction();
  await prisma.businessResource.delete({ where: { id } });
  revalidatePath("/resources");
}
