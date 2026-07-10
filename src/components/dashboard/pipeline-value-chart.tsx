"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TooltipContentProps } from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import { stageChartColor } from "@/lib/stage-colors";

export type StageValueDatum = {
  id: string;
  name: string;
  value: number;
  count: number;
};

function ChartTooltip({ active, payload }: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as StageValueDatum;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-popover-foreground">{d.name}</p>
      <p className="text-muted-foreground">
        {d.count} deal{d.count === 1 ? "" : "s"} · ${d.value.toLocaleString()}
      </p>
    </div>
  );
}

export function PipelineValueChart({ data }: { data: StageValueDatum[] }) {
  const height = Math.max(200, data.length * 36);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 28, bottom: 4, left: 4 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={160}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
        />
        <Tooltip cursor={{ fill: "var(--muted)" }} content={ChartTooltip} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={18}>
          {data.map((entry, index) => (
            <Cell key={entry.id} fill={stageChartColor(entry.name, index)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
