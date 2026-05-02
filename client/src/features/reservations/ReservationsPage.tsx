import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ElementType } from "react";
import { CreditCard, IndianRupee, KeyRound, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Reservation } from "@/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useActionModalStore } from "@/stores/actionModal";
import { useToast } from "@/components/ui/toast";

export function ReservationsPage() {
  const { data: reservations = [] } = useQuery({ queryKey: ["reservations"], queryFn: () => api<Reservation[]>("/reservations") });
  const openAction = useActionModalStore((state) => state.openAction);
  const queryClient = useQueryClient();
  const toast = useToast();
  const updateReservation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Reservation> }) => api<Reservation>(`/reservations/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-feed"] });
      toast.show({ title: "Reservation updated", body: "Revenue and operations feed refreshed." });
    }
  });
  const revenue = reservations.reduce((sum, item) => sum + item.depositPaid + item.monthlyRent, 0);
  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><Badge className="mb-3 bg-accent text-accent-foreground">Booking lifecycle</Badge><h1 className="text-3xl font-bold tracking-tight">Reservations</h1></div>
        <Button onClick={() => openAction("Create Reservation")}><Plus className="h-4 w-4" /> Create reservation</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Summary label="Tracked reservations" value={reservations.length} icon={KeyRound} />
        <Summary label="Deposit collected" value={formatCurrency(reservations.reduce((s, r) => s + r.depositPaid, 0))} icon={CreditCard} />
        <Summary label="Revenue impact" value={formatCurrency(revenue)} icon={IndianRupee} />
      </div>
      <Card>
        <CardHeader><h2 className="font-semibold">Reservation Lifecycle</h2></CardHeader>
        <CardContent className="space-y-3">
          {reservations.map((reservation) => (
            <div key={reservation._id} className="grid gap-3 rounded-lg border bg-background/70 p-4 md:grid-cols-[1fr_.8fr_.8fr_.6fr] md:items-center">
              <div><p className="font-semibold">{reservation.lead.name}</p><p className="text-sm text-muted-foreground">{reservation.property.name}</p></div>
              <div><Badge>{reservation.status}</Badge><p className="mt-1 text-xs text-muted-foreground">Move-in {formatDate(reservation.moveInDate)}</p></div>
              <div className="space-y-2"><div className="flex justify-between text-sm"><span>Deposit</span><span>{formatCurrency(reservation.depositPaid)}</span></div><Progress value={(reservation.depositPaid / reservation.depositAmount) * 100} /></div>
              <div className="space-y-2">
                <p className="font-semibold">{formatCurrency(reservation.monthlyRent)}</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => updateReservation.mutate({ id: reservation._id, body: { status: nextReservationStatus(reservation.status) } })}>Advance</Button>
                  <Button size="sm" variant="ghost" onClick={() => updateReservation.mutate({ id: reservation._id, body: { paymentStatus: "Paid", depositPaid: reservation.depositAmount } })}>Mark paid</Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function nextReservationStatus(status: Reservation["status"]): Reservation["status"] {
  const flow: Reservation["status"][] = ["Reserved", "Deposit Pending", "Confirmed", "Checked In", "Completed"];
  return flow[Math.min(flow.indexOf(status) + 1, flow.length - 1)] ?? "Confirmed";
}

function Summary({ label, value, icon: Icon }: { label: string; value: string | number; icon: ElementType }) {
  return <Card><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div><Icon className="h-5 w-5 text-primary" /></CardContent></Card>;
}
