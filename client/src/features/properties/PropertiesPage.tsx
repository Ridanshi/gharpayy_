import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Plus, Zap } from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Property } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useActionModalStore } from "@/stores/actionModal";

export function PropertiesPage() {
  const { data: properties = [] } = useQuery({ queryKey: ["properties"], queryFn: () => api<Property[]>("/properties") });
  const openAction = useActionModalStore((state) => state.openAction);
  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><Badge className="mb-3 bg-accent text-accent-foreground">Property Pressure Index</Badge><h1 className="text-3xl font-bold tracking-tight">PG Inventory</h1><p className="mt-2 text-muted-foreground">Data-driven inventory with occupancy, booking velocity, pressure status, and live availability.</p></div>
        <Button onClick={() => openAction("Add Property")}><Plus className="h-4 w-4" /> Add property</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {properties.map((property) => <PropertyCard key={property._id} property={property} />)}
      </div>
    </div>
  );
}

function PropertyCard({ property }: { property: Property }) {
  const vacancies = property.rooms.reduce((sum, room) => sum + Math.max(0, room.bedCount - room.occupiedBeds), 0);
  const status = propertyStatus(property, vacancies);
  const image = property.images?.[0] || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80";
  return (
    <Link to={`/properties/${property._id}`}>
      <Card className="group overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-orange-glow">
        <div className="relative h-48 overflow-hidden">
          <img src={image} alt={property.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate font-semibold text-white">{property.name}</h2>
              <p className="mt-1 flex items-center gap-1 text-sm text-white/75"><MapPin className="h-3.5 w-3.5" />{property.locality}</p>
            </div>
            <Badge className={status.tone}>{status.label}</Badge>
          </div>
        </div>
        <div className="space-y-4 p-4">
          <div className="grid grid-cols-3 gap-2 text-sm">
            <Metric label="Occupancy" value={`${property.pressure.occupancy}%`} />
            <Metric label="Vacant" value={vacancies} />
            <Metric label="Rent" value={formatCurrency(property.averageRent)} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Pressure index</span><span className="font-semibold">{property.pressure.score}</span></div>
            <Progress value={property.pressure.score} />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <span className="rounded-md border bg-background/60 p-2"><Zap className="mr-1 inline h-3.5 w-3.5 text-primary" />Velocity {property.pressure.bookingVelocity}</span>
            <span className="rounded-md border bg-background/60 p-2">Demand {property.pressure.demandScore}</span>
          </div>
          <div className="flex flex-wrap gap-2">{property.amenities.slice(0, 4).map((amenity) => <Badge key={amenity}>{amenity}</Badge>)}</div>
        </div>
      </Card>
    </Link>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-md border bg-background/70 p-2"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 truncate font-semibold">{value}</p></div>;
}

function propertyStatus(property: Property, vacancies: number) {
  if (vacancies === 0 || property.status === "Full") return { label: "Fully Occupied", tone: "border-emerald-500/30 bg-emerald-500/15 text-emerald-200" };
  if (property.pressure.category === "High Demand") return { label: "High Demand", tone: "border-orange-500/30 bg-orange-500/15 text-orange-200" };
  if (property.pressure.category === "Fast Filling" || property.status === "Filling") return { label: "Filling Fast", tone: "border-amber-500/30 bg-amber-500/15 text-amber-200" };
  if (property.pressure.category === "Vacancy Risk") return { label: "Vacancy Risk", tone: "border-red-500/30 bg-red-500/15 text-red-200" };
  if (property.pressure.category === "Underperforming") return { label: "Underperforming", tone: "border-slate-500/30 bg-slate-500/15 text-slate-200" };
  return { label: "Balanced", tone: "border-blue-500/30 bg-blue-500/15 text-blue-200" };
}
