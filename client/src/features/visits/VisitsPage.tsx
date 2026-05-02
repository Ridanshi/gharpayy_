import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck, CheckCircle2, ChevronLeft, ChevronRight, Clock, MapPin, RotateCcw, UserCheck, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";
import { Visit } from "@/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

type CalendarMode = "month" | "week";

const statusStyles: Record<Visit["status"], string> = {
  Scheduled: "border-sky-500/30 bg-sky-500/12 text-sky-200",
  "Checked In": "border-amber-500/30 bg-amber-500/12 text-amber-200",
  Completed: "border-emerald-500/30 bg-emerald-500/12 text-emerald-200",
  "No Show": "border-rose-500/30 bg-rose-500/12 text-rose-200",
  Cancelled: "border-muted bg-muted/30 text-muted-foreground"
};

export function VisitsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const today = startOfDay(new Date());
  const [mode, setMode] = useState<CalendarMode>("month");
  const [cursor, setCursor] = useState(today);
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [rescheduleAt, setRescheduleAt] = useState("");
  const { data: visits = [], isLoading } = useQuery({ queryKey: ["visits"], queryFn: () => api<Visit[]>("/visits") });

  const visitsByDay = useMemo(() => {
    return visits.reduce<Record<string, Visit[]>>((groups, visit) => {
      const key = dayKey(new Date(visit.scheduledAt));
      groups[key] = [...(groups[key] ?? []), visit];
      return groups;
    }, {});
  }, [visits]);

  const calendarDays = useMemo(() => (mode === "month" ? monthDays(cursor) : weekDays(cursor)), [cursor, mode]);
  const selectedTours = visitsByDay[dayKey(selectedDate)] ?? [];
  const upcoming = visits.filter((visit) => new Date(visit.scheduledAt) >= today && visit.status !== "Completed" && visit.status !== "Cancelled").slice(0, 8);
  const metrics = useMemo(() => tourMetrics(visits), [visits]);

  const updateVisit = useMutation({
    mutationFn: ({ id, status, scheduledAt }: { id: string; status?: Visit["status"]; scheduledAt?: string }) =>
      api<Visit>(`/visits/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...(status ? { status } : {}),
          ...(scheduledAt ? { scheduledAt: new Date(scheduledAt).toISOString() } : {}),
          feedback: status ? `Tour marked ${status} from visit calendar.` : "Tour rescheduled from visit calendar."
        })
      }),
    onSuccess: (visit) => {
      queryClient.invalidateQueries({ queryKey: ["visits"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-feed"] });
      toast.show({ title: "Visit updated", body: `${visit.lead.name}'s tour is now ${visit.status}.` });
      setSelectedVisit(null);
      setRescheduleAt("");
    },
    onError: (error) => toast.show({ title: "Visit update failed", body: error instanceof Error ? error.message : "Please try again." })
  });

  const shift = (direction: -1 | 1) => setCursor(addDays(cursor, direction * (mode === "month" ? 30 : 7)));
  const jumpToday = () => {
    setCursor(today);
    setSelectedDate(today);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Badge className="mb-3 bg-accent text-accent-foreground">Tour operations</Badge>
          <h1 className="text-3xl font-bold tracking-tight">Visit Management</h1>
          <p className="mt-2 text-sm text-muted-foreground">Operational calendar for scheduled, checked-in, completed, and no-show tours.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant={mode === "month" ? "primary" : "secondary"} onClick={() => setMode("month")}>Month</Button>
          <Button variant={mode === "week" ? "primary" : "secondary"} onClick={() => setMode("week")}>Week</Button>
          <Button variant="secondary" onClick={jumpToday}>Today</Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
        <Card>
          <CardHeader className="items-center">
            <div>
              <h2 className="font-semibold">{monthLabel(cursor)}</h2>
              <p className="text-sm text-muted-foreground">{mode === "month" ? "Monthly scheduling view" : "Focused weekly tour plan"}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="icon" onClick={() => shift(-1)}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="secondary" size="icon" onClick={() => shift(1)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-2 grid grid-cols-7 gap-2 text-center text-xs font-medium text-muted-foreground">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day}>{day}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((date) => {
                const key = dayKey(date);
                const dayTours = visitsByDay[key] ?? [];
                const isSelected = key === dayKey(selectedDate);
                const isToday = key === dayKey(today);
                const isMuted = mode === "month" && date.getMonth() !== cursor.getMonth();
                return (
                  <div
                    key={key}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedDate(date)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") setSelectedDate(date);
                    }}
                    className={cn(
                      "min-h-24 cursor-pointer rounded-lg border bg-background/55 p-2 text-left transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-muted/35 hover:shadow-dark-soft",
                      isSelected && "border-primary/70 bg-primary/10 shadow-dark-soft",
                      isToday && "ring-1 ring-primary/60",
                      isMuted && "opacity-45"
                    )}
                    title={`${dayTours.length} tour${dayTours.length === 1 ? "" : "s"} scheduled`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={cn("text-sm font-semibold", isToday && "text-primary")}>{date.getDate()}</span>
                      {dayTours.length > 0 && <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] text-primary">{dayTours.length}</span>}
                    </div>
                    <div className="mt-2 space-y-1">
                      {dayTours.slice(0, 3).map((visit) => (
                        <span
                          key={visit._id}
                          role="button"
                          tabIndex={0}
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedVisit(visit);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") setSelectedVisit(visit);
                          }}
                          className={cn("block truncate rounded border px-1.5 py-1 text-[10px] transition hover:brightness-125", statusStyles[visit.status])}
                          title={`${eventLabel(visit)} at ${timeLabel(visit.scheduledAt)} with ${visit.agent?.name ?? "unassigned agent"}`}
                        >
                          {eventLabel(visit)}
                        </span>
                      ))}
                      {dayTours.length > 3 && <span className="text-[10px] text-muted-foreground">+{dayTours.length - 3} more</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2"><CalendarCheck className="h-4 w-4 text-primary" /><h2 className="font-semibold">{selectedDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", weekday: "long" })}</h2></div>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading && Array.from({ length: 3 }, (_, index) => <div key={index} className="h-24 animate-pulse rounded-lg bg-muted/40" />)}
              {!isLoading && selectedTours.length === 0 && <TourMetrics metrics={metrics} />}
              {selectedTours.map((visit) => <VisitRow key={visit._id} visit={visit} onOpen={() => setSelectedVisit(visit)} onUpdate={(status) => updateVisit.mutate({ id: visit._id, status })} pending={updateVisit.isPending} />)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><h2 className="font-semibold">Upcoming Tours</h2></CardHeader>
            <CardContent className="space-y-3">
              {upcoming.length === 0 ? <EmptyState title="Tour queue clear." body="No active upcoming visits need attention." /> : upcoming.map((visit) => <VisitRow key={visit._id} visit={visit} compact onOpen={() => setSelectedVisit(visit)} onUpdate={(status) => updateVisit.mutate({ id: visit._id, status })} pending={updateVisit.isPending} />)}
            </CardContent>
          </Card>
        </div>
      </div>

      {selectedVisit && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/75 p-4 backdrop-blur-sm" onClick={() => setSelectedVisit(null)}>
          <div className="w-full max-w-lg rounded-lg border bg-card p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3">
                <Avatar name={selectedVisit.lead.name} />
                <div>
                  <h3 className="text-lg font-bold">{selectedVisit.lead.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedVisit.property.name} • {formatDate(selectedVisit.scheduledAt)}</p>
                </div>
              </div>
              <Badge className={statusStyles[selectedVisit.status]}>{selectedVisit.status}</Badge>
            </div>
            <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <Info label="Lead phone" value={selectedVisit.lead.phone} />
              <Info label="Assigned agent" value={selectedVisit.agent?.name ?? "Unassigned"} />
              <Info label="Property area" value={selectedVisit.property.locality} />
              <Info label="Tour time" value={formatDate(selectedVisit.scheduledAt)} />
            </div>
            <div className="mt-5 space-y-2">
              <label className="text-sm font-medium">Reschedule tour</label>
              <div className="flex gap-2">
                <Input type="datetime-local" value={rescheduleAt} onChange={(event) => setRescheduleAt(event.target.value)} />
                <Button variant="secondary" disabled={!rescheduleAt || updateVisit.isPending} onClick={() => updateVisit.mutate({ id: selectedVisit._id, scheduledAt: rescheduleAt })}>
                  <RotateCcw className="h-4 w-4" />Reschedule
                </Button>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <Button variant="secondary" disabled={updateVisit.isPending} onClick={() => updateVisit.mutate({ id: selectedVisit._id, status: "Checked In" })}><UserCheck className="h-4 w-4" />Check-in</Button>
              <Button variant="secondary" disabled={updateVisit.isPending} onClick={() => updateVisit.mutate({ id: selectedVisit._id, status: "No Show" })}><XCircle className="h-4 w-4" />No-show</Button>
              <Button disabled={updateVisit.isPending} onClick={() => updateVisit.mutate({ id: selectedVisit._id, status: "Completed" })}><CheckCircle2 className="h-4 w-4" />Complete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VisitRow({ visit, compact, pending, onOpen, onUpdate }: { visit: Visit; compact?: boolean; pending: boolean; onOpen: () => void; onUpdate: (status: Visit["status"]) => void }) {
  return (
    <div className="grid gap-3 rounded-lg border bg-background/70 p-4 transition hover:-translate-y-0.5 hover:border-primary/25 hover:bg-muted/40 md:grid-cols-[1fr_auto]">
      <button type="button" onClick={onOpen} className="flex gap-3 text-left">
        <Avatar name={visit.lead.name} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{visit.lead.name}</p>
            <span className="text-xs text-muted-foreground">{eventKind(visit)}</span>
          </div>
          <p className="mt-1 flex items-center gap-1 truncate text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5 shrink-0" />{visit.property.name}</p>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><Clock className="h-3.5 w-3.5" />{formatDate(visit.scheduledAt)}{visit.agent?.name ? ` • ${visit.agent.name}` : ""}</p>
        </div>
      </button>
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={statusStyles[visit.status]}>{visit.status}</Badge>
        {!compact && <Button size="sm" variant="secondary" className="min-w-24" disabled={pending} onClick={() => onUpdate("Checked In")}><UserCheck className="h-4 w-4" />Check-in</Button>}
        <Button size="sm" variant="secondary" className="min-w-24" disabled={pending} onClick={() => onUpdate("No Show")}><XCircle className="h-4 w-4" />No-show</Button>
        <Button size="sm" className="min-w-24" disabled={pending} onClick={() => onUpdate("Completed")}><CheckCircle2 className="h-4 w-4" />Complete</Button>
      </div>
    </div>
  );
}

function TourMetrics({ metrics }: { metrics: ReturnType<typeof tourMetrics> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Metric label="Tours today" value={metrics.today} />
      <Metric label="Completion rate" value={`${metrics.completionRate}%`} />
      <Metric label="No-show rate" value={`${metrics.noShowRate}%`} />
      <Metric label="Pending follow-ups" value={metrics.pending} />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-lg border bg-background/55 p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>;
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return <div className="rounded-lg border border-dashed bg-background/45 p-5 text-sm"><p className="font-semibold text-foreground">{title}</p><p className="mt-1 text-muted-foreground">{body}</p></div>;
}

function Info({ label, value }: { label: string; value?: string }) {
  return <div className="rounded-md border bg-background/55 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-medium">{value || "Not set"}</p></div>;
}

function monthDays(date: Date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const start = addDays(first, -first.getDay());
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

function weekDays(date: Date) {
  const start = addDays(startOfDay(date), -date.getDay());
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return startOfDay(next);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function timeLabel(value: string) {
  return new Date(value).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function eventKind(visit: Visit) {
  if (visit.status === "Checked In") return "Site Visit";
  if (visit.status === "Completed") return "Completed Tour";
  if (visit.status === "No Show") return "No-show";
  return visit.lead.stage === "Tour Scheduled" ? "Tour" : "Follow-up";
}

function eventLabel(visit: Visit) {
  return `${eventKind(visit)} • ${visit.lead.name.split(" ")[0]}`;
}

function tourMetrics(visits: Visit[]) {
  const todayKey = dayKey(new Date());
  const todayVisits = visits.filter((visit) => dayKey(new Date(visit.scheduledAt)) === todayKey);
  const completed = visits.filter((visit) => visit.status === "Completed").length;
  const noShows = visits.filter((visit) => visit.status === "No Show").length;
  const active = visits.filter((visit) => visit.status !== "Cancelled").length || 1;
  return {
    today: todayVisits.length,
    completionRate: Math.round((completed / active) * 100),
    noShowRate: Math.round((noShows / active) * 100),
    pending: visits.filter((visit) => ["Scheduled", "Checked In"].includes(visit.status)).length
  };
}
