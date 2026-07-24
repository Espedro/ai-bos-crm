"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminAction, getCurrentAgent } from "@/lib/current-agent";
import { slugify } from "@/lib/slugify";

export type UpdateBusinessProfileState = { error?: string; success?: boolean } | undefined;

/**
 * Renames the business and/or changes its login slug. The slug change
 * takes effect immediately — any bookmarked /login/[oldSlug] link stops
 * working, which is worth surfacing to the admin in the UI, not just
 * here.
 */
export async function updateBusinessProfile(
  _prevState: UpdateBusinessProfileState,
  formData: FormData
): Promise<UpdateBusinessProfileState> {
  const agent = await requireAdminAction();
  const name = String(formData.get("name") ?? "").trim();
  const requestedSlug = String(formData.get("slug") ?? "").trim();

  if (!name) return { error: "Business name is required." };

  const slug = requestedSlug ? slugify(requestedSlug, "business") : undefined;

  if (slug) {
    const existing = await prisma.business.findUnique({ where: { slug } });
    if (existing && existing.id !== agent.businessId) {
      return { error: `The slug "${slug}" is already taken by another business.` };
    }
  }

  await prisma.business.update({
    where: { id: agent.businessId },
    data: { name, ...(slug ? { slug } : {}) },
  });

  revalidatePath("/settings/general");
  return { success: true };
}

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

  redirect("/dashboard");
}
