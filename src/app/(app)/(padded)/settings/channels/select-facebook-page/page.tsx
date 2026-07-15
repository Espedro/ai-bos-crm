import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdminPage } from "@/lib/current-agent";
import { getPendingFacebookPages, connectFacebookPage } from "@/lib/actions/channels";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function SelectFacebookPagePage() {
  await requireAdminPage();
  const pages = await getPendingFacebookPages();

  if (!pages) {
    redirect("/settings/channels?fb_error=invalid_state");
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-6 px-6 py-12">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Choose a Facebook Page</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your Facebook account manages more than one Page. Pick the one that belongs to this
          business — the AI Employee will only connect to that Page.
        </p>
      </div>
      <div className="space-y-3">
        {pages.map((page) => (
          <Card key={page.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-medium">{page.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {page.hasInstagram
                  ? "Includes a linked Instagram Business account"
                  : "No linked Instagram Business account"}
              </p>
              <form
                action={async () => {
                  "use server";
                  await connectFacebookPage(page.id);
                }}
              >
                <Button type="submit" size="sm">
                  Connect this Page
                </Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
      <Link
        href="/settings/channels"
        className="block text-center text-xs text-muted-foreground hover:text-foreground"
      >
        Cancel
      </Link>
    </div>
  );
}
