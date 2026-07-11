import { getAgents, createAgent } from "@/lib/actions/agents";
import { requireAdminPage } from "@/lib/current-agent";
import { SettingsNav } from "@/components/settings-nav";
import { AgentRoleSelect } from "@/components/agent-role-select";
import { RemoveAgentButton } from "@/components/remove-agent-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default async function TeamSettingsPage() {
  const currentAgent = await requireAdminPage();
  const agents = await getAgents();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      </div>
      <SettingsNav />
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Team</h2>
        <p className="text-sm text-muted-foreground">
          Anyone added here can sign in at <code>/login</code> using their email — they set
          their own password the first time they sign in. Admins see financials and manage
          Settings/Campaigns/deletions; Members handle day-to-day contacts, deals, and
          conversations only.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team members</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {agents.map((agent) => (
              <div key={agent.id} className="flex items-center justify-between gap-3 px-6 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{agent.name}</p>
                  <p className="text-xs text-muted-foreground">{agent.email}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span
                    className={
                      agent.passwordHash
                        ? "rounded-full bg-[var(--status-good)]/15 px-2 py-0.5 text-[11px] font-semibold text-[var(--status-good)]"
                        : "rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground"
                    }
                  >
                    {agent.passwordHash ? "Active" : "Invited"}
                  </span>
                  <AgentRoleSelect agentId={agent.id} role={agent.role} />
                  {agent.id !== currentAgent.id && (
                    <RemoveAgentButton agentId={agent.id} agentName={agent.name} />
                  )}
                </div>
              </div>
            ))}
            {agents.length === 0 && (
              <p className="px-6 py-6 text-sm text-muted-foreground">No team members yet.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add a team member</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createAgent} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="agent-name">Name</Label>
              <Input id="agent-name" name="name" required />
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="agent-email">Email</Label>
              <Input id="agent-email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agent-role">Role</Label>
              <Select name="role" defaultValue="MEMBER">
                <SelectTrigger id="agent-role" className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEMBER">Member</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit">Add</Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Signed in as {currentAgent.name} ({currentAgent.role === "ADMIN" ? "Admin" : "Member"}).
      </p>
    </div>
  );
}
