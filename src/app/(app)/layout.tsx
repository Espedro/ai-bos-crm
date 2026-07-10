import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
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

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <main className="min-h-screen flex-1 overflow-x-hidden px-8 py-8">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
      <CommandPalette />
    </div>
  );
}
