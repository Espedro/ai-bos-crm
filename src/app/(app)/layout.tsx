import { redirect } from "next/navigation";
import { getCurrentAgent, getCurrentBusiness } from "@/lib/current-agent";
import { Sidebar } from "@/components/sidebar";
import { CommandPalette } from "@/components/command-palette";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const agent = await getCurrentAgent();
  const business = await getCurrentBusiness();
  if (!business.completedAt) {
    redirect("/setup");
  }

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row">
      <Sidebar agentName={agent.name} agentRole={agent.role} />
      {/* Exact padding from the design reference (28px 32px 40px), applied
          uniformly to every page including Inbox — not a responsive scale.
          PageShell-wrapped pages cancel this via negative margins on their
          sticky topbar so it renders flush and full-bleed. */}
      <main className="flex min-h-screen flex-1 flex-col overflow-x-hidden pt-7 pr-8 pb-10 pl-8">
        {children}
      </main>
      <CommandPalette />
    </div>
  );
}
