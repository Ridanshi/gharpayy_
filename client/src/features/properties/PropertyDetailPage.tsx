import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ElementType } from "react";
import { BedDouble, Building2, IndianRupee, Star, TrendingUp } from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Property } from "@/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useActionModalStore } from "@/stores/actionModal";

export function PropertyDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const toast = useToast();
  const openAction = useActionModalStore((state) => state.openAction);
  const { data: property, isLoading } = useQuery({ queryKey: ["property", id], queryFn: () => api<Property>(`/properties/${id}`), enabled: Boolean(id) });
  const updateProperty = useMutation({
    mutationFn: (body: Record<string, unknown>) => api<Property>(`/properties/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["property", id] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-feed"] });
      toast.show({ title: "Inventory updated", body: "Occupancy and pressure index recalculated." });
    }
  });
  if (isLoading || !property) return <Skeleton className="h-[70vh]" />;
  const vacancies = property.rooms.reduce((sum, room) => sum + Math.max(0, room.bedCount - room.occupiedBeds), 0);
  const image = property.images?.[0] || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80";

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="grid lg:grid-cols-[1.3fr_.7fr]">
          <img src={image} alt={property.name} className="h-72 w-full object-cover lg:h-96" />
          <div className="flex flex-col justify-between p-6">
            <div>
              <Badge className="mb-3 bg-accent text-accent-foreground">{property.pressure.category}</Badge>
              <h1 className="text-3xl font-bold tracking-tight">{property.name}</h1>
              <p className="mt-2 text-muted-foreground">{property.locality}, {property.city} - {property.propertyType ?? "PG"}</p>
              {property.description && <p className="mt-4 text-sm text-muted-foreground">{property.description}</p>}
            </div>
            <div>
              <div className="mt-6 space-y-3"><Progress value={property.pressure.score} /><p className="text-sm text-muted-foreground">Property Pressure Index: <span className="font-semibold text-foreground">{property.pressure.score}/100</span></p></div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => openAction("Create Reservation")}><IndianRupee className="h-4 w-4" /> Create Reservation</Button>
                <Button size="sm" variant="secondary" onClick={() => updateProperty.mutate({ markFull: true })}>Mark Full</Button>
                <Button size="sm" variant="secondary" onClick={() => updateProperty.mutate({ markFull: false })}>Reopen</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Stat icon={Building2} label="Occupancy" value={`${property.pressure.occupancy}%`} />
        <Stat icon={BedDouble} label="Vacancies" value={vacancies} />
        <Stat icon={IndianRupee} label="Avg rent" value={formatCurrency(property.averageRent)} />
        <Stat icon={Star} label="Status" value={property.status ?? "Active"} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[.9fr_1.1fr]">
        <Card>
          <CardHeader><h2 className="font-semibold">Pressure Components</h2></CardHeader>
          <CardContent className="space-y-4">
            {[
              ["Demand score", property.pressure.demandScore],
              ["Conversion score", property.pressure.conversionScore],
              ["Pricing pressure", property.pressure.pricingPressure],
              ["Inquiry volume", property.pressure.inquiryVolume],
              ["Booking velocity", property.pressure.bookingVelocity]
            ].map(([label, value]) => <div key={label} className="space-y-2"><div className="flex justify-between text-sm"><span>{label}</span><span className="font-semibold">{value}</span></div><Progress value={Number(value) * (label === "Booking velocity" ? 8 : 1)} /></div>)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><h2 className="font-semibold">Room Management</h2></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {property.rooms.map((room) => (
              <div key={room._id} className="rounded-md border bg-background/70 p-3">
                <div className="flex items-center justify-between"><p className="font-semibold">{room.label}</p><Badge>{room.status}</Badge></div>
                <p className="mt-2 text-sm text-muted-foreground">{room.occupancyType} - {room.occupiedBeds}/{room.bedCount} beds occupied</p>
                <p className="mt-2 font-semibold">{formatCurrency(room.rent)}</p>
                <Progress value={(room.occupiedBeds / room.bedCount) * 100} className="mt-3" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: ElementType; label: string; value: string | number }) {
  return <Card><CardContent className="flex items-center gap-3 p-4"><Icon className="h-5 w-5 text-primary" /><div><p className="text-sm text-muted-foreground">{label}</p><p className="text-xl font-bold">{value}</p></div></CardContent></Card>;
}
