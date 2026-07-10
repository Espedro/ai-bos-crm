"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EntityAvatar } from "@/components/entity-avatar";
import { moveDealToStage } from "@/lib/actions/deals";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { stageDotColor } from "@/lib/stage-colors";

type Deal = {
  id: string;
  title: string;
  value: number;
  currency: string;
  contact: { id: string; firstName: string; lastName: string };
  assignedAgent: { id: string; name: string } | null;
};

type Stage = {
  id: string;
  name: string;
  deals: Deal[];
};

function DealCard({ deal }: { deal: Deal }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
        opacity: isDragging ? 0.4 : 1,
      }}
      className="touch-none"
    >
      <Card className="cursor-grab gap-0 py-0 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing">
        <CardContent className="space-y-3 p-3">
          <p className="text-sm font-medium leading-snug">{deal.title}</p>
          <div className="flex items-center justify-between">
            <Link
              href={`/contacts/${deal.contact.id}`}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              <EntityAvatar
                name={`${deal.contact.firstName} ${deal.contact.lastName}`}
                size="sm"
                className="size-5"
              />
              {deal.contact.firstName} {deal.contact.lastName}
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="font-mono">
              {deal.currency} {Number(deal.value).toLocaleString()}
            </Badge>
            {deal.assignedAgent && (
              <span className="text-xs text-muted-foreground">
                {deal.assignedAgent.name}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StageColumn({ stage, index }: { stage: Stage; index: number }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  const total = stage.deals.reduce((sum, d) => sum + Number(d.value), 0);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-64 shrink-0 flex-col gap-2 rounded-lg border bg-muted/30 p-2 transition-shadow",
        isOver && "ring-2 ring-primary"
      )}
    >
      <div className="flex items-center justify-between px-1 pt-1">
        <div className="flex items-center gap-2">
          <span className={cn("size-2 rounded-full", stageDotColor(stage.name, index))} />
          <h3 className="text-sm font-medium">{stage.name}</h3>
        </div>
        <span className="rounded-full bg-background px-1.5 py-0.5 text-xs text-muted-foreground">
          {stage.deals.length}
        </span>
      </div>
      {total > 0 && (
        <p className="px-1 font-mono text-xs text-muted-foreground">
          ${total.toLocaleString()}
        </p>
      )}
      <div className="flex flex-col gap-2">
        {stage.deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} />
        ))}
      </div>
    </div>
  );
}

export function KanbanBoard({ stages: initialStages }: { stages: Stage[] }) {
  const [stages, setStages] = useState(initialStages);
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function handleDragStart(event: DragStartEvent) {
    const deal = stages
      .flatMap((s) => s.deals)
      .find((d) => d.id === event.active.id);
    setActiveDeal(deal ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDeal(null);
    const { active, over } = event;
    if (!over) return;

    const dealId = String(active.id);
    const targetStageId = String(over.id);

    const sourceStage = stages.find((s) => s.deals.some((d) => d.id === dealId));
    if (!sourceStage || sourceStage.id === targetStageId) return;

    const deal = sourceStage.deals.find((d) => d.id === dealId)!;

    setStages((prev) =>
      prev.map((s) => {
        if (s.id === sourceStage.id) {
          return { ...s, deals: s.deals.filter((d) => d.id !== dealId) };
        }
        if (s.id === targetStageId) {
          return { ...s, deals: [deal, ...s.deals] };
        }
        return s;
      })
    );

    startTransition(() => {
      moveDealToStage(dealId, targetStageId);
    });
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {stages.map((stage, index) => (
          <StageColumn key={stage.id} stage={stage} index={index} />
        ))}
      </div>
      <DragOverlay>{activeDeal && <DealCard deal={activeDeal} />}</DragOverlay>
    </DndContext>
  );
}
