import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { BusinessPickerForm } from "@/components/business-picker-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LoginEntryPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  const businesses = await prisma.business.findMany({
    select: { slug: true, name: true },
    orderBy: { name: "asc" },
  });

  if (businesses.length === 0) redirect("/signup");
  if (businesses.length === 1) redirect(`/login/${businesses[0].slug}`);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm space-y-6">
        <p className="text-center text-xl leading-tight font-extrabold tracking-tight">
          <span className="text-primary">AI</span> BOS
        </p>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Find your business</CardTitle>
            <p className="text-sm text-muted-foreground">
              Enter your business&apos;s workspace name to go to its sign-in page.
            </p>
          </CardHeader>
          <CardContent>
            <BusinessPickerForm businesses={businesses} />
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground">
          New here?{" "}
          <Link href="/signup" className="underline hover:text-foreground">
            Create a workspace
          </Link>
        </p>
      </div>
    </div>
  );
}
