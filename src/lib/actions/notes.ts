"use server";

import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";
import { getCurrentAgent } from "@/lib/current-agent";

export async function createNote(formData: FormData) {
  const agent = await getCurrentAgent();
  const body = String(formData.get("body") ?? "").trim();
  if (!body) throw new Error("Note body is required");

  const contactId = String(formData.get("contactId") ?? "") || null;
  const dealId = String(formData.get("dealId") ?? "") || null;
  const companyId = String(formData.get("companyId") ?? "") || null;

  await prisma.note.create({
    data: {
      businessId: agent.businessId,
      body,
      contactId,
      dealId,
      companyId,
      authorAgentId: String(formData.get("authorAgentId") ?? "") || null,
    },
  });

  if (contactId) {
    await logActivity({
      businessId: agent.businessId,
      type: "NOTE_ADDED",
      description: "A note was added.",
      contactId,
      dealId: dealId ?? undefined,
    });
    revalidatePath(`/contacts/${contactId}`);
  }
  if (companyId) revalidatePath(`/companies/${companyId}`);
}
