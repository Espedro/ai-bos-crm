"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { EntityAvatar } from "@/components/entity-avatar";
import { LeadScoreBar } from "@/components/lead-score-bar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, X, Users } from "lucide-react";
import type { getContacts } from "@/lib/actions/contacts";

type Contact = Awaited<ReturnType<typeof getContacts>>[number];

const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  LEAD: "outline",
  QUALIFIED: "secondary",
  CUSTOMER: "default",
};

export function ContactsTable({ contacts }: { contacts: Contact[] }) {
  const [filter, setFilter] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) => {
      const name = `${c.firstName} ${c.lastName}`.toLowerCase();
      return (
        name.includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.company?.name.toLowerCase().includes(q)
      );
    });
  }, [filter, contacts]);

  return (
    <div className="space-y-3">
      <div className="relative max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && filter) {
              e.preventDefault();
              setFilter("");
            }
          }}
          placeholder="Filter by name, email, or company..."
          className="h-8 w-full rounded-md border border-input bg-background pr-7 pl-8 text-xs outline-none placeholder:text-muted-foreground transition-shadow focus-visible:ring-2 focus-visible:ring-ring"
        />
        {filter && (
          <button
            type="button"
            onClick={() => {
              setFilter("");
              inputRef.current?.focus();
            }}
            aria-label="Clear filter"
            className="absolute top-1/2 right-1.5 flex size-5 -translate-y-1/2 items-center justify-center text-muted-foreground transition-colors animate-in fade-in-0 zoom-in-95 duration-150 hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <div className="rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Lead Score</TableHead>
              <TableHead>Assigned Agent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((contact) => (
              <TableRow key={contact.id} className="animate-in fade-in-0">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <EntityAvatar name={`${contact.firstName} ${contact.lastName}`} size="sm" />
                    <div>
                      <Link
                        href={`/contacts/${contact.id}`}
                        className="font-medium hover:underline"
                      >
                        {contact.firstName} {contact.lastName}
                      </Link>
                      <p className="text-xs text-muted-foreground">{contact.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{contact.company?.name ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[contact.status]}>{contact.status}</Badge>
                </TableCell>
                <TableCell>
                  <LeadScoreBar score={contact.leadScore} />
                </TableCell>
                <TableCell>{contact.assignedAgent?.name ?? "Unassigned"}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && contacts.length > 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  No contacts match &ldquo;{filter}&rdquo;.
                </TableCell>
              </TableRow>
            )}
            {contacts.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Users className="size-8" />
                    <p className="text-sm">No contacts yet.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
