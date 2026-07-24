"use client";

import { useRef, useState, type CSSProperties } from "react";
import {
  LayoutDashboard,
  Users,
  Building2,
  KanbanSquare,
  CheckSquare,
  ClipboardList,
  Send,
  BookOpen,
  Settings,
  Sparkles,
} from "lucide-react";
import {
  WhatsAppGlyph,
  MessengerGlyph,
  InstagramGlyph,
} from "@/components/brand-icons";

/**
 * A static, fictional-data mock of the real Dashboard, framed like a laptop —
 * purely illustrative for marketing. No real business data, no live queries.
 */

const NAV_TOP = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Contacts", icon: Users },
  { label: "Companies", icon: Building2 },
  { label: "Deals", icon: KanbanSquare },
  { label: "Tasks", icon: CheckSquare },
];

const NAV_CHANNELS = [
  { label: "WhatsApp", glyph: WhatsAppGlyph },
  { label: "Messenger", glyph: MessengerGlyph },
  { label: "Instagram", glyph: InstagramGlyph },
];

const NAV_BOTTOM = [
  { label: "Forms", icon: ClipboardList },
  { label: "Campaigns", icon: Send },
  { label: "Resources", icon: BookOpen },
  { label: "Try Your AI", icon: Sparkles },
  { label: "Settings", icon: Settings },
];

const STATS = [
  {
    label: "New Leads",
    value: "24",
    caption: "vs last week",
    change: "+18%",
    tone: "good" as const,
  },
  {
    label: "Active Conversations",
    value: "12",
    caption: "AI handling",
    change: "9",
    tone: "good" as const,
  },
  {
    label: "Needs Human",
    value: "2",
    caption: "handoff queue",
    change: "Urgent",
    tone: "warn" as const,
  },
  {
    label: "Open Pipeline",
    value: "$18,500",
    caption: "4 active deals",
    change: "Qualified",
    tone: "good" as const,
  },
  {
    label: "Overdue Tasks",
    value: "0",
    caption: "all caught up",
    change: "Clean",
    tone: "good" as const,
  },
  {
    label: "AI Response",
    value: "6s",
    caption: "avg first reply",
    change: "Fast",
    tone: "good" as const,
  },
];

const TONE_CLASSES: Record<"good" | "warn", string> = {
  good: "text-[var(--status-good)]",
  warn: "text-[var(--status-serious)]",
};

const STAGES = [
  { name: "New Lead", count: 6, value: "$4,200" },
  { name: "Qualified", count: 4, value: "$6,000" },
  { name: "Presented", count: 3, value: "$5,100" },
  { name: "Proposal", count: 2, value: "$3,200" },
  { name: "Negotiation", count: 1, value: "$1,800" },
  { name: "Won", count: 5, value: "$9,400" },
  { name: "Lost", count: 1, value: "$0" },
];

const AUTOMATION_ROWS = [
  { label: "WhatsApp bot", detail: "Connected", tone: "good" as const },
  { label: "Messenger bot", detail: "Connected", tone: "good" as const },
  { label: "Instagram bot", detail: "Off", tone: "default" as const },
  { label: "Human handoff", detail: "2 waiting", tone: "warn" as const },
];

const AUTOMATION_TONE_CLASSES: Record<"good" | "warn" | "default", string> = {
  good: "border-[var(--status-good)]/35 bg-[var(--status-good)]/10 text-[var(--status-good)]",
  warn: "border-[var(--status-serious)]/35 bg-[var(--status-warning)]/15 text-[var(--status-serious)]",
  default: "border-border bg-muted text-muted-foreground",
};

const ESCALATED = [
  { name: "Marie Joseph", time: "3d ago" },
  { name: "Paul André", time: "1d ago" },
];

const RECENT_DEALS = [
  { title: "Website Redesign", contact: "Claudette R.", stage: "Qualified" },
  { title: "Consulting Package", contact: "Marc D.", stage: "Negotiation" },
];

function Stat({ stat }: { stat: (typeof STATS)[number] }) {
  return (
    <div className="border border-border bg-card px-2.5 py-2">
      <p className="truncate text-[7px] font-bold tracking-wide text-muted-foreground uppercase">
        {stat.label}
      </p>
      <p className="mt-1 text-[13px] font-bold tabular-nums">{stat.value}</p>
      <div className="mt-1 flex items-center justify-between gap-1 text-[7px]">
        <span className="truncate text-muted-foreground">{stat.caption}</span>
        <span className={`font-extrabold uppercase ${TONE_CLASSES[stat.tone]}`}>
          {stat.change}
        </span>
      </div>
    </div>
  );
}

export function ProductPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState<CSSProperties>({
    transform: "perspective(1200px) rotateX(0deg) rotateY(0deg)",
  });

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      transform: `perspective(1200px) rotateX(${(-y * 4).toFixed(
        2
      )}deg) rotateY(${(x * 6).toFixed(2)}deg)`,
    });
  }

  function handleLeave() {
    setTilt({ transform: "perspective(1200px) rotateX(0deg) rotateY(0deg)" });
  }

  return (
    <div className="w-full" style={{ perspective: "1600px" }}>
      <div
        ref={ref}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={{
          ...tilt,
          transitionProperty: "transform",
          transitionDuration: "300ms",
          transitionTimingFunction: "ease-out",
        }}
        className="motion-reduce:!transform-none"
      >
        {/* Aluminum body: bezel around the screen, gradient + edge highlight for depth. */}
        <div className="rounded-t-[14px] bg-gradient-to-b from-neutral-300 via-neutral-200 to-neutral-400 p-2.5 pb-0 shadow-[0_1px_0_rgba(255,255,255,0.6)_inset] dark:from-neutral-600 dark:via-neutral-500 dark:to-neutral-700">
          {/* Black screen bezel */}
          <div className="relative rounded-t-[4px] bg-neutral-950 p-[3px] pb-0">
            <span className="absolute top-1.5 left-1/2 z-10 size-[3px] -translate-x-1/2 rounded-full bg-neutral-700 ring-1 ring-black/40" />
            <div className="relative overflow-hidden rounded-t-[2px] bg-background">
              <div className="flex text-left">
                <div className="w-[110px] shrink-0 border-r border-border bg-card py-2">
                  <p className="px-2.5 text-[10px] leading-tight font-extrabold tracking-tight">
                    <span className="text-primary">AI</span> BOS
                  </p>
                  <div className="mt-2 space-y-0.5 px-1.5">
                    {NAV_TOP.map(({ label, icon: Icon, active }) => (
                      <div
                        key={label}
                        className={`flex items-center gap-1.5 px-1.5 py-1 text-[7px] font-medium ${
                          active
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        <Icon className="size-2" />
                        <span className="truncate">{label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 space-y-0.5 px-1.5">
                    {NAV_CHANNELS.map(({ label, glyph: Glyph }) => (
                      <div
                        key={label}
                        className="flex items-center gap-1.5 px-1.5 py-1 text-[7px] text-muted-foreground"
                      >
                        <Glyph className="size-2" />
                        <span className="truncate">{label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 space-y-0.5 border-t border-border px-1.5 pt-2">
                    {NAV_BOTTOM.map(({ label, icon: Icon }) => (
                      <div
                        key={label}
                        className="flex items-center gap-1.5 px-1.5 py-1 text-[7px] text-muted-foreground"
                      >
                        <Icon className="size-2" />
                        <span className="truncate">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="min-w-0 flex-1 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[7px] font-bold tracking-wide text-muted-foreground uppercase">
                        AI CRM Command Center
                      </p>
                      <p className="mt-0.5 text-[13px] font-bold tracking-tight">
                        Dashboard
                      </p>
                    </div>
                    <span className="inline-flex h-4 items-center gap-1 border border-[var(--status-good)]/30 bg-[var(--status-good)]/10 px-1.5 text-[7px] font-bold tracking-wide text-[var(--status-good)] uppercase">
                      <span className="size-1 bg-current" />
                      Automation Live
                    </span>
                  </div>

                  <div className="mt-2 grid grid-cols-3 gap-1.5 sm:grid-cols-6">
                    {STATS.map((stat) => (
                      <Stat key={stat.label} stat={stat} />
                    ))}
                  </div>

                  <div className="mt-3 grid grid-cols-[1.6fr_0.9fr] gap-2">
                    <div className="border border-border">
                      <div className="flex items-center justify-between border-b border-border px-2 py-1">
                        <p className="text-[7px] font-bold tracking-wide uppercase">
                          Pipeline Board
                        </p>
                        <span className="border border-primary/35 bg-primary/10 px-1 text-[6px] font-extrabold tracking-wide text-primary uppercase">
                          Live CRM
                        </span>
                      </div>
                      <div className="flex divide-x divide-border overflow-hidden">
                        {STAGES.map((stage) => (
                          <div
                            key={stage.name}
                            className="min-w-0 flex-1 space-y-0.5 px-1.5 py-1.5"
                          >
                            <p className="truncate text-[6px] font-semibold text-muted-foreground uppercase">
                              {stage.name}
                            </p>
                            <p className="text-[10px] font-bold tabular-nums">
                              {stage.count}
                            </p>
                            <p className="truncate text-[6px] text-muted-foreground">
                              {stage.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border border-border">
                      <div className="border-b border-border px-2 py-1">
                        <p className="text-[7px] font-bold tracking-wide uppercase">
                          Automation Health
                        </p>
                      </div>
                      <div className="divide-y divide-border">
                        {AUTOMATION_ROWS.map((row) => (
                          <div
                            key={row.label}
                            className="flex items-center justify-between gap-1 px-2 py-1"
                          >
                            <p className="truncate text-[6.5px] font-semibold">
                              {row.label}
                            </p>
                            <span
                              className={`shrink-0 border px-1 text-[6px] font-extrabold tracking-wide uppercase ${
                                AUTOMATION_TONE_CLASSES[row.tone]
                              }`}
                            >
                              {row.detail}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="border border-border">
                      <div className="flex items-center justify-between border-b border-border px-2 py-1">
                        <p className="text-[7px] font-bold tracking-wide uppercase">
                          Needs Attention
                        </p>
                        <span className="border border-[var(--status-critical)]/35 bg-[var(--status-critical)]/10 px-1 text-[6px] font-extrabold text-[var(--status-critical)]">
                          {ESCALATED.length}
                        </span>
                      </div>
                      <div className="divide-y divide-border">
                        {ESCALATED.map((item) => (
                          <div
                            key={item.name}
                            className="flex items-center justify-between gap-1 px-2 py-1"
                          >
                            <p className="truncate text-[6.5px] font-semibold">
                              {item.name}
                            </p>
                            <span className="text-[6px] text-muted-foreground">
                              {item.time}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border border-border">
                      <div className="border-b border-border px-2 py-1">
                        <p className="text-[7px] font-bold tracking-wide uppercase">
                          Recent Deals
                        </p>
                      </div>
                      <div className="divide-y divide-border">
                        {RECENT_DEALS.map((deal) => (
                          <div
                            key={deal.title}
                            className="flex items-center justify-between gap-1 px-2 py-1"
                          >
                            <p className="truncate text-[6.5px] font-semibold">
                              {deal.title}
                            </p>
                            <span className="shrink-0 border border-primary/35 bg-primary/10 px-1 text-[6px] font-extrabold tracking-wide text-primary uppercase">
                              {deal.stage}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Keyboard deck: wider than the screen, tapered, rounded front edge — the physical "base" of the laptop. */}
          <div
            className="relative mx-[-3%] h-6 bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-400 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset] dark:from-neutral-500 dark:via-neutral-600 dark:to-neutral-800"
            style={{ clipPath: "polygon(1.5% 0, 98.5% 0, 100% 100%, 0 100%)" }}
          >
            <div className="absolute inset-x-0 top-0 h-px bg-black/15" />
            <div className="absolute top-0 left-1/2 h-1.5 w-24 -translate-x-1/2 rounded-b-md bg-neutral-500/40 dark:bg-black/30" />
          </div>
        </div>
      </div>

      {/* Grounding shadow — stays fixed while the laptop tilts, like a real shadow on a surface. */}
      <div className="mx-auto -mt-1 h-5 w-[78%] rounded-[100%] bg-black/15 blur-xl dark:bg-black/40" />
    </div>
  );
}
