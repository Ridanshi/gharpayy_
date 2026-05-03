import * as Dialog from "@radix-ui/react-dialog";
import type { ElementType, ReactNode } from "react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Building2, CalendarPlus, CirclePlus, LayoutDashboard, Search, UsersRound, WalletCards } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Lead, Property, Reservation } from "@/types";
import { useActionModalStore } from "@/stores/actionModal";

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const navigate = useNavigate();
  const openAction = useActionModalStore((state) => state.openAction);
  const [query, setQuery] = useState("");
  const { data: leads = [] } = useQuery({ queryKey: ["command-leads"], queryFn: () => api<Lead[]>("/leads"), enabled: open });
  const { data: properties = [] } = useQuery({ queryKey: ["command-properties"], queryFn: () => api<Property[]>("/properties"), enabled: open });
  const { data: reservations = [] } = useQuery({ queryKey: ["command-reservations"], queryFn: () => api<Reservation[]>("/reservations"), enabled: open });
  const actions = [
    { label: "Open Dashboard", icon: LayoutDashboard, run: () => navigate("/") },
    { label: "Create Lead", icon: CirclePlus, run: () => openAction("Add Lead") },
    { label: "Schedule Tour", icon: CalendarPlus, run: () => openAction("Schedule Tour") },
    { label: "Create Booking", icon: WalletCards, run: () => openAction("Create Reservation") }
  ];

  const normalized = query.toLowerCase();
  const filteredActions = actions.filter((item) => item.label.toLowerCase().includes(normalized));
  const filteredLeads = leads.filter((lead) => `${lead.name} ${lead.phone} ${lead.stage} ${lead.preferredLocation}`.toLowerCase().includes(normalized));
  const filteredProperties = properties.filter((property) => `${property.name} ${property.locality} ${property.pressure.category}`.toLowerCase().includes(normalized));
  const filteredReservations = reservations.filter((reservation) => `${reservation.lead?.name} ${reservation.property?.name} ${reservation.status}`.toLowerCase().includes(normalized));
  const firstRun = useMemo(() => filteredActions[0]?.run ?? (() => filteredLeads[0] && navigate(`/leads/${filteredLeads[0]._id}`)), [filteredActions, filteredLeads, navigate]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm" />
        <Dialog.Content asChild>
          <motion.div initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="fixed inset-x-3 top-4 z-50 flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-lg border bg-card shadow-2xl sm:left-1/2 sm:top-[12vh] sm:w-[calc(100vw-2rem)] sm:max-w-2xl sm:-translate-x-1/2">
            <div className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
              <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    firstRun();
                    onOpenChange(false);
                  }
                }}
                placeholder="Search anything in FlowOps AI"
                className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
              <Section title="Actions">
                {filteredActions.map((action) => <CommandItem key={action.label} icon={action.icon} label={action.label} onClick={() => { action.run(); onOpenChange(false); }} />)}
              </Section>
              <Section title="Leads">
                {filteredLeads.slice(0, 6).map((lead) => <CommandItem key={lead._id} icon={UsersRound} label={lead.name} meta={`${lead.stage} - ${lead.preferredLocation}`} onClick={() => { navigate(`/leads/${lead._id}`); onOpenChange(false); }} />)}
              </Section>
              <Section title="Properties">
                {filteredProperties.slice(0, 5).map((property) => <CommandItem key={property._id} icon={Building2} label={property.name} meta={`${property.pressure.category} - ${property.locality}`} onClick={() => { navigate(`/properties/${property._id}`); onOpenChange(false); }} />)}
              </Section>
              <Section title="Reservations">
                {filteredReservations.slice(0, 4).map((reservation) => <CommandItem key={reservation._id} icon={WalletCards} label={reservation.lead?.name ?? "Reservation"} meta={`${reservation.status} - ${reservation.property?.name ?? "Property"}`} onClick={() => { navigate("/reservations"); onOpenChange(false); }} />)}
              </Section>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-3">
      <p className="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function CommandItem({ icon: Icon, label, meta, onClick }: { icon: ElementType; label: string; meta?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full min-w-0 items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition hover:bg-muted">
      <Icon className="h-4 w-4 shrink-0 text-primary" />
      <span className="min-w-0 truncate font-medium">{label}</span>
      {meta && <span className="ml-auto hidden max-w-[42%] truncate text-xs text-muted-foreground sm:block">{meta}</span>}
    </button>
  );
}
