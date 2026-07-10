const STAGE_DOT_PALETTE = [
  "bg-sky-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-fuchsia-500",
  "bg-amber-500",
  "bg-orange-500",
];

export function stageDotColor(name: string, index: number): string {
  const lower = name.toLowerCase();
  if (lower.includes("won")) return "bg-emerald-500";
  if (lower.includes("lost")) return "bg-rose-500";
  return STAGE_DOT_PALETTE[index % STAGE_DOT_PALETTE.length];
}
