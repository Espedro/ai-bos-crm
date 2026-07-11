"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";

export type LoginState = { error: string } | undefined;

const MIN_PASSWORD_LENGTH = 8;

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
