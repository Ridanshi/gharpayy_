import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BrainCircuit, CalendarDays, CheckCircle2, Clock, Home, PhoneCall, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency, formatDate, stages } from "@/lib/utils";
import { Lead, Property, Visit } from "@/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

type Detail = {
  lead: Lead;
  notes: { _id: string; body: string; author: { name: string; avatar?: string }; createdAt: string }[];
  tasks: { _id: string; title: string; dueAt: string; priority: string; status: string }[];
  visits: Visit[];
  recommendations: { property: Property; match: { score: number; labels: string[] } }[];
};

export function LeadDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [tab, setTab] = useState<"timeline" | "matches" | "tasks">("timeline");
  const [noteBody, setNoteBody] = useState("");
  const [callSummary, setCallSummary] = useState("");
  const [visitProperty, setVisitProperty] = useState("");
  const [visitTime, setVisitTime] = useState(defaultVisitTime());
  const [visitNote, setVisitNote] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["lead", id], queryFn: () => api<Detail>(`/leads/${id}`), enabled: Boolean(id) });
  const refreshLead = () => queryClient.invalidateQueries({ queryKey: ["lead", id] });
  const addNote = useMutation({
    mutationFn: () => api(`/leads/${id}/notes`, { method: "POST", body: JSON.stringify({ body: noteBody }) }),
    onSuccess: () => {
      setNoteBody("");
      refreshLead();
      toast.show({ title: "Note added", body: "The lead timeline has been updated." });
    }
  });
  const logCall = useMutation({
    mutationFn: () => api(`/leads/${id}/calls`, { method: "POST", body: JSON.stringify({ outcome: "Connected", summary: callSummary }) }),
    onSuccess: () => {
      setCallSummary("");
      setTab("timeline");
      refreshLead();
      toast.show({ title: "Call logged", body: "Call activity is now visible in the timeline." });
    }
  });
  const scheduleVisit = useMutation({
    mutationFn: () =>
      api(`/leads/${id}/visits`, {
        method: "POST",
        body: JSON.stringify({
          property: visitProperty || data?.recommendations[0]?.property._id,
          scheduledAt: new Date(visitTime).toISOString(),
          note: visitNote
        })
      }),
    onSuccess: () => {
      setVisitNote("");
      setVisitTime(defaultVisitTime());
      setTab("timeline");
      refreshLead();
      toast.show({ title: "Tour scheduled", body: "The visit has been added and the lead stage was updated." });
    }
  });
  if (isLoading || !data) return <Skeleton className="h-[70vh]" />;
  const { lead } = data;
  const currentIndex = stages.indexOf(lead.stage);

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="sticky top-16 z-20 -mx-4 border-b bg-background/90 px-4 py-4 backdrop-blur-xl sm:-mx-6 sm:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={lead.name} className="h-12 w-12" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{lead.name}</h1>
                <Badge className="bg-accent text-accent-foreground">{lead.stage}</Badge>
                <Badge>{Math.round((lead.intelligence?.conversionProbability ?? 0) * 100)}% conversion</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{lead.phone} - {lead.preferredLocation} - {formatCurrency(lead.budget)}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setTab("tasks")}><PhoneCall className="h-4 w-4" /> Log call</Button>
            <Button onClick={() => document.getElementById("schedule-visit-form")?.scrollIntoView({ behavior: "smooth", block: "center" })}><CalendarDays className="h-4 w-4" /> Schedule tour</Button>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid gap-2 md:grid-cols-8">
            {stages.slice(0, 8).map((stage, index) => (
              <div key={stage} className="flex items-center gap-2 rounded-md border bg-muted/35 p-2">
                <div className={`grid h-6 w-6 place-items-center rounded-full text-xs ${index <= currentIndex ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {index < currentIndex ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}
                </div>
                <span className="truncate text-xs font-medium">{stage}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="flex gap-2 overflow-auto rounded-lg border bg-card p-2">
            {[
              ["timeline", "Timeline"],
              ["matches", "Property Matches"],
              ["tasks", "Tasks & Calls"]
            ].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key as typeof tab)} className={`shrink-0 rounded-md px-3 py-2 text-sm font-medium transition ${tab === key ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                {label}
              </button>
            ))}
          </div>

          {tab === "timeline" && (
            <Card>
              <CardHeader><h2 className="font-semibold">Interaction Timeline</h2></CardHeader>
              <CardContent className="space-y-4">
                {lead.activity.map((item) => (
                  <div key={item._id} className="flex gap-4 rounded-md border bg-background/60 p-4 transition hover:bg-accent/20">
                    <div className="mt-1 grid h-9 w-9 place-items-center rounded-full bg-accent text-accent-foreground"><Clock className="h-4 w-4" /></div>
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{item.description ?? "Operational touchpoint recorded by FlowOps AI."}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{formatDate(item.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {tab === "matches" && (
            <Card>
              <CardHeader><h2 className="font-semibold">Property Recommendations</h2></CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {data.recommendations.map(({ property, match }) => (
                  <div key={property._id} className="overflow-hidden rounded-lg border bg-background transition hover:-translate-y-1 hover:shadow-glow">
                    <img src={property.images[0]} alt={property.name} className="h-32 w-full object-cover" />
                    <div className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div><p className="font-semibold">{property.name}</p><p className="text-sm text-muted-foreground">{property.locality}</p></div>
                        <Badge>{match.score}%</Badge>
                      </div>
                      <Progress value={match.score} />
                      <div className="flex flex-wrap gap-2">{match.labels.map((label) => <Badge key={label}>{label}</Badge>)}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {tab === "tasks" && (
            <Card>
              <CardHeader><h2 className="font-semibold">Tasks, Call Logs, and Reminders</h2></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 rounded-md border bg-background/70 p-4">
                  <div className="flex items-center gap-2"><PhoneCall className="h-4 w-4 text-primary" /><p className="font-semibold">Log a call</p></div>
                  <textarea value={callSummary} onChange={(event) => setCallSummary(event.target.value)} placeholder="Call summary, objections, next step..." className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />
                  <Button size="sm" disabled={logCall.isPending || callSummary.trim().length < 2} onClick={() => logCall.mutate()}>
                    <PhoneCall className="h-4 w-4" /> {logCall.isPending ? "Logging..." : "Save call log"}
                  </Button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                {data.tasks.map((task) => (
                  <div key={task._id} className="rounded-md border bg-background/70 p-4">
                    <div className="flex items-center justify-between gap-3"><p className="font-semibold">{task.title}</p><Badge>{task.priority}</Badge></div>
                    <p className="mt-2 text-sm text-muted-foreground">{task.status} - {formatDate(task.dueAt)}</p>
                  </div>
                ))}
                {!data.tasks.length && <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">No open tasks for this lead.</div>}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="space-y-6">
          <Card className="shadow-glow">
            <CardHeader><div className="flex items-center gap-2"><BrainCircuit className="h-4 w-4 text-primary" /><h2 className="font-semibold">AI Recommendation</h2></div></CardHeader>
            <CardContent className="space-y-4">
              <div><p className="text-4xl font-bold text-primary">{lead.intelligence?.urgencyScore}</p><p className="text-sm text-muted-foreground">Urgency score</p></div>
              <Progress value={lead.intelligence?.urgencyScore ?? 0} />
              <p className="text-sm text-muted-foreground">{lead.intelligence?.insight}</p>
              <div className="rounded-md border bg-accent/45 p-3 text-sm"><Sparkles className="mb-2 h-4 w-4 text-primary" />{lead.intelligence?.nextBestAction}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><h2 className="font-semibold">Scheduled Visits</h2></CardHeader>
            <CardContent className="space-y-3">
              <div id="schedule-visit-form" className="space-y-3 rounded-md border bg-background/60 p-3">
                <select value={visitProperty} onChange={(event) => setVisitProperty(event.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                  <option value="">Best matched property</option>
                  {data.recommendations.map(({ property }) => <option key={property._id} value={property._id}>{property.name}</option>)}
                </select>
                <Input type="datetime-local" value={visitTime} onChange={(event) => setVisitTime(event.target.value)} />
                <textarea value={visitNote} onChange={(event) => setVisitNote(event.target.value)} placeholder="Visit prep note" className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />
                <Button className="w-full" size="sm" disabled={scheduleVisit.isPending || !visitTime || (!visitProperty && !data.recommendations[0])} onClick={() => scheduleVisit.mutate()}>
                  <CalendarDays className="h-4 w-4" /> {scheduleVisit.isPending ? "Scheduling..." : "Schedule visit"}
                </Button>
              </div>
              {data.visits.map((visit) => (
                <div key={visit._id} className="rounded-md border bg-background/60 p-3">
                  <div className="flex items-center gap-2"><Home className="h-4 w-4 text-primary" /><p className="font-medium">{visit.property.name}</p></div>
                  <p className="mt-1 text-sm text-muted-foreground">{formatDate(visit.scheduledAt)} - {visit.status}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><h2 className="font-semibold">Notes</h2></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-3 rounded-md border bg-background/60 p-3">
                <textarea value={noteBody} onChange={(event) => setNoteBody(event.target.value)} placeholder="Write an internal note..." className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />
                <Button className="w-full" size="sm" disabled={addNote.isPending || noteBody.trim().length < 2} onClick={() => addNote.mutate()}>
                  <Sparkles className="h-4 w-4" /> {addNote.isPending ? "Adding..." : "Add note"}
                </Button>
              </div>
              {data.notes.map((note) => (
                <div key={note._id} className="rounded-md border bg-background/60 p-3">
                  <p className="text-sm">{note.body}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{note.author.name} - {formatDate(note.createdAt)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function defaultVisitTime() {
  const date = new Date();
  date.setHours(date.getHours() + 3, 0, 0, 0);
  return date.toISOString().slice(0, 16);
}
