import { Types } from "mongoose";

export type Role = "Admin" | "Sales Ops" | "Sales Agent";
export type LeadStage =
  | "New"
  | "Contacted"
  | "Tour Scheduled"
  | "Tour Done"
  | "Negotiation"
  | "Reserved"
  | "Closed Won"
  | "Closed Lost";

export type PressureCategory = "High Demand" | "Balanced" | "Fast Filling" | "Vacancy Risk" | "Underperforming";

export type Id = Types.ObjectId;
