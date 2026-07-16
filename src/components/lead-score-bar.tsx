import { cn } from "@/lib/utils";

export function LeadScoreBar({ score, className }: { score: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, score));

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-[7px] w-[76px] overflow-hidden bg-muted">
        <div className="h-full bg-[var(--chart-2)]" style={{ width: `${pct}%` }} />
      </div>
      <strong className="text-sm font-bold tabular-nums">{score}</strong>
    </div>
  );
}
