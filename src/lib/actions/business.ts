"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function getBusinessProfile() {
  return prisma.businessProfile.findFirst();
}

/**
 * Creates the singleton BusinessProfile row. Only ever called once per
 * deployment, from the setup wizard's first step.
 */
export async function createBusinessProfile(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!name) throw new Error("Business name is required");

  await prisma.businessProfile.create({
    data: { name, description: description || null },
  });

  revalidatePath("/setup");
}

export async function updateEmailSettings(formData: FormData) {
  const profile = await prisma.businessProfile.findFirstOrThrow();

  await prisma.businessProfile.update({
    where: { id: profile.id },
    data: {
      emailFromName: String(formData.get("emailFromName") ?? "").trim() || null,
      emailFromAddress: String(formData.get("emailFromAddress") ?? "").trim() || null,
    },
  });

  revalidatePath("/settings/channels");
}

/**
 * Marks onboarding complete, which is what lets src/app/(app)/layout.tsx
 * stop redirecting into /setup.
 */
export async function completeSetup() {
  const profile = await prisma.businessProfile.findFirstOrThrow();

  await prisma.businessProfile.update({
    where: { id: profile.id },
    data: { completedAt: new Date() },
  });

  redirect("/");
}
