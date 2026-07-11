"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Building2, Search, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { getCompanies } from "@/lib/actions/companies";

type Company = Awaited<ReturnType<typeof getCompanies>>[number];

export function CompaniesTable({ companies }: { companies: Company[] }) {
  const [filter, setFilter] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter(
      (c) => c.name.toLowerCase().includes(q) || c.industry?.toLowerCase().includes(q)
    );
  }, [filter, companies]);

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
          placeholder="Filter by name or industry..."
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
              <TableHead>Industry</TableHead>
              <TableHead>Contacts</TableHead>
              <TableHead>Deals</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((company) => (
              <TableRow key={company.id} className="animate-in fade-in-0">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Building2 className="size-4" />
                    </div>
                    <div>
                      <Link
                        href={`/companies/${company.id}`}
                        className="font-medium hover:underline"
                      >
                        {company.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{company.website}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{company.industry ?? "—"}</TableCell>
                <TableCell>{company._count.contacts}</TableCell>
                <TableCell>{company._count.deals}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && companies.length > 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                  No companies match &ldquo;{filter}&rdquo;.
                </TableCell>
              </TableRow>
            )}
            {companies.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Building2 className="size-8" />
                    <p className="text-sm">No companies yet.</p>
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
