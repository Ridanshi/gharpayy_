import { create } from "zustand";

export type ActionName =
  | "Add Lead"
  | "Add Property"
  | "Create Reservation"
  | "Manage Users"
  | "Export Analytics"
  | "Assign Leads"
  | "Generate Report"
  | "Assign Lead"
  | "Schedule Tour"
  | "Reassign Agent"
  | "Trigger Follow-up"
  | "Escalate Lead"
  | "Create Task"
  | "Call Lead"
  | "Update Status"
  | "Add Note"
  | "Schedule Follow-up"
  | "Complete Tour"
  | "Send Reservation Link";

type ActionModalState = {
  action: ActionName | null;
  payload?: Record<string, unknown>;
  openAction: (action: ActionName, payload?: Record<string, unknown>) => void;
  closeAction: () => void;
};

export const useActionModalStore = create<ActionModalState>((set) => ({
  action: null,
  payload: undefined,
  openAction: (action, payload) => set({ action, payload }),
  closeAction: () => set({ action: null, payload: undefined })
}));
