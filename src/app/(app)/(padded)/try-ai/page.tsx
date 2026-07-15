import Link from "next/link";
import { getCurrentAgent } from "@/lib/current-agent";
import { getResources } from "@/lib/actions/resources";
import { TryAiChat } from "@/components/try-ai-chat";

export default async function TryAiPage() {
  const [agent, resources] = await Promise.all([getCurrentAgent(), getResources()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Try Your AI Employee</h1>
        <p className="text-sm text-muted-foreground">
          Chat with it here before connecting any real channel.
        </p>
      </div>

      {resources.length === 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
          You haven&apos;t added any{" "}
          <Link href="/resources" className="underline">
            Business Resources
          </Link>{" "}
          yet — the AI Employee won&apos;t have real answers about your products, services, or
          policies until you do.
        </div>
      )}

      <TryAiChat agentName={agent.name} />
    </div>
  );
}
