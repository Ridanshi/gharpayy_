export type Role = "Admin" | "Sales Ops" | "Sales Agent";
export type LeadStage = "New" | "Contacted" | "Tour Scheduled" | "Tour Done" | "Negotiation" | "Reserved" | "Closed Won" | "Closed Lost";

export type User = {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
};

export type Intelligence = {
  urgencyScore: number;
  conversionProbability: number;
  ghosted: boolean;
  stale: boolean;
  category?: "Hot" | "Warm" | "Watchlist" | "Cold";
  priorityState?: string;
  reasons?: string[];
  nextBestAction: string;
  insight: string;
  revivalRecommendation?: string | null;
};

export type Lead = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  stage: LeadStage;
  budget: number;
  preferredLocation: string;
  moveInDate: string;
  occupancyPreference: "Single" | "Double" | "Triple";
  genderPreference: "Male" | "Female" | "Any";
  assignedAgent?: User;
  tags: string[];
  aiScore: number;
  conversionProbability: number;
  nextFollowUpAt?: string;
  lastActivityAt: string;
  pricingViews: number;
  activity: Activity[];
  intelligence?: Intelligence;
};

export type Room = {
  _id: string;
  label: string;
  occupancyType: "Single" | "Double" | "Triple";
  rent: number;
  deposit: number;
  bedCount: number;
  occupiedBeds: number;
  status: "Available" | "Reserved" | "Occupied" | "Maintenance";
};

export type Property = {
  _id: string;
  name: string;
  locality: string;
  city: string;
  address?: string;
  landmark?: string;
  description?: string;
  status?: "Active" | "Filling" | "Full" | "Archived" | "Maintenance";
  propertyType?: "PG" | "Co-living" | "Hostel" | "Apartment";
  gender: "Male" | "Female" | "Co-living";
  images: string[];
  amenities: string[];
  tags?: string[];
  rooms: Room[];
  inquiryVolume: number;
  demandScore: number;
  conversionScore: number;
  bookingVelocity: number;
  pricingPressure: number;
  averageRent: number;
  rating: number;
  pressure: {
    score: number;
    occupancy: number;
    category: "High Demand" | "Balanced" | "Fast Filling" | "Vacancy Risk" | "Underperforming";
    demandScore: number;
    conversionScore: number;
    bookingVelocity: number;
    inquiryVolume: number;
    pricingPressure: number;
  };
};

export type Activity = {
  _id: string;
  type: string;
  title: string;
  description?: string;
  actor?: User;
  lead?: Lead;
  property?: Property;
  createdAt: string;
};

export type Visit = {
  _id: string;
  lead: Lead;
  property: Property;
  agent: User;
  scheduledAt: string;
  status: "Scheduled" | "Checked In" | "Completed" | "No Show" | "Cancelled";
  feedback?: string;
  rating?: number;
};

export type Reservation = {
  _id: string;
  lead: Lead;
  property: Property;
  assignedAgent?: User;
  status: "Reserved" | "Deposit Pending" | "Confirmed" | "Checked In" | "Completed";
  monthlyRent: number;
  depositAmount: number;
  depositPaid: number;
  paymentStatus: "Pending" | "Partial" | "Paid";
  moveInDate?: string;
};
