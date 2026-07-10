// Six-slot validated categorical palette (see globals.css --chart-1..6) plus
// the reserved status palette for Won/Lost — assigned in fixed order, never
// cycled arbitrarily, so pipeline-stage color stays consistent between the
// dot list and the dashboard charts.
const STAGE_CHART_SLOTS = [
  "--chart-1",
  "--chart-2",
  "--chart-3",
  "--chart-4",
  "--chart-5",
  "--chart-6",
];

function stageSlot(name: string, index: number): string {
  const lower = name.toLowerCase();
  if (lower.includes("won")) return "--status-good";
  if (lower.includes("lost")) return "--status-critical";
  return STAGE_CHART_SLOTS[index % STAGE_CHART_SLOTS.length];
}

export function stageDotColor(name: string, index: number): string {
  return `bg-[var(${stageSlot(name, index)})]`;
}

export function stageChartColor(name: string, index: number): string {
  return `var(${stageSlot(name, index)})`;
}
