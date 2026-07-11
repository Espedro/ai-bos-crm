import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { LoginForm } from "@/components/login-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LoginPage() {
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
            <CardTitle className="text-xl">Sign in</CardTitle>
            <p className="text-sm text-muted-foreground">
              {profile.name} team members sign in here to access the CRM.
            </p>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
