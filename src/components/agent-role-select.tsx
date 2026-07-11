"use client";

import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateAgentRole } from "@/lib/actions/agents";
import type { AgentRole } from "@prisma/client";

export function AgentRoleSelect({
  agentId,
  role,
  disabled,
}: {
  agentId: string;
  role: AgentRole;
  disabled?: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      value={role}
      disabled={disabled || isPending}
      onValueChange={(value) => {
        startTransition(async () => {
          try {
            await updateAgentRole(agentId, value as AgentRole);
          } catch (error) {
            alert(error instanceof Error ? error.message : "Couldn't update role.");
          }
        });
      }}
    >
      <SelectTrigger className="w-28" size="sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ADMIN">Admin</SelectItem>
        <SelectItem value="MEMBER">Member</SelectItem>
      </SelectContent>
    </Select>
  );
}
