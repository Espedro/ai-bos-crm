"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sendCustomerMessage } from "@/lib/actions/conversations";

export function CustomerMessageForm({ conversationId }: { conversationId: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        const body = String(formData.get("body") ?? "");
        formRef.current?.reset();
        await sendCustomerMessage(conversationId, body);
      }}
      className="flex items-end gap-2"
    >
      <Textarea
        name="body"
        placeholder="Type as the customer (simulating WhatsApp)..."
        required
        rows={2}
        className="flex-1"
      />
      <Button type="submit">Send as Customer</Button>
    </form>
  );
}
