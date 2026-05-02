import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowDownUp, Filter, Plus, Search, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency, formatDate, stages } from "@/lib/utils";
import { Lead, LeadStage } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useActionModalStore } from "@/stores/actionModal";

export function LeadsPage() {
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState<LeadStage | "All">("All");
  const [sort, setSort] = useState<"intent" | "activity">("intent");
  const queryClient = useQueryClient();
  const toast = useToast();
  const openAction = useActionModalStore((state) => state.openAction);
  const { data: leads = [], isLoading } = useQuery({ queryKey: ["leads"], queryFn: () => api<Lead[]>("/leads") });
  const updateLead = useMutation({
    mutationFn: ({ id, nextStage }: { id: string; nextStage: LeadStage }) => api<Lead>(`/leads/${id}`, { method: "PATCH", body: JSON.stringify({ stage: nextStage }) }),
    onMutate: async ({ id, nextStage }) => {
      await queryClient.cancelQueries({ queryKey: ["leads"] });
      const previous = queryClient.getQueryData<Lead[]>(["leads"]);
      queryClient.setQueryData<Lead[]>(["leads"], (old = []) => old.map((lead) => lead._id === id ? { ...lead, stage: nextStage } : lead));
      return { previous };
    },
    onSuccess: () => toast.show({ title: "Stage updated", body: "AI intent and funnel metrics will refresh." }),
    onError: (_error, _vars, context) => queryClient.setQueryData(["leads"], context?.previous),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-feed"] });
    }
  });

  const filtered = useMemo(() => {
    const result = leads.filter((lead) => {
      const haystack = `${lead.name} ${lead.phone} ${lead.preferredLocation} ${lead.source} ${lead.stage}`.toLowerCase();
      return haystack.includes(query.toLowerCase()) && (stage === "All" || lead.stage === stage);
    });
    return [...result].sort((a, b) => sort === "intent" ? b.aiScore - a.aiScore : new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime());
  }, [leads, query, stage, sort]);

  return (
    <div className="space-y-5 pb-20 lg:pb-0">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <Badge className="mb-3 bg-accent text-accent-foreground">Lead command center</Badge>
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <p className="mt-2 text-muted-foreground">AI-prioritized prospects with stage control, source context, last activity, and next operational signals.</p>
        </div>
        <Button onClick={() => openAction("Add Lead")}><Plus className="h-4 w-4" /> New lead</Button>
      </div>
      <Card className="sticky top-20 z-20">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search name, phone, source, location" value={query} onChange={(event) => setQuery(event.target.value)} />
            </div>
            <div className="flex gap-2 overflow-auto">
              <Button variant="secondary" onClick={() => setStage("All")}><Filter className="h-4 w-4" /> All</Button>
              {stages.map((item) => <Button key={item} variant={stage === item ? "primary" : "secondary"} onClick={() => setStage(item)} className="shrink-0">{item}</Button>)}
              <Button variant="secondary" onClick={() => setSort(sort === "intent" ? "activity" : "intent")}><ArrowDownUp className="h-4 w-4" /> {sort === "intent" ? "AI Intent" : "Activity"}</Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="overflow-hidden">
        <div className="hidden grid-cols-[1.35fr_.85fr_.75fr_.9fr_.9fr_.75fr] gap-4 border-b bg-muted/40 px-5 py-3 text-xs font-semibold uppercase text-muted-foreground lg:grid">
          <span>Lead</span><span>Stage</span><span>Budget</span><span>Owner</span><span>Last Activity</span><span>AI Intent</span>
        </div>
        <div className="divide-y divide-border/60">
          {isLoading ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="m-3 h-24" />) : filtered.map((lead, index) => (
            <motion.div key={lead._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.015 }} className="grid gap-4 p-5 transition duration-300 hover:bg-muted/35 lg:grid-cols-[1.35fr_.85fr_.75fr_.9fr_.9fr_.75fr] lg:items-center">
              <Link to={`/leads/${lead._id}`} className="flex min-w-0 items-center gap-3">
                <Avatar name={lead.name} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-semibold">{lead.name}</p>
                    <IntentBadge lead={lead} />
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">{lead.phone}</p>
                  <div className="mt-2 flex flex-wrap gap-2"><SourceBadge source={lead.source} /><Badge>{lead.preferredLocation}</Badge></div>
                </div>
              </Link>
              <div className="space-y-2">
                <select value={lead.stage} onChange={(event) => updateLead.mutate({ id: lead._id, nextStage: event.target.value as LeadStage })} className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                  {stages.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                <p className="text-xs text-muted-foreground">Update Stage</p>
              </div>
              <p className="text-sm font-medium">{formatCurrency(lead.budget)}</p>
              <div className="flex items-center gap-2"><Avatar name={lead.assignedAgent?.name ?? "Agent"} src={lead.assignedAgent?.avatar} /><span className="truncate text-sm">{lead.assignedAgent?.name ?? "Unassigned"}</span></div>
              <div><p className="text-sm">{activitySignal(lead)}</p><p className="mt-1 text-xs text-muted-foreground">{formatDate(lead.nextFollowUpAt)}</p></div>
              <AiIntent lead={lead} />
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function AiIntent({ lead }: { lead: Lead }) {
  const reasons = lead.intelligence?.reasons?.length ? lead.intelligence.reasons : fallbackReasons(lead);
  return (
    <div className="group relative space-y-2">
      <div className="flex items-center justify-between gap-2 text-sm"><span className="font-semibold">{lead.aiScore}</span><span className="text-xs text-muted-foreground">{lead.intelligence?.category ?? categoryFor(lead.aiScore)}</span></div>
      <Progress value={lead.aiScore} />
      <div className="pointer-events-none absolute right-0 top-full z-30 mt-2 hidden w-72 rounded-lg border bg-card p-3 text-xs shadow-2xl group-hover:block">
        <div className="mb-2 flex items-center gap-2 font-semibold text-foreground"><Sparkles className="h-3.5 w-3.5 text-primary" /> AI Intent reasoning</div>
        <ul className="space-y-1 text-muted-foreground">{reasons.map((reason) => <li key={reason}>- {reason}</li>)}</ul>
      </div>
    </div>
  );
}

function IntentBadge({ lead }: { lead: Lead }) {
  const state = lead.intelligence?.priorityState ?? (lead.aiScore >= 90 ? "High Intent" : lead.aiScore < 40 ? "Low Activity" : "Engaged");
  const tone = lead.aiScore >= 90 ? "bg-orange-500/15 text-orange-300 border-orange-500/30" : lead.aiScore >= 70 ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/25" : lead.aiScore >= 40 ? "bg-amber-500/10 text-amber-300 border-amber-500/25" : "bg-slate-500/10 text-slate-300 border-slate-500/25";
  return <Badge className={tone}>{state}</Badge>;
}

function SourceBadge({ source }: { source: string }) {
  return <Badge className="bg-background/60">{source}</Badge>;
}

function categoryFor(score: number) {
  if (score >= 90) return "Hot";
  if (score >= 70) return "Warm";
  if (score >= 40) return "Watchlist";
  return "Cold";
}

function fallbackReasons(lead: Lead) {
  return [
    lead.pricingViews > 1 ? "Viewed pricing multiple times" : "Pricing engagement tracked",
    lead.stage.includes("Tour") ? "Tour activity detected" : "Lifecycle stage informs intent",
    lead.aiScore >= 70 ? "Healthy booking probability" : "Needs more engagement"
  ];
}

function activitySignal(lead: Lead) {
  const hours = Math.round((Date.now() - new Date(lead.lastActivityAt).getTime()) / 36e5);
  if (lead.stage === "Reserved") return "Reservation awaiting deposit";
  if (lead.stage === "Tour Done") return "Tour completed recently";
  if (lead.pricingViews > 2) return "Pricing requested";
  if (hours >= 36) return `No response for ${hours}h`;
  if (hours <= 2) return "Replied recently";
  return `Active ${hours}h ago`;
}
