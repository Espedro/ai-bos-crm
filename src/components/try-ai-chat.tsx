"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { Bot, Send, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAiTestReply } from "@/lib/actions/aiTest";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EntityAvatar } from "@/components/entity-avatar";

type TestMessage = { sender: "CUSTOMER" | "AI"; body: string };

export function TryAiChat({ agentName }: { agentName: string }) {
  const [messages, setMessages] = useState<TestMessage[]>([]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    const text = input.trim();
    if (!text || isPending) return;

    const history = messages;
    const next: TestMessage[] = [...history, { sender: "CUSTOMER", body: text }];
    setMessages(next);
    setInput("");

    startTransition(async () => {
      const { reply } = await getAiTestReply(history, text);
      setMessages((current) => [...current, { sender: "AI", body: reply }]);
    });
  }

  return (
    <div className="flex h-[70vh] flex-col rounded-lg border">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <p className="text-sm font-medium text-muted-foreground">
          Nothing here is saved — this is just you, testing your AI Employee.
        </p>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setMessages([])} className="gap-1.5">
            <RotateCcw className="size-3.5" />
            Reset
          </Button>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-center">
            <p className="max-w-xs text-sm text-muted-foreground">
              Type a message below like a customer would, and see how your AI Employee
              responds using your own Business Resources.
            </p>
          </div>
        )}
        {messages.map((message, index) => {
          const isCustomer = message.sender === "CUSTOMER";
          return (
            <div key={index} className={cn("flex", isCustomer ? "justify-start" : "justify-end")}>
              <div className={cn("flex items-end gap-2", !isCustomer && "flex-row-reverse")}>
                {isCustomer ? (
                  <EntityAvatar name={agentName} size="sm" />
                ) : (
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Bot className="size-4" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[78vw] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap shadow-sm sm:max-w-[420px]",
                    isCustomer ? "bg-muted" : "bg-primary text-primary-foreground"
                  )}
                >
                  {message.body}
                </div>
              </div>
            </div>
          );
        })}
        {isPending && (
          <div className="flex justify-end">
            <div className="flex items-end gap-2 flex-row-reverse">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Bot className="size-4" />
              </div>
              <div className="rounded-2xl bg-primary/10 px-3.5 py-2 text-sm text-muted-foreground">
                Thinking…
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        className="flex gap-2 border-t p-3"
        onSubmit={(event) => {
          event.preventDefault();
          handleSend();
        }}
      >
        <Input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Type a message as a customer would…"
          disabled={isPending}
          autoFocus
        />
        <Button type="submit" disabled={isPending || !input.trim()} size="icon">
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
