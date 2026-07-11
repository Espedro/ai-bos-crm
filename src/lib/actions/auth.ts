"use server";

import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";
import { sendCampaignEmail } from "@/lib/email/resend";

export type LoginState = { error: string } | undefined;

const MIN_PASSWORD_LENGTH = 8;
const RESET_TOKEN_DURATION_MS = 60 * 60 * 1000; // 1 hour

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const agent = await prisma.agent.findUnique({ where: { email } });
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
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const genericMessage = "If that email has an account, we've sent a reset link to it.";

  if (!email) {
    return { message: "Enter your email.", error: true };
  }

  const agent = await prisma.agent.findUnique({ where: { email } });
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
