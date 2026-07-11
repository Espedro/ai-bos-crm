import { cn } from "@/lib/utils";

export function LeadScoreBar({ score, className }: { score: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, score));
  const color =
    pct >= 70 ? "var(--status-good)" : pct >= 40 ? "var(--status-warning)" : "var(--muted-foreground)";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">{score}</span>
    </div>
  );
}
