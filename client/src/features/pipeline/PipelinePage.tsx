import { useMemo } from "react";
import { DndContext, DragEndEvent, useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GripVertical, PhoneCall, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency, stages } from "@/lib/utils";
import { Lead, LeadStage } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/toast";

export function PipelinePage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data: leads = [] } = useQuery({ queryKey: ["leads"], queryFn: () => api<Lead[]>("/leads") });
  const grouped = useMemo(() => Object.fromEntries(stages.map((stage) => [stage, leads.filter((lead) => lead.stage === stage)])) as Record<LeadStage, Lead[]>, [leads]);
  const mutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: LeadStage }) => api(`/leads/${id}`, { method: "PATCH", body: JSON.stringify({ stage }) }),
    onMutate: async ({ id, stage }) => {
      await queryClient.cancelQueries({ queryKey: ["leads"] });
      const previous = queryClient.getQueryData<Lead[]>(["leads"]);
      queryClient.setQueryData<Lead[]>(["leads"], (old = []) => old.map((lead) => lead._id === id ? { ...lead, stage } : lead));
      return { previous };
    },
    onSuccess: () => toast.show({ title: "Pipeline updated", body: "Lead stage changed." }),
    onError: (_err, _vars, ctx) => queryClient.setQueryData(["leads"], ctx?.previous)
  });

  function onDragEnd(event: DragEndEvent) {
    const id = String(event.active.id);
    const over = event.over?.id as LeadStage | undefined;
    if (over && stages.includes(over)) mutation.mutate({ id, stage: over });
  }

  return (
    <div className="space-y-5 pb-20 lg:pb-0">
      <div><Badge className="mb-3 bg-accent text-accent-foreground">Drag-and-drop pipeline</Badge><h1 className="text-3xl font-bold tracking-tight">Pipeline Board</h1></div>
      <DndContext onDragEnd={onDragEnd}>
        <div className="grid auto-cols-[280px] grid-flow-col gap-4 overflow-x-auto pb-3">
          {stages.slice(0, 7).map((stage) => (
            <PipelineColumn key={stage} stage={stage} leads={grouped[stage] ?? []} />
          ))}
        </div>
      </DndContext>
    </div>
  );
}

function PipelineColumn({ stage, leads }: { stage: LeadStage; leads: Lead[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <div ref={setNodeRef} className={`min-h-[68vh] rounded-lg border p-3 transition ${isOver ? "bg-accent/70 ring-2 ring-primary/30" : "bg-muted/35"}`}>
      <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold">{stage}</h2><Badge>{leads.length}</Badge></div>
      <div className="space-y-3">{leads.map((lead) => <PipelineCard key={lead._id} lead={lead} />)}</div>
    </div>
  );
}

function PipelineCard({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead._id });
  return (
    <Card ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform) }} className={`touch-none p-3 transition hover:-translate-y-0.5 hover:shadow-md ${isDragging ? "z-50 opacity-70 shadow-xl" : ""}`}>
      <div className="flex items-start gap-3">
        <button {...listeners} {...attributes} className="mt-1 cursor-grab rounded p-1 text-muted-foreground hover:bg-muted" aria-label={`Drag ${lead.name}`}>
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2"><Avatar name={lead.name} className="h-7 w-7" /><p className="truncate text-sm font-semibold">{lead.name}</p></div>
          <p className="mt-2 text-xs text-muted-foreground">{lead.preferredLocation} · {formatCurrency(lead.budget)}</p>
          <div className="mt-3 flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-primary" /><Progress value={lead.aiScore} className="flex-1" /><span className="text-xs font-semibold">{lead.aiScore}</span></div>
          <div className="mt-3 flex gap-2"><Badge><PhoneCall className="mr-1 h-3 w-3" />Call</Badge>{lead.tags.slice(0, 1).map((tag) => <Badge key={tag}>{tag}</Badge>)}</div>
        </div>
      </div>
    </Card>
  );
}
