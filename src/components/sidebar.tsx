"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { OPEN_COMMAND_PALETTE_EVENT } from "@/components/command-palette";
import { ThemeToggle } from "@/components/theme-toggle";
import { logout } from "@/lib/actions/auth";
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
  Menu,
  X,
  LogOut,
} from "lucide-react";

const topLinks = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/companies", label: "Companies", icon: Building2 },
  { href: "/deals", label: "Deals", icon: KanbanSquare },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
];

const bottomLinks = [
  { href: "/forms", label: "Forms", icon: ClipboardList, adminOnly: false },
  { href: "/campaigns", label: "Campaigns", icon: Send, adminOnly: true },
  { href: "/resources", label: "Resources", icon: BookOpen, adminOnly: false },
  { href: "/settings/channels", label: "Settings", icon: Settings, adminOnly: true },
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

export function Sidebar({
  agentName,
  agentRole,
}: { agentName?: string; agentRole?: "ADMIN" | "MEMBER" } = {}) {
  const isAdmin = agentRole !== "MEMBER";
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const channel = searchParams.get("channel");
  const conversationsActive =
    pathname === "/inbox" || pathname.startsWith("/comments");
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const expanded = isOpen || conversationsActive;

  return (
    <>
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-sidebar-border bg-sidebar px-4 text-sidebar-foreground lg:hidden">
        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          aria-label="Open menu"
          className="flex size-8 items-center justify-center rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <Menu className="size-5" />
        </button>
        <p className="text-lg leading-tight font-extrabold tracking-tight">
          <span className="text-primary">AI</span> BOS
        </p>
      </div>

      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-screen w-60 shrink-0 -translate-x-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-200 lg:static lg:translate-x-0",
          isMobileOpen && "translate-x-0"
        )}
      >
        <div className="flex items-center justify-between px-6 py-6">
          <p className="text-xl leading-tight font-extrabold tracking-tight">
            <span className="text-primary">AI</span> BOS
          </p>
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            aria-label="Close menu"
            className="flex size-7 items-center justify-center rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground lg:hidden"
          >
            <X className="size-4" />
          </button>
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

      <nav
        className="flex-1 space-y-0.5 px-3 py-2"
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("a")) setIsMobileOpen(false);
        }}
      >
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
          if (link.adminOnly && !isAdmin) return null;
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
          <p className="truncate text-xs font-medium text-sidebar-foreground/80" title={agentName}>
            {agentName ?? "One Platform. Every Conversation."}
          </p>
          <div className="flex shrink-0 items-center">
            <ThemeToggle />
            {agentName && (
              <form action={logout}>
                <button
                  type="submit"
                  aria-label="Log out"
                  className="flex size-7 items-center justify-center rounded-lg text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                >
                  <LogOut className="size-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
