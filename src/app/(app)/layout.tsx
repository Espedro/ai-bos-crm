import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentAgent } from "@/lib/current-agent";
import { Sidebar } from "@/components/sidebar";
import { CommandPalette } from "@/components/command-palette";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await prisma.businessProfile.findFirst();
  if (!profile?.completedAt) {
    redirect("/setup");
  }

  const agent = await getCurrentAgent();

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row">
      <Sidebar agentName={agent.name} agentRole={agent.role} />
      <main className="min-h-screen flex-1 overflow-x-hidden px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
      <CommandPalette />
    </div>
  );
}
