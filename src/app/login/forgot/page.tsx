import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ForgotPasswordPage() {
  const [session, profile] = await Promise.all([getSession(), prisma.businessProfile.findFirst()]);

  if (!profile?.completedAt) redirect("/setup");
  if (session) redirect("/");

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm space-y-6">
        <p className="text-center text-xl leading-tight font-extrabold tracking-tight">
          <span className="text-primary">AI</span> BOS
        </p>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Reset your password</CardTitle>
            <p className="text-sm text-muted-foreground">
              Enter your email and we&apos;ll send you a link to set a new password.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <ForgotPasswordForm />
            <Link
              href="/login"
              className="block text-center text-xs text-muted-foreground hover:text-foreground"
            >
              Back to sign in
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
