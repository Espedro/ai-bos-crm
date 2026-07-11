import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { SignupForm } from "@/components/signup-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SignupPage() {
  const session = await getSession();
  if (session) redirect("/");

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm space-y-6">
        <p className="text-center text-xl leading-tight font-extrabold tracking-tight">
          <span className="text-primary">AI</span> BOS
        </p>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Create your workspace</CardTitle>
            <p className="text-sm text-muted-foreground">
              Set up a new AI BOS CRM workspace for your business.
            </p>
          </CardHeader>
          <CardContent>
            <SignupForm />
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground">
          Already have a workspace?{" "}
          <Link href="/login" className="underline hover:text-foreground">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
