"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminAction, getCurrentAgent } from "@/lib/current-agent";

export async function updateEmailSettings(formData: FormData) {
  const agent = await requireAdminAction();

  await prisma.business.update({
    where: { id: agent.businessId },
    data: {
      emailFromName: String(formData.get("emailFromName") ?? "").trim() || null,
      emailFromAddress: String(formData.get("emailFromAddress") ?? "").trim() || null,
    },
  });

  revalidatePath("/settings/channels");
}

/**
 * Marks onboarding complete for the current agent's business, which is what
 * lets src/app/(app)/layout.tsx stop redirecting into /setup.
 */
export async function completeSetup() {
  const agent = await getCurrentAgent();

  await prisma.business.update({
    where: { id: agent.businessId },
    data: { completedAt: new Date() },
  });

  redirect("/");
}
