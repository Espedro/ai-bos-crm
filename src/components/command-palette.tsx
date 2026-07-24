"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Users,
  Building2,
  KanbanSquare,
  CheckSquare,
  MessageCircle,
  MessageSquare,
  Camera,
  MessageSquareText,
  BookOpen,
  Settings,
  Sparkles,
} from "lucide-react";

export const OPEN_COMMAND_PALETTE_EVENT = "open-command-palette";

const navigationItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/companies", label: "Companies", icon: Building2 },
  { href: "/deals", label: "Deals", icon: KanbanSquare },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/resources", label: "Resources", icon: BookOpen },
  { href: "/try-ai", label: "Try Your AI", icon: Sparkles },
  { href: "/settings/channels", label: "Settings", icon: Settings },
];

const conversationItems = [
  { href: "/inbox?channel=WHATSAPP", label: "WhatsApp", icon: MessageCircle },
  { href: "/inbox?channel=FACEBOOK", label: "Messenger", icon: MessageSquare },
  { href: "/inbox?channel=INSTAGRAM", label: "Instagram", icon: Camera },
  { href: "/comments", label: "Comments", icon: MessageSquareText },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    function onOpenEvent() {
      setOpen(true);
    }
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_COMMAND_PALETTE_EVENT, onOpenEvent);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, onOpenEvent);
    };
  }, []);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command>
        <CommandInput placeholder="Jump to..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            {navigationItems.map((item) => (
              <CommandItem key={item.href} onSelect={() => go(item.href)}>
                <item.icon />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Conversations">
            {conversationItems.map((item) => (
              <CommandItem key={item.href} onSelect={() => go(item.href)}>
                <item.icon />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
        <div className="flex items-center justify-end gap-1 border-t px-3 py-2 text-xs text-muted-foreground">
          <span>Navigate</span>
          <CommandShortcut className="ml-0">↑↓</CommandShortcut>
          <span className="ml-2">Select</span>
          <CommandShortcut className="ml-0">↵</CommandShortcut>
        </div>
      </Command>
    </CommandDialog>
  );
}
