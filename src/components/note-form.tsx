"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createNote } from "@/lib/actions/notes";

type Option = { id: string; name: string };

export function NoteForm({
  contactId,
  companyId,
  agents,
}: {
  contactId?: string;
  companyId?: string;
  agents: Option[];
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await createNote(formData);
        formRef.current?.reset();
      }}
      className="space-y-3"
    >
      {contactId && <input type="hidden" name="contactId" value={contactId} />}
      {companyId && <input type="hidden" name="companyId" value={companyId} />}
      <Textarea name="body" placeholder="Write a note..." required />
      <div className="flex items-center justify-between gap-3">
        <Select name="authorAgentId">
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Author" />
          </SelectTrigger>
          <SelectContent>
            {agents.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit">Add Note</Button>
      </div>
    </form>
  );
}
