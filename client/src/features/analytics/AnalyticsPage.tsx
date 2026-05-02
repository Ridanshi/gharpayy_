import { useQuery } from "@tanstack/react-query";
import type { ElementType } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3, FileDown, TrendingUp, UsersRound } from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartCard } from "@/components/charts/ChartCard";
import { Button } from "@/components/ui/button";
import { useActionModalStore } from "@/stores/actionModal";

type Analytics = {
  sources: { source: string; leads: number; conversion: number }[];
  agents: { name: string; won: number; tours: number; revenue: number }[];
  bookings: { month: string; bookings: number; occupancy: number }[];
};

export function AnalyticsPage() {
  const { data } = useQuery({ queryKey: ["analytics"], queryFn: () => api<Analytics>("/analytics") });
  const sources = data?.sources ?? [];
  const openAction = useActionModalStore((state) => state.openAction);
  const agents = data?.agents ?? [];
  const bookings = data?.bookings ?? [];
  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><Badge className="mb-3 bg-accent text-accent-foreground">Advanced analytics</Badge><h1 className="text-3xl font-bold tracking-tight">Analytics</h1><p className="mt-2 text-muted-foreground">Revenue, lead source, agent performance, occupancy, and booking trend intelligence.</p></div>
        <Button onClick={() => openAction("Export Analytics")}><FileDown className="h-4 w-4" /> Export analytics</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Metric icon={UsersRound} label="Source conversion" value="41%" />
        <Metric icon={TrendingUp} label="Booking growth" value="+18%" />
        <Metric icon={BarChart3} label="Avg occupancy" value="78%" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Lead Source Analytics" eyebrow="Acquisition">
          <div className="h-80">
            <ResponsiveContainer>
              <BarChart data={sources}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="source" stroke="hsl(var(--muted-foreground))" />
                <YAxis hide />
                <Tooltip />
                <Legend />
                <Bar dataKey="leads" fill="#f97316" radius={[6, 6, 0, 0]} />
                <Bar dataKey="conversion" fill="#64748b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Booking and Occupancy Trends" eyebrow="Operations">
          <div className="h-80">
            <ResponsiveContainer>
              <LineChart data={bookings}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis hide />
                <Tooltip />
                <Legend />
                <Line dataKey="bookings" stroke="#f97316" strokeWidth={2} />
                <Line dataKey="occupancy" stroke="#22c55e" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
      <ChartCard title="Agent Performance" eyebrow="Revenue operations">
        <div className="grid gap-3 md:grid-cols-3">
          {agents.map((agent) => (
            <Card key={agent.name} className="bg-background/70">
              <CardContent className="p-4">
                <p className="font-semibold">{agent.name}</p>
                <p className="mt-2 text-3xl font-bold text-primary">{agent.won}</p>
                <p className="text-sm text-muted-foreground">Closed wins from {agent.tours} tours</p>
                <p className="mt-3 font-semibold">{formatCurrency(agent.revenue)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: ElementType; label: string; value: string }) {
  return <Card><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div><Icon className="h-5 w-5 text-primary" /></CardContent></Card>;
}
