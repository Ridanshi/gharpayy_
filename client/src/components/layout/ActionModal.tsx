import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, FileDown, ImagePlus, Trash2, X } from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency, stages } from "@/lib/utils";
import { Lead, Property, Reservation, User, Visit } from "@/types";
import { useActionModalStore, ActionName } from "@/stores/actionModal";
import { useAuthStore } from "@/stores/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

type Analytics = {
  sources: { source: string; leads: number; conversion: number }[];
  agents: { name: string; won: number; tours: number; revenue: number }[];
  bookings: { month: string; bookings: number; occupancy: number }[];
};

const titles: Record<ActionName, string> = {
  "Add Lead": "Add Lead",
  "Add Property": "Add Property",
  "Create Reservation": "Create Reservation",
  "Manage Users": "Manage Users",
  "Export Analytics": "Export Analytics",
  "Assign Leads": "Assign Leads",
  "Generate Report": "Generate Report",
  "Assign Lead": "Assign Lead",
  "Schedule Tour": "Schedule Tour",
  "Reassign Agent": "Reassign Agent",
  "Trigger Follow-up": "Trigger Follow-up",
  "Escalate Lead": "Escalate Lead",
  "Create Task": "Create Task",
  "Call Lead": "Call Lead",
  "Update Status": "Update Lead Status",
  "Add Note": "Add Note",
  "Schedule Follow-up": "Schedule Follow-up",
  "Complete Tour": "Complete Tour",
  "Send Reservation Link": "Send Reservation Link"
};

const initialForm: Record<string, string> = {
  lead: "",
  property: "",
  agent: "",
  scheduledAt: "",
  dueAt: "",
  stage: "Contacted",
  name: "",
  phone: "",
  email: "",
  locality: "",
  budget: "",
  title: "",
  note: "",
  summary: "",
  rent: "",
  deposit: "",
  totalRooms: "",
  occupiedRooms: "",
  availableRooms: "",
  propertyType: "",
  status: "",
  address: "",
  gender: "",
  landmark: "",
  tags: "",
  amenities: "",
  description: "",
  images: "",
  reportType: "",
  format: "",
  from: "",
  to: "",
  user: ""
};

export function ActionModal() {
  const { action, payload, closeAction } = useActionModalStore();
  const currentUser = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data: leads = [] } = useQuery({ queryKey: ["leads"], queryFn: () => api<Lead[]>("/leads"), enabled: Boolean(action) });
  const { data: properties = [] } = useQuery({ queryKey: ["properties"], queryFn: () => api<Property[]>("/properties"), enabled: Boolean(action) });
  const { data: reservations = [] } = useQuery({ queryKey: ["reservations"], queryFn: () => api<Reservation[]>("/reservations"), enabled: Boolean(action) });
  const { data: analytics } = useQuery({ queryKey: ["analytics"], queryFn: () => api<Analytics>("/analytics"), enabled: Boolean(action) });
  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: () => api<User[]>("/users"), enabled: Boolean(action) && currentUser?.role !== "Sales Agent", retry: false });
  const { data: visits = [] } = useQuery({ queryKey: ["visits"], queryFn: () => api<Visit[]>("/visits"), enabled: Boolean(action) });
  const primaryLead = useMemo(() => leads.find((lead) => lead._id === payload?.leadId) ?? leads[0], [leads, payload]);
  const [form, setForm] = useState<Record<string, string>>(initialForm);

  useEffect(() => {
    if (!action) return;
    setForm({
      ...initialForm,
      lead: String(payload?.leadId ?? primaryLead?._id ?? ""),
      property: properties[0]?._id ?? "",
      agent: users[0]?._id ?? currentUser?._id ?? currentUser?.id ?? "",
      scheduledAt: defaultDateTime(3),
      dueAt: defaultDateTime(6),
      stage: "Contacted",
      name: "",
      phone: "",
      email: "",
      locality: action === "Add Property" ? "" : "HSR Layout",
      budget: "15000",
      title: action,
      note: "",
      summary: "",
      rent: "15000",
      deposit: "30000",
      totalRooms: "12",
      occupiedRooms: "7",
      availableRooms: "5",
      propertyType: "PG",
      status: "Active",
      address: "",
      gender: "Co-living",
      landmark: "",
      tags: "",
      amenities: "WiFi, Meals, Laundry, Security",
      description: "",
      images: "",
      reportType: action === "Generate Report" ? "Full Operations Report" : "Revenue Report",
      format: "CSV",
      from: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
      to: new Date().toISOString().slice(0, 10),
      user: users[0]?._id ?? ""
    });
  }, [action, payload, primaryLead?._id, properties[0]?._id, users[0]?._id, currentUser?._id, currentUser?.id]);

  const invalidate = () => {
    ["dashboard", "leads", "properties", "reservations", "visits", "analytics", "notifications-feed", "users"].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
  };

  const errors = action ? validate(action, form) : [];

  const mutation = useMutation({
    mutationFn: async () => {
      if (!action) return null;
      const leadId = form.lead || primaryLead?._id;
      const property = properties.find((item) => item._id === form.property) ?? properties[0];
      const room = property?.rooms?.find((item) => item.status !== "Occupied") ?? property?.rooms?.[0];

      if (action === "Export Analytics" || action === "Generate Report") {
        const filename = buildExport({ reportType: form.reportType, format: form.format, from: form.from, to: form.to, leads, properties, reservations, analytics });
        await api("/activity", { method: "POST", body: JSON.stringify({ type: "report.exported", title: `${form.reportType} exported`, description: filename }) });
        return { filename };
      }
      if (action === "Manage Users") {
        const target = users.find((user) => user._id === form.user) ?? users[0];
        if (!target) return null;
        return api(`/users/${target._id}`, { method: "PATCH", body: JSON.stringify({ active: form.stage !== "Closed Lost" }) });
      }
      if (action === "Add Lead") {
        return api("/leads", { method: "POST", body: JSON.stringify({ name: form.name, phone: form.phone, email: form.email, budget: Number(form.budget), preferredLocation: form.locality, source: "Manual", stage: "New", assignedAgent: form.agent || undefined, moveInDate: new Date(defaultDateTime(72)).toISOString() }) });
      }
      if (action === "Add Property") {
        return api("/properties", { method: "POST", body: JSON.stringify({ name: safeTrim(form.name), locality: safeTrim(form.locality), address: safeTrim(form.address), averageRent: Number(form.rent), totalRooms: Number(form.totalRooms), occupiedRooms: Number(form.occupiedRooms), availableRooms: Number(form.availableRooms), propertyType: form.propertyType, status: form.status, gender: form.gender, landmark: safeTrim(form.landmark), tags: splitList(form.tags), amenities: form.amenities, description: safeTrim(form.description), images: getImages(form.images) }) });
      }
      if (action === "Create Reservation" || action === "Send Reservation Link") {
        return api("/reservations", { method: "POST", body: JSON.stringify({ lead: leadId, property: property?._id, roomId: room?._id, assignedAgent: form.agent || primaryLead?.assignedAgent?._id, monthlyRent: Number(form.rent || room?.rent || 15000), depositAmount: Number(form.deposit || room?.deposit || 30000), depositPaid: action === "Send Reservation Link" ? 0 : Number(form.deposit || 30000), paymentStatus: action === "Send Reservation Link" ? "Pending" : "Paid", moveInDate: new Date(defaultDateTime(96)).toISOString() }) });
      }
      if (action === "Assign Lead" || action === "Assign Leads" || action === "Reassign Agent") {
        return api(`/leads/${leadId}`, { method: "PATCH", body: JSON.stringify({ assignedAgent: form.agent }) });
      }
      if (action === "Schedule Tour") {
        return api(`/leads/${leadId}/visits`, { method: "POST", body: JSON.stringify({ property: property?._id, scheduledAt: new Date(form.scheduledAt).toISOString(), note: form.note }) });
      }
      if (action === "Create Task" || action === "Schedule Follow-up" || action === "Trigger Follow-up" || action === "Escalate Lead") {
        return api("/tasks", { method: "POST", body: JSON.stringify({ title: form.title || action, lead: leadId, owner: form.agent || primaryLead?.assignedAgent?._id, dueAt: new Date(form.dueAt).toISOString(), priority: action === "Escalate Lead" ? "Urgent" : "High" }) });
      }
      if (action === "Call Lead") {
        return api(`/leads/${leadId}/calls`, { method: "POST", body: JSON.stringify({ outcome: "Connected", summary: form.summary || "Call completed from quick action." }) });
      }
      if (action === "Add Note") {
        return api(`/leads/${leadId}/notes`, { method: "POST", body: JSON.stringify({ body: form.note || "Operational note added." }) });
      }
      if (action === "Update Status") {
        return api(`/leads/${leadId}`, { method: "PATCH", body: JSON.stringify({ stage: form.stage }) });
      }
      if (action === "Complete Tour") {
        const visit = visits.find((item) => item.lead?._id === leadId) ?? visits[0];
        return visit ? api(`/visits/${visit._id}`, { method: "PATCH", body: JSON.stringify({ status: "Completed", feedback: form.note || "Tour completed from quick action.", rating: 4 }) }) : null;
      }
      return null;
    },
    onSuccess: (result) => {
      if (!action) return;
      if (action === "Add Property" && result) {
        queryClient.setQueryData<Property[]>(["properties"], (old = []) => [result as Property, ...old.filter((property) => property._id !== (result as Property)._id)]);
      }
      invalidate();
      toast.show({ title: action === "Add Property" ? "Property added successfully" : `${action} complete`, body: action.includes("Export") || action.includes("Report") ? `Downloaded ${(result as { filename?: string } | null)?.filename ?? "report file"}.` : successCopy(action) });
      closeAction();
    },
    onError: (error) => toast.show({ title: "Action failed", body: error instanceof Error ? error.message : "Please try again." })
  });

  if (!action) return null;

  return (
    <Dialog.Root open={Boolean(action)} onOpenChange={(open) => !open && closeAction()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background/72 backdrop-blur-sm" />
        <Dialog.Content asChild>
          <motion.div initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="fixed inset-x-3 bottom-3 top-3 z-50 flex min-h-0 flex-col overflow-hidden rounded-lg border bg-card shadow-2xl sm:bottom-auto sm:left-1/2 sm:top-[6vh] sm:max-h-[88vh] sm:w-[calc(100vw-2rem)] sm:max-w-2xl sm:-translate-x-1/2">
            <div className="shrink-0 flex items-center justify-between gap-3 border-b p-4 sm:p-5">
              <div>
                <Dialog.Title className="text-lg font-bold">{titles[action]}</Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-muted-foreground">Complete the workflow and FlowOps will update connected queues and activity.</Dialog.Description>
              </div>
              <Button variant="ghost" size="icon" onClick={closeAction}><X className="h-4 w-4" /></Button>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 sm:p-5">
              <Fields action={action} form={form} setForm={setForm} leads={leads} properties={properties} users={users} reservations={reservations} />
              {errors.length > 0 && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  <div className="mb-1 flex items-center gap-2 font-semibold"><AlertCircle className="h-4 w-4" />Needs attention</div>
                  {errors.map((error) => <p key={error}>{error}</p>)}
                </div>
              )}
            </div>
            <div className="shrink-0 flex flex-col-reverse gap-2 border-t bg-card/95 p-4 sm:flex-row sm:justify-end">
              <Button variant="secondary" className="w-full sm:w-auto" onClick={closeAction}>Cancel</Button>
              <Button className="w-full sm:w-auto" onClick={() => mutation.mutate()} disabled={mutation.isPending || errors.length > 0}>
                {action.includes("Export") || action.includes("Report") ? <FileDown className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                {mutation.isPending ? "Working..." : action.includes("Export") || action.includes("Report") ? "Download" : "Submit"}
              </Button>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Fields({ action, form, setForm, leads, properties, users, reservations }: { action: ActionName; form: Record<string, string>; setForm: (form: Record<string, string>) => void; leads: Lead[]; properties: Property[]; users: User[]; reservations: Reservation[] }) {
  const stableForm = { ...initialForm, ...form };
  const update = (key: string, value: string) => setForm({ ...stableForm, [key]: value ?? "" });
  const needsLead = !["Add Lead", "Add Property", "Export Analytics", "Generate Report", "Manage Users"].includes(action);
  return (
    <div className="space-y-4">
      {(action === "Export Analytics" || action === "Generate Report") && <ExportFields form={stableForm} update={update} />}
      {action === "Manage Users" && <ManageUsers users={users} form={stableForm} update={update} />}
      {needsLead && <Select label="Lead" value={stableForm.lead} onChange={(value) => update("lead", value)} options={leads.map((lead) => ({ value: lead._id, label: `${lead.name} - ${lead.stage}` }))} />}
      {action === "Add Lead" && <div className="grid gap-3 sm:grid-cols-2"><Input placeholder="Lead name" value={stableForm.name || ""} onChange={(e) => update("name", e.target.value)} /><Input placeholder="Phone" value={stableForm.phone || ""} onChange={(e) => update("phone", e.target.value)} /><Input placeholder="Email" value={stableForm.email || ""} onChange={(e) => update("email", e.target.value)} /><Input placeholder="Budget" value={stableForm.budget || ""} onChange={(e) => update("budget", e.target.value)} /><Input placeholder="Location" value={stableForm.locality || ""} onChange={(e) => update("locality", e.target.value)} /></div>}
      {action === "Add Property" && <PropertyFields form={stableForm} update={update} />}
      {(action.includes("Assign") || action === "Reassign Agent" || action === "Create Task" || action === "Schedule Follow-up" || action === "Trigger Follow-up" || action === "Escalate Lead") && <Select label="Owner" value={stableForm.agent} onChange={(value) => update("agent", value)} options={users.map((user) => ({ value: user._id, label: `${user.name} - ${user.role}` }))} />}
      {(action === "Schedule Tour" || action === "Create Reservation" || action === "Send Reservation Link") && <Select label="Property" value={stableForm.property} onChange={(value) => update("property", value)} options={properties.map((property) => ({ value: property._id, label: property.name }))} />}
      {action === "Schedule Tour" && <Input type="datetime-local" value={stableForm.scheduledAt || ""} onChange={(e) => update("scheduledAt", e.target.value)} />}
      {(action === "Create Task" || action === "Schedule Follow-up" || action === "Trigger Follow-up" || action === "Escalate Lead") && <><Input placeholder="Task title" value={stableForm.title || ""} onChange={(e) => update("title", e.target.value)} /><Input type="datetime-local" value={stableForm.dueAt || ""} onChange={(e) => update("dueAt", e.target.value)} /></>}
      {action === "Update Status" && <Select label="Stage" value={stableForm.stage} onChange={(value) => update("stage", value)} options={stages.map((stage) => ({ value: stage, label: stage }))} />}
      {(action === "Create Reservation" || action === "Send Reservation Link") && <div className="grid gap-3 sm:grid-cols-2"><Input placeholder="Monthly rent" value={stableForm.rent || ""} onChange={(e) => update("rent", e.target.value)} /><Input placeholder="Deposit" value={stableForm.deposit || ""} onChange={(e) => update("deposit", e.target.value)} /></div>}
      {(action === "Add Note" || action === "Schedule Tour" || action === "Complete Tour" || action === "Escalate Lead") && <Textarea placeholder="Operational note" value={stableForm.note} onChange={(value) => update("note", value)} />}
      {action === "Call Lead" && <Textarea placeholder="Call summary" value={stableForm.summary} onChange={(value) => update("summary", value)} />}
      {action === "Complete Tour" && reservations.length > 0 && <p className="text-xs text-muted-foreground">Completing the latest matching tour will update operational queues and feed.</p>}
    </div>
  );
}

function ExportFields({ form, update }: { form: Record<string, string>; update: (key: string, value: string) => void }) {
  return (
    <div className="space-y-4">
      <Select label="Report type" value={form.reportType || ""} onChange={(value) => update("reportType", value)} options={["Revenue Report", "Leads Report", "Occupancy Report", "Agent Performance Report", "Full Operations Report"].map((item) => ({ value: item, label: item }))} />
      <Select label="Format" value={form.format || ""} onChange={(value) => update("format", value)} options={["CSV", "JSON"].map((item) => ({ value: item, label: item }))} />
      <div className="grid gap-3 sm:grid-cols-2"><Input type="date" value={form.from || ""} onChange={(e) => update("from", e.target.value)} /><Input type="date" value={form.to || ""} onChange={(e) => update("to", e.target.value)} /></div>
      <div className="rounded-md border bg-background/60 p-3 text-sm text-muted-foreground">Filename preview: {slug(form.reportType || "report")}-{form.from || "from"}-to-{form.to || "to"}.{(form.format || "CSV").toLowerCase()}</div>
    </div>
  );
}

function ManageUsers({ users, form, update }: { users: User[]; form: Record<string, string>; update: (key: string, value: string) => void }) {
  return (
    <div className="space-y-4">
      <Select label="User" value={form.user || ""} onChange={(value) => update("user", value)} options={users.map((user) => ({ value: user._id, label: `${user.name} - ${user.role}` }))} />
      <Select label="Access state" value={form.stage || ""} onChange={(value) => update("stage", value)} options={[{ value: "Contacted", label: "Active" }, { value: "Closed Lost", label: "Deactivate" }]} />
    </div>
  );
}

function PropertyFields({ form, update }: { form: Record<string, string>; update: (key: string, value: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const images = getImages(form.images);

  function handleFiles(files?: FileList | File[]) {
    const incoming = Array.from(files ?? []).filter((file) => file.type.startsWith("image/"));
    if (!incoming.length) return;
    setUploading(true);
    Promise.all(
      incoming.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(new Error("Could not read image"));
            reader.readAsDataURL(file);
          })
      )
    )
      .then((dataUrls) => update("images", JSON.stringify([...images, ...dataUrls])))
      .finally(() => setUploading(false));
  }

  function removeImage(index: number) {
    update("images", JSON.stringify(images.filter((_, imageIndex) => imageIndex !== index)));
  }

  return (
    <div className="space-y-4">
      <div
        className="rounded-lg border border-dashed bg-background/50 p-3"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          handleFiles(event.dataTransfer.files);
        }}
      >
        <label className="grid min-h-32 cursor-pointer place-items-center rounded-md bg-background/45 p-4 text-center text-sm text-muted-foreground transition hover:bg-muted/40">
          <span className="flex items-center gap-2 font-semibold text-foreground"><ImagePlus className="h-4 w-4 text-primary" />Upload property photos</span>
          <span>{uploading ? "Preparing image previews..." : "Drag images here or click to browse. The first image becomes the cover."}</span>
          <input type="file" accept="image/*" multiple className="hidden" onChange={(event) => handleFiles(event.target.files ?? undefined)} />
        </label>
        {images.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {images.map((image, index) => (
              <div key={`${image.slice(0, 24)}-${index}`} className="group relative overflow-hidden rounded-md border bg-background">
                <img src={image} alt={`Property upload ${index + 1}`} className="h-24 w-full object-cover transition duration-300 group-hover:scale-105" />
                <button type="button" onClick={() => removeImage(index)} className="absolute right-1 top-1 rounded-full bg-background/80 p-1 text-muted-foreground shadow-sm backdrop-blur transition hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input placeholder="Property name" value={form.name || ""} onChange={(e) => update("name", e.target.value)} />
        <Input placeholder="Area / locality" value={form.locality || ""} onChange={(e) => update("locality", e.target.value)} />
        <Input placeholder="Full address" value={form.address || ""} onChange={(e) => update("address", e.target.value)} />
        <Input placeholder="Nearby landmark" value={form.landmark || ""} onChange={(e) => update("landmark", e.target.value)} />
        <Input placeholder="Monthly rent" value={form.rent || ""} onChange={(e) => update("rent", e.target.value)} />
        <Input placeholder="Total rooms" value={form.totalRooms || ""} onChange={(e) => update("totalRooms", e.target.value)} />
        <Input placeholder="Occupied rooms" value={form.occupiedRooms || ""} onChange={(e) => update("occupiedRooms", e.target.value)} />
        <Input placeholder="Available rooms" value={form.availableRooms || ""} onChange={(e) => update("availableRooms", e.target.value)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Select label="Property type" value={form.propertyType || ""} onChange={(value) => update("propertyType", value)} options={["PG", "Co-living", "Hostel", "Apartment"].map((item) => ({ value: item, label: item }))} />
        <Select label="Status" value={form.status || ""} onChange={(value) => update("status", value)} options={["Active", "Filling", "Full", "Maintenance", "Archived"].map((item) => ({ value: item, label: item }))} />
        <Select label="Gender preference" value={form.gender || ""} onChange={(value) => update("gender", value)} options={["Co-living", "Male", "Female"].map((item) => ({ value: item, label: item }))} />
      </div>
      <Input placeholder="Amenities, comma separated" value={form.amenities || ""} onChange={(e) => update("amenities", e.target.value)} />
      <Input placeholder="Tags, comma separated" value={form.tags || ""} onChange={(e) => update("tags", e.target.value)} />
      <Textarea placeholder="Property description" value={form.description || ""} onChange={(value) => update("description", value)} />
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value?: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) {
  return <label className="block space-y-2 text-sm"><span className="font-medium">{label}</span><select value={value ?? ""} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

function Textarea({ placeholder, value, onChange }: { placeholder: string; value?: string; onChange: (value: string) => void }) {
  return <textarea placeholder={placeholder} value={value ?? ""} onChange={(event) => onChange(event.target.value)} className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />;
}

function buildExport({ reportType, format, from, to, leads, properties, reservations, analytics }: { reportType: string; format: string; from: string; to: string; leads: Lead[]; properties: Property[]; reservations: Reservation[]; analytics?: Analytics }) {
  const safeReportType = safeTrim(reportType) || "Full Operations Report";
  const safeFormat = (safeTrim(format) || "CSV").toUpperCase();
  const safeFrom = safeTrim(from) || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const safeTo = safeTrim(to) || new Date().toISOString().slice(0, 10);
  const rows = exportRows(safeReportType, leads, properties, reservations, analytics);
  const metadata = { reportType: safeReportType, generatedAt: new Date().toISOString(), from: safeFrom, to: safeTo, rowCount: rows.length };
  const filename = `${slug(safeReportType)}-${safeFrom}-to-${safeTo}.${safeFormat.toLowerCase()}`;
  const content = safeFormat === "JSON" ? JSON.stringify({ metadata, rows }, null, 2) : toCsv(rows, metadata);
  const blob = new Blob([content], { type: safeFormat === "JSON" ? "application/json" : "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  return filename;
}

function exportRows(reportType: string, leads: Lead[], properties: Property[], reservations: Reservation[], analytics?: Analytics) {
  if (reportType === "Leads Report") return leads.map((lead) => ({ name: lead.name, stage: lead.stage, source: lead.source, budget: lead.budget, location: lead.preferredLocation, aiScore: lead.aiScore, owner: lead.assignedAgent?.name ?? "" }));
  if (reportType === "Occupancy Report") return properties.map((property) => ({ property: property.name, locality: property.locality, occupancy: `${property.pressure.occupancy}%`, category: property.pressure.category, pressureScore: property.pressure.score, averageRent: property.averageRent, vacancies: property.rooms.reduce((sum, room) => sum + Math.max(0, room.bedCount - room.occupiedBeds), 0) }));
  if (reportType === "Agent Performance Report") return analytics?.agents ?? [];
  if (reportType === "Revenue Report") return reservations.map((reservation) => ({ lead: reservation.lead?.name, property: reservation.property?.name, status: reservation.status, paymentStatus: reservation.paymentStatus, monthlyRent: reservation.monthlyRent, depositPaid: reservation.depositPaid, revenueImpact: formatCurrency(reservation.monthlyRent + reservation.depositPaid) }));
  return [
    ...leads.slice(0, 25).map((lead) => ({ section: "Lead", name: lead.name, metric: lead.stage, value: lead.aiScore })),
    ...properties.slice(0, 25).map((property) => ({ section: "Property", name: property.name, metric: property.pressure.category, value: property.pressure.score })),
    ...reservations.slice(0, 25).map((reservation) => ({ section: "Reservation", name: reservation.lead?.name, metric: reservation.status, value: reservation.monthlyRent + reservation.depositPaid }))
  ];
}

function toCsv(rows: Record<string, unknown>[], metadata: Record<string, unknown>) {
  const metaRows = Object.entries(metadata).map(([key, value]) => `${escapeCsv(key)},${escapeCsv(value)}`).join("\n");
  if (!rows.length) return `${metaRows}\n\n`;
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const body = rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(",")).join("\n");
  return `${metaRows}\n\n${headers.map(escapeCsv).join(",")}\n${body}`;
}

function escapeCsv(value: unknown) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function slug(value: string) {
  return safeTrim(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "report";
}

function validate(action: ActionName, form: Record<string, string>) {
  const errors: string[] = [];
  if (action === "Add Lead") {
    if (safeTrim(form.name).length < 2) errors.push("Lead name is required.");
    if (safeTrim(form.phone).length < 7) errors.push("Enter a valid phone number.");
  }
  if (action === "Add Property") {
    const totalRooms = Number(form.totalRooms);
    const occupiedRooms = Number(form.occupiedRooms);
    const availableRooms = Number(form.availableRooms);
    const rent = Number(form.rent);
    if (safeTrim(form.name).length < 2) errors.push("Property name is required.");
    if (safeTrim(form.locality).length < 2) errors.push("Area is required.");
    if (safeTrim(form.address).length < 4) errors.push("Address is required.");
    if (!form.propertyType) errors.push("Property type is required.");
    if (!form.status) errors.push("Occupancy status is required.");
    if (!form.gender) errors.push("Gender preference is required.");
    if (safeTrim(form.landmark).length < 2) errors.push("Nearby landmark is required.");
    if (splitList(form.amenities).length === 0) errors.push("Add at least one amenity.");
    if (safeTrim(form.description).length < 8) errors.push("Add a short property description.");
    if (!Number.isFinite(rent) || rent <= 0) errors.push("Monthly rent must be greater than 0.");
    if (!Number.isInteger(totalRooms) || totalRooms <= 0) errors.push("Total rooms must be a positive whole number.");
    if (!Number.isInteger(occupiedRooms) || occupiedRooms < 0) errors.push("Occupied rooms cannot be negative.");
    if (!Number.isInteger(availableRooms) || availableRooms < 0) errors.push("Available rooms cannot be negative.");
    if (Number.isFinite(totalRooms) && Number.isFinite(occupiedRooms) && occupiedRooms > totalRooms) errors.push("Occupied rooms cannot exceed total rooms.");
    if (Number.isFinite(totalRooms) && Number.isFinite(availableRooms) && availableRooms > totalRooms) errors.push("Available rooms cannot exceed total rooms.");
    if (Number.isFinite(totalRooms) && Number.isFinite(availableRooms) && Number.isFinite(occupiedRooms) && availableRooms + occupiedRooms > totalRooms) errors.push("Occupied plus available rooms cannot exceed total rooms.");
  }
  if (action === "Export Analytics" || action === "Generate Report") {
    if (!form.reportType || !form.format || !form.from || !form.to) errors.push("Report type, format, and date range are required.");
  }
  return errors;
}

function safeTrim(value: unknown) {
  return String(value ?? "").trim();
}

function splitList(value: unknown) {
  return safeTrim(value).split(",").map((item) => item.trim()).filter(Boolean);
}

function getImages(value: unknown) {
  const text = safeTrim(value);
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed.map((item) => String(item)).filter(Boolean) : [];
  } catch {
    return [text];
  }
}

function successCopy(action: ActionName) {
  if (action === "Send Reservation Link") return "Reservation link generated and payment status is now pending.";
  if (action === "Export Analytics" || action === "Generate Report") return "A real downloadable file was generated and activity was logged.";
  return "Connected widgets, queues, and activity feeds will refresh automatically.";
}

function defaultDateTime(hours: number) {
  const date = new Date();
  date.setHours(date.getHours() + hours, 0, 0, 0);
  return date.toISOString().slice(0, 16);
}
