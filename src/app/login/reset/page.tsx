import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const [session, params] = await Promise.all([getSession(), searchParams]);

  if (session) redirect("/dashboard");

  const token = params.token ?? "";

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm space-y-6">
        <p className="text-center text-xl leading-tight font-extrabold tracking-tight">
          <span className="text-primary">AI</span> BOS
        </p>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Set a new password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {token ? (
              <ResetPasswordForm token={token} />
            ) : (
              <p className="text-sm text-muted-foreground">
                This reset link is missing its token. Request a new one from your{" "}
                <Link href="/login" className="text-foreground underline">
                  sign-in page
                </Link>
                .
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
