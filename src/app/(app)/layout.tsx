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
      <main className="flex min-h-screen flex-1 flex-col overflow-x-hidden">{children}</main>
      <CommandPalette />
    </div>
  );
}
