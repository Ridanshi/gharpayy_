import { LeadDocument } from "../models/Lead.js";
import { PropertyDocument } from "../models/Property.js";
import { PressureCategory } from "../types.js";

const stageWeight: Record<string, number> = {
  New: 18,
  Contacted: 28,
  "Tour Scheduled": 48,
  "Tour Done": 65,
  Negotiation: 78,
  Reserved: 88,
  "Closed Won": 100,
  "Closed Lost": 8
};

export function scoreLead(lead: Partial<LeadDocument>) {
  const now = Date.now();
  const lastActivity = lead.lastActivityAt ? new Date(lead.lastActivityAt).getTime() : now;
  const hoursInactive = Math.max(0, (now - lastActivity) / 36e5);
  const viewed = lead.propertiesViewed?.length ?? 0;
  const pricingViews = lead.pricingViews ?? 0;
  const followUpDue = lead.nextFollowUpAt ? new Date(lead.nextFollowUpAt).getTime() < now : false;
  const stage = lead.stage ?? "New";
  const budget = Number(lead.budget ?? 0);
  const moveInDays = lead.moveInDate ? Math.ceil((new Date(lead.moveInDate).getTime() - now) / 86400000) : 30;
  const variation = stableVariation(String((lead as any)._id ?? lead.name ?? lead.phone ?? stage));

  let score = stageWeight[stage] ?? 30;
  score += Math.min(viewed * 8, 18);
  score += Math.min(pricingViews * 4, 14);
  score += budget >= 15000 ? 6 : budget >= 11000 ? 2 : -4;
  score += moveInDays <= 7 ? 8 : moveInDays <= 15 ? 4 : 0;
  score += followUpDue ? 8 : 0;
  score -= hoursInactive > 96 ? 22 : hoursInactive > 72 ? 16 : hoursInactive > 48 ? 10 : hoursInactive > 24 ? 4 : 0;
  score += variation;
  score = Math.max(8, Math.min(stage === "Closed Won" ? 99 : 96, Math.round(score)));

  const conversionProbability = Math.min(0.96, Math.max(0.08, score / 112));
  const ghosted = hoursInactive >= 48 && !["Closed Won", "Closed Lost"].includes(stage);
  const stale = hoursInactive >= 96 || (stage === "New" && hoursInactive >= 24);

  const nextBestAction = ghosted
    ? "Send a short WhatsApp revival nudge with two available tour slots."
    : stage === "Tour Scheduled"
      ? "Confirm visit logistics and share property manager contact."
      : stage === "Negotiation"
        ? "Offer deposit-lock option before high-demand rooms are taken."
        : pricingViews > 2
          ? "Send price comparison and best-fit room recommendation."
          : "Call within the next operating window and qualify move-in urgency.";

  const insight =
    viewed >= 2 && pricingViews >= 2
      ? "Lead visited multiple properties and reopened pricing. High booking intent detected."
      : ghosted
        ? "Lead has been inactive beyond the healthy response window. Revival sequence recommended."
        : followUpDue
          ? "Follow-up is due now. Faster response can protect conversion probability."
          : "Lead behavior is healthy. Continue guided property matching.";

  return {
    urgencyScore: score,
    conversionProbability,
    ghosted,
    stale,
    category: score >= 90 ? "Hot" : score >= 70 ? "Warm" : score >= 40 ? "Watchlist" : "Cold",
    priorityState: ghosted || stale ? "At Risk" : followUpDue ? "Follow-up Due" : stage === "Negotiation" ? "Negotiation Active" : score >= 90 ? "High Intent" : score < 40 ? "Low Activity" : "Engaged",
    reasons: [
      viewed >= 2 ? "Viewed multiple properties" : null,
      pricingViews >= 2 ? "Viewed pricing multiple times" : null,
      followUpDue ? "Follow-up due now" : null,
      ghosted ? "No response beyond healthy window" : null,
      stage === "Tour Done" ? "Completed property tour" : null,
      stage === "Negotiation" ? "Negotiation active" : null
    ].filter(Boolean),
    nextBestAction,
    insight,
    revivalRecommendation: ghosted || stale ? "Use a benefit-led message with one best-match PG and a same-day visit slot." : null
  };
}

function stableVariation(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) hash = (hash * 31 + seed.charCodeAt(index)) % 997;
  return (hash % 11) - 5;
}

export function pressureIndex(property: Partial<PropertyDocument>) {
  const rooms = property.rooms ?? [];
  const beds = rooms.reduce((sum, room) => sum + Number(room.bedCount ?? 0), 0);
  const occupied = rooms.reduce((sum, room) => sum + Number(room.occupiedBeds ?? 0), 0);
  const occupancy = beds ? Math.round((occupied / beds) * 100) : 0;
  const demandScore = property.demandScore ?? 50;
  const conversionScore = property.conversionScore ?? 50;
  const velocity = property.bookingVelocity ?? 0;
  const inquiries = property.inquiryVolume ?? 0;
  const pricingPressure = property.pricingPressure ?? 50;
  const score = Math.round(
    occupancy * 0.24 + demandScore * 0.24 + conversionScore * 0.18 + Math.min(velocity * 8, 100) * 0.16 + Math.min(inquiries, 100) * 0.1 + pricingPressure * 0.08
  );

  let category: PressureCategory = "Balanced";
  if (score >= 74 && occupancy >= 80) category = "High Demand";
  else if (score >= 68 && occupancy >= 65) category = "Fast Filling";
  else if (occupancy < 55 && demandScore < 45) category = "Vacancy Risk";
  else if (conversionScore < 40 || score < 42) category = "Underperforming";

  return { score, occupancy, demandScore, conversionScore, bookingVelocity: velocity, inquiryVolume: inquiries, pricingPressure, category };
}

export function matchProperty(lead: Partial<LeadDocument>, property: Partial<PropertyDocument>) {
  const pressure = pressureIndex(property);
  const localityFit = property.locality === lead.preferredLocation ? 30 : 8;
  const budgetFit = Math.max(0, 28 - Math.abs((property.averageRent ?? 0) - (lead.budget ?? 0)) / 650);
  const occupancyFit = (property.rooms ?? []).some((room) => room.occupancyType === lead.occupancyPreference && room.bedCount > room.occupiedBeds) ? 18 : 4;
  const genderFit = property.gender === "Co-living" || lead.genderPreference === "Any" || property.gender === lead.genderPreference ? 14 : 0;
  const momentum = Math.min(10, pressure.demandScore / 10);
  const score = Math.round(localityFit + budgetFit + occupancyFit + genderFit + momentum);
  const labels = [
    score >= 78 ? "Best Match" : null,
    pressure.category === "High Demand" ? "Fast Filling" : null,
    pressure.conversionScore > 72 ? "High Conversion" : null,
    (property.averageRent ?? 0) <= (lead.budget ?? 0) ? "Budget Friendly" : null
  ].filter(Boolean);

  return { score, labels };
}
