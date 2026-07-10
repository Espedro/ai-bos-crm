"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { OPEN_COMMAND_PALETTE_EVENT } from "@/components/command-palette";
import { ThemeToggle } from "@/components/theme-toggle";
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
  ChevronDown,
  Search,
  ClipboardList,
  Send,
} from "lucide-react";

const topLinks = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/companies", label: "Companies", icon: Building2 },
  { href: "/deals", label: "Deals", icon: KanbanSquare },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
];

const bottomLinks = [
  { href: "/forms", label: "Forms", icon: ClipboardList },
  { href: "/campaigns", label: "Campaigns", icon: Send },
  { href: "/resources", label: "Resources", icon: BookOpen },
  { href: "/settings/channels", label: "Settings", icon: Settings },
];

const conversationLinks = [
  {
    href: "/inbox?channel=WHATSAPP",
    label: "WhatsApp",
    icon: MessageCircle,
    iconClasses: "text-channel-whatsapp-foreground",
    isActive: (pathname: string, channel: string | null) =>
      pathname === "/inbox" && channel === "WHATSAPP",
  },
  {
    href: "/inbox?channel=FACEBOOK",
    label: "Messenger",
    icon: MessageSquare,
    iconClasses: "text-channel-facebook-foreground",
    isActive: (pathname: string, channel: string | null) =>
      pathname === "/inbox" && channel === "FACEBOOK",
  },
  {
    href: "/inbox?channel=INSTAGRAM",
    label: "Instagram",
    icon: Camera,
    iconClasses: "text-channel-instagram-foreground",
    isActive: (pathname: string, channel: string | null) =>
      pathname === "/inbox" && channel === "INSTAGRAM",
  },
  {
    href: "/comments",
    label: "Comments",
    icon: MessageSquareText,
    iconClasses: "text-amber-500",
    isActive: (pathname: string) => pathname.startsWith("/comments"),
  },
];

const navItemBase =
  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors";
const navItemActive = "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm";
const navItemInactive =
  "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground";

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const channel = searchParams.get("channel");
  const conversationsActive =
    pathname === "/inbox" || pathname.startsWith("/comments");
  const [isOpen, setIsOpen] = useState(true);
  const expanded = isOpen || conversationsActive;

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="px-6 py-6">
        <p className="text-xl leading-tight font-extrabold tracking-tight">
          <span className="text-primary">AI</span> BOS
        </p>
      </div>

      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event(OPEN_COMMAND_PALETTE_EVENT))}
        className="mx-3 mb-2 flex items-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/60 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent"
      >
        <Search className="size-4 shrink-0" />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="rounded border border-sidebar-border bg-sidebar px-1.5 py-0.5 text-[10px] font-semibold tracking-wide">
          ⌘K
        </kbd>
      </button>

      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {topLinks.map((link) => {
          const active =
            link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(navItemBase, active ? navItemActive : navItemInactive)}
            >
              <Icon className="size-4 shrink-0" />
              {link.label}
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          className={cn(
            "w-full",
            navItemBase,
            conversationsActive ? navItemActive : navItemInactive
          )}
        >
          <MessageCircle className="size-4 shrink-0" />
          <span className="flex-1 text-left">Conversations</span>
          <ChevronDown
            className={cn("size-3.5 shrink-0 transition-transform", expanded && "rotate-180")}
          />
        </button>

        {expanded && (
          <div className="space-y-0.5 py-0.5 pl-2">
            {conversationLinks.map((link) => {
              const active = link.isActive(pathname, channel);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(navItemBase, active ? navItemActive : navItemInactive)}
                >
                  <Icon className={cn("size-4 shrink-0", !active && link.iconClasses)} />
                  {link.label}
                </Link>
              );
            })}
          </div>
        )}

        <p className="px-3 pt-5 pb-1 text-xs font-bold tracking-wider text-muted-foreground/70 uppercase">
          General
        </p>
        {bottomLinks.map((link) => {
          const active = pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(navItemBase, active ? navItemActive : navItemInactive)}
            >
              <Icon className="size-4 shrink-0" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center justify-between border-t border-sidebar-border px-6 py-4">
        <p className="text-xs text-muted-foreground">One Platform. Every Conversation.</p>
        <ThemeToggle className="-mr-1" />
      </div>
    </aside>
  );
}
