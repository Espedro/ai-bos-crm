import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { LoginForm } from "@/components/login-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function BusinessLoginPage({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;
  const [session, business] = await Promise.all([
    getSession(),
    prisma.business.findUnique({ where: { slug: businessSlug } }),
  ]);

  if (!business) notFound();
  if (session) redirect("/dashboard");

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
              {business.name} team members sign in here to access the CRM.
            </p>
          </CardHeader>
          <CardContent>
            <LoginForm slug={business.slug} />
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground">
          Not {business.name}?{" "}
          <Link href="/login" className="underline hover:text-foreground">
            Find your business
          </Link>
        </p>
      </div>
    </div>
  );
}
