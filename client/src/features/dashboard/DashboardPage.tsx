import { useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ElementType, ReactNode } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { AlertTriangle, ArrowUpRight, BrainCircuit, CalendarCheck, CheckCircle2, Clock3, Flame, Gauge, IndianRupee, PhoneCall, Plus, Radio, Sparkles, Target, UsersRound, WalletCards } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Funnel, FunnelChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useActionModalStore, ActionName } from "@/stores/actionModal";
import { ChartCard } from "@/components/charts/ChartCard";
import { Activity, Lead, Property, Role, Visit } from "@/types";

type Dashboard = {
  role: Role;
  kpis: Record<string, number>;
  funnel: { stage: string; value: number }[];
  revenueTrend: { month: string; revenue: number }[];
  propertyPerformance: { property: Property; pressure: Property["pressure"] }[];
  hotPipeline: { lead: Lead; ai: NonNullable<Lead["intelligence"]> }[];
  toursToday: Visit[];
  overdueFollowups: { _id: string; title: string; lead: Lead; dueAt: string; priority: string }[];
  aiInsights: { lead: Lead; urgencyScore: number; insight: string; nextBestAction: string }[];
  operationsFeed: Activity[];
  revivalQueue: { lead: Lead; ai: NonNullable<Lead["intelligence"]>; revivalScore: number; expectedRecoveryValue: number; suggestedFollowUp: string }[];
  inventoryPressure: { property: Property; pressure: Property["pressure"] }[];
  bookingRiskAlerts: { severity: string; title: string; detail: string; value: number }[];
  demandHeatmap: { zone: string; pressure: number; growth: number; properties: number }[];
  quickActions: string[];
  roleFocus: { title: string; subtitle: string; primaryWidget: string; insightTitle: string };
};

const roleKpis: Record<Role, [string, string, ElementType, "currency" | "percent" | "number"][]> = {
  Admin: [
    ["totalRevenue", "Total Revenue", IndianRupee, "currency"],
    ["monthlyRevenueGrowth", "Revenue Growth", ArrowUpRight, "percent"],
    ["occupancyRate", "Occupancy Rate", Gauge, "percent"],
    ["conversionRate", "Conversion Rate", Target, "percent"],
    ["activeReservations", "Active Reservations", WalletCards, "number"],
    ["highRiskProperties", "High-Risk Properties", AlertTriangle, "number"],
    ["revenuePipeline", "Revenue Pipeline", IndianRupee, "currency"],
    ["leadToBookingRatio", "Lead-to-Booking", CheckCircle2, "percent"]
  ],
  "Sales Ops": [
    ["overdueFollowups", "Overdue Follow-ups", PhoneCall, "number"],
    ["toursPending", "Tours Pending", CalendarCheck, "number"],
    ["unassignedLeads", "Unassigned Leads", UsersRound, "number"],
    ["reservationsAwaitingConfirmation", "Reservations Awaiting", WalletCards, "number"],
    ["operationsSla", "Operations SLA", Gauge, "percent"],
    ["followupCompletionRate", "Follow-up Completion", CheckCircle2, "percent"],
    ["queueBacklog", "Queue Backlog", AlertTriangle, "number"],
    ["leadEscalations", "Lead Escalations", Flame, "number"]
  ],
  "Sales Agent": [
    ["myLeads", "My Leads", UsersRound, "number"],
    ["toursScheduled", "Tours Today", CalendarCheck, "number"],
    ["followupsDue", "Follow-ups Due", PhoneCall, "number"],
    ["myConversionRate", "My Conversion", Target, "percent"],
    ["activeNegotiations", "Negotiations", Flame, "number"],
    ["reservationsClosed", "Reservations Closed", WalletCards, "number"],
    ["tasksPending", "Tasks Pending", Clock3, "number"],
    ["personalRevenueClosed", "My Revenue", IndianRupee, "currency"]
  ]
};

export function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: () => api<Dashboard>("/dashboard") });
  if (isLoading || !data) return <DashboardSkeleton />;
  const role = data.role;

  return (
    <div className="space-y-7 pb-20 lg:pb-0">
      <Hero data={data} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {roleKpis[role].map(([key, label, Icon, format], index) => (
          <KpiCard key={key} index={index} label={label} value={data.kpis[key] ?? 0} icon={Icon} format={format} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        {role === "Admin" && <AdminIntelligence data={data} />}
        {role === "Sales Ops" && <OpsIntelligence data={data} />}
        {role === "Sales Agent" && <AgentIntelligence data={data} />}
        <LiveFeed feed={data.operationsFeed} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <RevivalQueue items={data.revivalQueue} />
        <PressureIndex items={data.inventoryPressure} />
        <AiInsights title={data.roleFocus.insightTitle} items={data.aiInsights} />
      </div>
    </div>
  );
}

function Hero({ data }: { data: Dashboard }) {
  const openAction = useActionModalStore((state) => state.openAction);
  const toast = useToast();
  const priorityLead = data.hotPipeline[0]?.lead ?? data.aiInsights[0]?.lead;

  function runQuickAction(action: string) {
    openAction(action as ActionName, priorityLead ? { leadId: priorityLead._id } : undefined);
    toast.show({ title: action, body: "Workflow opened." });
  }

  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="hero-glass relative overflow-hidden rounded-lg border p-5 backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-orange-300/50 to-transparent" />
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background/58 px-3 py-1 text-sm text-muted-foreground shadow-sm backdrop-blur">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" /><span className="live-dot relative inline-flex h-2 w-2 rounded-full bg-primary" /></span>
            Live role-aware command center
          </div>
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{data.roleFocus.title}</h1>
          <p className="mt-3 max-w-3xl leading-6 text-muted-foreground">{data.roleFocus.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.quickActions.map((action, index) => (
            <Button key={action} variant={index === 0 ? "primary" : "secondary"} size="sm" onClick={() => runQuickAction(action)}>
              {index === 0 ? <Plus className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
              {action}
            </Button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function KpiCard({ label, value, icon: Icon, format, index }: { label: string; value: number; icon: ElementType; format: "currency" | "percent" | "number"; index: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.035 }}>
      <Card className="group relative overflow-hidden transition duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-orange-glow">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition group-hover:opacity-100" />
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <div className="grid h-8 w-8 place-items-center rounded-md border border-primary/10 bg-accent text-accent-foreground shadow-sm transition group-hover:scale-105 group-hover:shadow-orange-glow"><Icon className="h-4 w-4" /></div>
          </div>
          <p className="mt-4 text-2xl font-bold"><AnimatedValue value={value} format={format} /></p>
          <Progress value={format === "currency" ? Math.min(100, value / 10000) : value} className="mt-4" />
        </CardContent>
      </Card>
    </motion.div>
  );
}

function AnimatedValue({ value, format }: { value: number; format: "currency" | "percent" | "number" }) {
  const spring = useSpring(value, { stiffness: 90, damping: 18 });
  const display = useTransform(spring, (latest) => {
    const rounded = Math.round(latest);
    if (format === "currency") return formatCurrency(rounded);
    if (format === "percent") return `${rounded}%`;
    return String(rounded);
  });
  return <motion.span>{display}</motion.span>;
}

function AdminIntelligence({ data }: { data: Dashboard }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ChartCard title="Revenue Forecast Engine" eyebrow="Founder view">
        <ChartArea data={data.revenueTrend} />
      </ChartCard>
      <Panel title="Demand Heatmap" icon={Gauge}>
        {data.demandHeatmap.slice(0, 6).map((zone) => <HeatRow key={zone.zone} label={zone.zone} value={zone.pressure} meta={`+${zone.growth}% this week`} />)}
      </Panel>
      <ChartCard title="Conversion Funnel" eyebrow="Lead-to-booking">
        <div className="h-64"><ResponsiveContainer><FunnelChart><Tooltip /><Funnel dataKey="value" data={data.funnel} nameKey="stage">{data.funnel.map((_, i) => <Cell key={i} fill={["#f97316", "#fb923c", "#fdba74", "#fed7aa", "#94a3b8", "#64748b", "#22c55e"][i]} />)}</Funnel></FunnelChart></ResponsiveContainer></div>
      </ChartCard>
      <Panel title="Booking Risk Alerts" icon={AlertTriangle}>
        {data.bookingRiskAlerts.slice(0, 5).map((alert) => <AlertRow key={alert.title + alert.detail} alert={alert} />)}
      </Panel>
    </div>
  );
}

function OpsIntelligence({ data }: { data: Dashboard }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const completeTask = useMutation({
    mutationFn: (id: string) => api(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify({ status: "Done" }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-feed"] });
      toast.show({ title: "Queue item completed", body: "Follow-up queue and SLA metrics refreshed." });
    }
  });
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel title="Smart Follow-up Engine" icon={PhoneCall}>
        {data.overdueFollowups.slice(0, 6).map((task) => <QueueRow key={task._id} title={task.title} detail={`${task.lead?.name ?? "Lead"} - ${formatDate(task.dueAt)}`} severity={task.priority} onDone={() => completeTask.mutate(task._id)} />)}
      </Panel>
      <Panel title="Workflow Bottlenecks" icon={AlertTriangle}>
        {data.bookingRiskAlerts.slice(0, 6).map((alert) => <AlertRow key={alert.title + alert.detail} alert={alert} />)}
      </Panel>
      <Panel title="Tours Today" icon={CalendarCheck}>
        {data.toursToday.slice(0, 6).map((visit) => <QueueRow key={visit._id} title={visit.lead.name} detail={`${visit.property.name} - ${visit.status}`} severity="medium" />)}
      </Panel>
      <Panel title="Queue Health Monitor" icon={Gauge}>
        {["Response delays", "Agent workload", "Missed actions", "Deposit confirmations"].map((label, i) => <HeatRow key={label} label={label} value={86 - i * 11} meta={i === 0 ? "needs attention" : "stable"} />)}
      </Panel>
    </div>
  );
}

function AgentIntelligence({ data }: { data: Dashboard }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel title="Lead Priority Engine" icon={Flame}>
        {data.hotPipeline.slice(0, 6).map(({ lead, ai }) => <LeadRow key={lead._id} lead={lead} meta={`${ai.urgencyScore} hot`} />)}
      </Panel>
      <Panel title="Next Best Actions" icon={BrainCircuit}>
        {data.aiInsights.slice(0, 5).map((insight) => <QueueRow key={insight.lead._id} title={insight.lead.name} detail={insight.nextBestAction} severity={insight.urgencyScore > 75 ? "urgent" : "medium"} />)}
      </Panel>
      <Panel title="Upcoming Tours" icon={CalendarCheck}>
        {data.toursToday.slice(0, 5).map((visit) => <QueueRow key={visit._id} title={visit.property.name} detail={`${visit.lead.name} - ${formatDate(visit.scheduledAt)}`} severity="medium" />)}
      </Panel>
      <ChartCard title="Personal Performance Tracker" eyebrow="Weekly targets">
        <ChartLine data={data.revenueTrend.map((item, i) => ({ month: item.month, bookings: i + 2, revenue: item.revenue / 10000 }))} />
      </ChartCard>
    </div>
  );
}

function RevivalQueue({ items }: { items: Dashboard["revivalQueue"] }) {
  return (
    <Panel title="Revenue Revival Queue" icon={Sparkles}>
      {items.slice(0, 5).map((item) => (
        <div key={item.lead._id} className="surface-section rounded-md border p-3 transition duration-300 hover:-translate-y-0.5 hover:bg-accent/25">
          <div className="flex items-center justify-between gap-3"><p className="truncate text-sm font-semibold">{item.lead.name}</p><Badge>{item.revivalScore} revive</Badge></div>
          <p className="mt-2 text-xs text-muted-foreground">{item.suggestedFollowUp}</p>
          <p className="mt-2 text-sm font-semibold text-primary">{formatCurrency(item.expectedRecoveryValue)} recovery value</p>
        </div>
      ))}
      {!items.length && <EmptyState text="No recoverable revenue leaks right now." />}
    </Panel>
  );
}

function PressureIndex({ items }: { items: Dashboard["inventoryPressure"] }) {
  return (
    <Panel title="Property Pressure Index" icon={Gauge}>
      {items.slice(0, 5).map(({ property, pressure }) => <HeatRow key={property._id} label={property.name} value={pressure.score} meta={pressure.category} />)}
    </Panel>
  );
}

function AiInsights({ title, items }: { title: string; items: Dashboard["aiInsights"] }) {
  return (
    <Panel title={title} icon={BrainCircuit}>
      {items.slice(0, 5).map((insight) => (
        <div key={insight.lead._id} className="surface-section rounded-md border p-3 transition duration-300 hover:-translate-y-0.5">
          <div className="flex items-center justify-between"><p className="text-sm font-semibold">{insight.lead.name}</p><Badge>{insight.urgencyScore}</Badge></div>
          <p className="mt-2 text-sm text-muted-foreground">{insight.insight}</p>
        </div>
      ))}
    </Panel>
  );
}

function LiveFeed({ feed }: { feed: Activity[] }) {
  return (
    <Panel title="Live Operations Feed" icon={Radio}>
      {feed.slice(0, 9).map((activity, index) => (
        <motion.div key={activity._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.035 }} className="flex gap-3 rounded-md border border-transparent p-2 transition duration-300 hover:border-primary/10 hover:bg-muted/60">
          <div className="relative"><Avatar name={activity.actor?.name ?? "AI"} src={activity.actor?.avatar} className="h-9 w-9" />{index < 3 && <span className="live-dot absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-card" />}</div>
          <div className="min-w-0 flex-1"><p className="text-sm font-medium">{activity.title}</p><p className="truncate text-xs text-muted-foreground">{activity.description ?? activity.lead?.name}</p></div>
          <span className="text-xs text-muted-foreground">{formatDate(activity.createdAt)}</span>
        </motion.div>
      ))}
    </Panel>
  );
}

function ChartArea({ data }: { data: { month: string; revenue: number }[] }) {
  return <div className="h-64"><ResponsiveContainer><AreaChart data={data}><defs><linearGradient id="rev" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#f97316" stopOpacity={0.62} /><stop offset="55%" stopColor="#f97316" stopOpacity={0.14} /><stop offset="100%" stopColor="#f97316" stopOpacity={0.02} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / .72)" /><XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" /><YAxis hide /><Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(value) => formatCurrency(Number(value))} /><Area type="monotone" dataKey="revenue" stroke="#fb923c" fill="url(#rev)" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: "#fb923c" }} /></AreaChart></ResponsiveContainer></div>;
}

function ChartLine({ data }: { data: { month: string; bookings: number; revenue: number }[] }) {
  return <div className="h-64"><ResponsiveContainer><LineChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / .72)" /><XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" /><YAxis hide /><Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} /><Line type="monotone" dataKey="bookings" stroke="#fb923c" strokeWidth={2.5} dot={false} /><Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2.5} dot={false} /></LineChart></ResponsiveContainer></div>;
}

function Panel({ title, icon: Icon, children }: { title: string; icon: ElementType; children: ReactNode }) {
  return <Card className="overflow-hidden"><CardHeader><div className="flex items-center gap-2"><div className="grid h-7 w-7 place-items-center rounded-md bg-accent text-accent-foreground"><Icon className="h-4 w-4" /></div><h3 className="font-semibold tracking-tight">{title}</h3></div></CardHeader><CardContent className="space-y-3">{children}</CardContent></Card>;
}

function LeadRow({ lead, meta }: { lead: Lead; meta: string }) {
  return <div className="flex items-center gap-3 rounded-md border bg-background/70 p-3 transition hover:bg-accent/25"><Avatar name={lead.name} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{lead.name}</p><p className="truncate text-xs text-muted-foreground">{lead.preferredLocation} · {lead.stage}</p></div><Badge className="shrink-0">{meta}</Badge></div>;
}

function QueueRow({ title, detail, severity, onDone }: { title: string; detail: string; severity: string; onDone?: () => void }) {
  return <div className="surface-section rounded-md border p-3 transition duration-300 hover:-translate-y-0.5"><div className="flex items-center justify-between gap-3"><p className="truncate text-sm font-semibold">{title}</p><Severity severity={severity} /></div><p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{detail}</p>{onDone && <Button size="sm" variant="ghost" className="mt-2" onClick={onDone}>Mark done</Button>}</div>;
}

function AlertRow({ alert }: { alert: Dashboard["bookingRiskAlerts"][number] }) {
  return <div className="surface-section rounded-md border p-3 transition duration-300 hover:-translate-y-0.5"><div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold">{alert.title}</p><Severity severity={alert.severity} /></div><p className="mt-2 text-xs leading-5 text-muted-foreground">{alert.detail}</p>{alert.value > 0 && <p className="mt-2 text-sm font-semibold text-primary">{formatCurrency(alert.value)} at risk</p>}</div>;
}

function HeatRow({ label, value, meta }: { label: string; value: number; meta: string }) {
  return <div className="surface-section space-y-2 rounded-md border p-3 transition duration-300 hover:-translate-y-0.5"><div className="flex items-center justify-between gap-3"><p className="truncate text-sm font-semibold">{label}</p><Badge>{meta}</Badge></div><Progress value={value} /></div>;
}

function Severity({ severity }: { severity: string }) {
  const tone = severity.toLowerCase().includes("urgent") || severity === "high" ? "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300" : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  return <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${tone}`}>{severity}</span>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="grid place-items-center rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">{text}</div>;
}

function DashboardSkeleton() {
  return <div className="space-y-6"><Skeleton className="h-36 w-full" /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div><div className="grid gap-6 xl:grid-cols-2"><Skeleton className="h-96" /><Skeleton className="h-96" /></div></div>;
}
