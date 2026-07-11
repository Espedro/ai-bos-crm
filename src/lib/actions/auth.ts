"use server";

import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";
import { sendCampaignEmail } from "@/lib/email/resend";
import { slugify } from "@/lib/slugify";

export type LoginState = { error: string } | undefined;

const MIN_PASSWORD_LENGTH = 8;
const RESET_TOKEN_DURATION_MS = 60 * 60 * 1000; // 1 hour

/** A brand-new business has nowhere to create stages from scratch (there's
 * no "add stage" UI), so the Deals pipeline would otherwise stay
 * permanently empty and unusable after signup. */
const DEFAULT_STAGES = ["New Lead", "Qualified", "Proposal Sent", "Negotiation", "Won", "Lost"];

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const slug = String(formData.get("slug") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!slug || !email || !password) {
    return { error: "Email and password are required." };
  }

  const business = await prisma.business.findUnique({ where: { slug } });
  if (!business) {
    return { error: "Business not found." };
  }

  const agent = await prisma.agent.findUnique({
    where: { businessId_email: { businessId: business.id, email } },
  });
  if (!agent) {
    return { error: "No account found for that email." };
  }

  if (!agent.passwordHash) {
    if (password.length < MIN_PASSWORD_LENGTH) {
      return { error: `Choose a password with at least ${MIN_PASSWORD_LENGTH} characters.` };
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.agent.update({ where: { id: agent.id }, data: { passwordHash } });
    await createSession(agent.id);
    redirect("/");
  }

  const valid = await bcrypt.compare(password, agent.passwordHash);
  if (!valid) {
    return { error: "Incorrect password." };
  }

  await createSession(agent.id);
  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}

export type SignupState = { error: string } | undefined;

/** Public: creates a brand-new Business (tenant) plus its first Agent
 * (always ADMIN), then sends them to claim their password via the normal
 * first-login flow. This is the "Standard" tier's self-serve onboarding —
 * a Private-tier client only ever goes through this once, for themselves. */
export async function signup(_prevState: SignupState, formData: FormData): Promise<SignupState> {
  const businessName = String(formData.get("businessName") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!businessName || !name || !email) {
    return { error: "All fields are required." };
  }

  const baseSlug = slugify(businessName, "business");
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.business.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${++suffix}`;
  }

  const business = await prisma.business.create({
    data: { slug, name: businessName },
  });

  await prisma.agent.create({
    data: { businessId: business.id, name, email, role: "ADMIN" },
  });

  await prisma.stage.createMany({
    data: DEFAULT_STAGES.map((stageName, order) => ({
      businessId: business.id,
      name: stageName,
      order,
    })),
  });

  redirect(`/login/${slug}`);
}

export type RequestResetState = { message: string; error?: boolean } | undefined;

/**
 * Always returns the same generic message regardless of whether the email
 * matches an account, so the form can't be used to discover who has (or
 * hasn't) been added as a team member.
 */
export async function requestPasswordReset(
  _prevState: RequestResetState,
  formData: FormData
): Promise<RequestResetState> {
  const slug = String(formData.get("slug") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const genericMessage = "If that email has an account, we've sent a reset link to it.";

  if (!slug || !email) {
    return { message: "Enter your email.", error: true };
  }

  const business = await prisma.business.findUnique({ where: { slug } });
  if (!business) {
    return { message: genericMessage };
  }

  const agent = await prisma.agent.findUnique({
    where: { businessId_email: { businessId: business.id, email } },
  });
  if (!agent || !agent.passwordHash) {
    // Unknown email, or never claimed yet (claiming happens via /login instead).
    return { message: genericMessage };
  }

  const token = randomBytes(32).toString("hex");
  await prisma.agent.update({
    where: { id: agent.id },
    data: { resetToken: token, resetTokenExpiresAt: new Date(Date.now() + RESET_TOKEN_DURATION_MS) },
  });

  const hdrs = await headers();
  const host = hdrs.get("host") ?? "localhost:3000";
  const origin = `${host.startsWith("localhost") ? "http" : "https"}://${host}`;
  const resetUrl = `${origin}/login/reset?token=${token}`;

  try {
    await sendCampaignEmail({
      from: "onboarding@resend.dev",
      to: agent.email,
      subject: "Reset your AI BOS CRM password",
      html: `<p>Hi ${agent.name},</p><p>Click the link below to set a new password. This link expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you didn't request this, you can ignore this email.</p>`,
    });
  } catch {
    return { message: "Couldn't send the reset email — try again in a moment.", error: true };
  }

  return { message: genericMessage };
}

export type ResetPasswordState = { error: string } | undefined;

export async function resetPassword(
  _prevState: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!token) {
    return { error: "Missing reset token." };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Choose a password with at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords don't match." };
  }

  const agent = await prisma.agent.findUnique({ where: { resetToken: token } });
  if (!agent || !agent.resetTokenExpiresAt || agent.resetTokenExpiresAt < new Date()) {
    return { error: "This reset link is invalid or has expired. Request a new one." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.agent.update({
    where: { id: agent.id },
    data: { passwordHash, resetToken: null, resetTokenExpiresAt: null },
  });

  await createSession(agent.id);
  redirect("/");
}
