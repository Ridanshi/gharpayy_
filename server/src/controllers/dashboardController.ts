import { Activity } from "../models/Activity.js";
import { Lead } from "../models/Lead.js";
import { Property } from "../models/Property.js";
import { Reservation } from "../models/Reservation.js";
import { Task } from "../models/Task.js";
import { Visit } from "../models/Visit.js";
import { pressureIndex, scoreLead } from "../services/aiService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok } from "../utils/apiResponse.js";

export const getDashboard = asyncHandler(async (req, res) => {
  const role = req.user?.role ?? "Sales Agent";
  const userId = req.user?.id;
  const agentFilter = role === "Sales Agent" ? { assignedAgent: userId } : {};
  const visitFilter = role === "Sales Agent" ? { agent: userId } : {};
  const reservationFilter = role === "Sales Agent" ? { assignedAgent: userId } : {};
  const [leads, properties, reservations, visitsToday, tasksDue, feed] = await Promise.all([
    Lead.find(agentFilter).populate("assignedAgent", "name avatar role").sort({ aiScore: -1 }).limit(200),
    Property.find().limit(50),
    Reservation.find(reservationFilter).populate("lead property assignedAgent").sort({ createdAt: -1 }).limit(50),
    Visit.find({
      ...visitFilter,
      scheduledAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lte: new Date(new Date().setHours(23, 59, 59, 999))
      }
    }).populate("lead property agent"),
    Task.find({ ...(role === "Sales Agent" ? { owner: userId } : {}), dueAt: { $lte: new Date() }, status: { $ne: "Done" } }).populate("lead owner").limit(20),
    Activity.find().populate("actor lead property").sort({ createdAt: -1 }).limit(20)
  ]);

  const activeLeads = leads.filter((lead) => !["Closed Won", "Closed Lost"].includes(lead.stage)).length;
  const won = leads.filter((lead) => lead.stage === "Closed Won").length;
  const conversionRate = leads.length ? Math.round((won / leads.length) * 100) : 0;
  const revenueClosed = reservations.filter((r) => ["Confirmed", "Checked In", "Completed"].includes(r.status)).reduce((sum, r) => sum + r.depositPaid + r.monthlyRent, 0);
  const totalBeds = properties.reduce((sum, p) => sum + p.rooms.reduce((s, r) => s + r.bedCount, 0), 0);
  const occupiedBeds = properties.reduce((sum, p) => sum + p.rooms.reduce((s, r) => s + r.occupiedBeds, 0), 0);
  const occupancyRate = totalBeds ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const scored = leads.map((lead) => ({ lead, ai: scoreLead(lead.toObject()) }));
  const atRisk = scored.filter((item) => item.ai.ghosted || item.ai.stale).slice(0, 8);
  const hotPipeline = scored.filter((item) => item.ai.urgencyScore > 72 && !["Closed Won", "Closed Lost"].includes(item.lead.stage)).slice(0, 8);
  const pressure = properties.map((property) => ({ property, pressure: pressureIndex(property.toObject()) })).sort((a, b) => b.pressure.score - a.pressure.score);
  const unassignedLeads = role === "Sales Agent" ? 0 : await Lead.countDocuments({ assignedAgent: { $exists: false } });
  const pendingReservations = reservations.filter((r) => ["Reserved", "Deposit Pending"].includes(r.status)).length;
  const negotiations = leads.filter((lead) => lead.stage === "Negotiation").length;
  const highRiskProperties = pressure.filter((item) => ["Vacancy Risk", "Underperforming"].includes(item.pressure.category)).length;
  const leadToBookingRatio = leads.length ? Math.round((reservations.length / leads.length) * 100) : 0;
  const myClosed = reservations.filter((r) => ["Confirmed", "Checked In", "Completed"].includes(r.status)).length;
  const queueBacklog = tasksDue.length + atRisk.length + pendingReservations;
  const opsSla = Math.max(58, 96 - queueBacklog * 2);
  const revivalQueue = atRisk.map((item) => ({
    ...item,
    revivalScore: Math.min(98, item.ai.urgencyScore + (item.lead.stage === "Negotiation" ? 12 : 4)),
    expectedRecoveryValue: Math.round(item.lead.budget * 2.4),
    suggestedFollowUp: item.ai.revivalRecommendation ?? item.ai.nextBestAction
  }));
  const bookingRiskAlerts = [
    ...reservations.filter((r) => r.paymentStatus !== "Paid").slice(0, 4).map((reservation) => ({
      severity: "high",
      title: "Deposit still pending",
      detail: `${reservation.status} reservation needs payment confirmation.`,
      value: reservation.depositAmount - reservation.depositPaid
    })),
    ...scored.filter((item) => item.lead.stage === "Tour Done" && item.ai.stale).slice(0, 4).map((item) => ({
      severity: "medium",
      title: "Tour completed without follow-up",
      detail: `${item.lead.name} needs a same-day close attempt.`,
      value: item.lead.budget
    }))
  ];
  const demandZones = pressure.reduce<Record<string, { zone: string; pressure: number; properties: number }>>((acc, item) => {
    const zone = item.property.locality;
    acc[zone] ??= { zone, pressure: 0, properties: 0 };
    acc[zone].pressure += item.pressure.score;
    acc[zone].properties += 1;
    return acc;
  }, {});
  const demandHeatmap = Object.values(demandZones)
    .map((zone) => ({ ...zone, pressure: Math.round(zone.pressure / zone.properties), growth: Math.round(Math.max(2, zone.pressure / Math.max(zone.properties, 1) / 5)) }))
    .sort((a, b) => b.pressure - a.pressure);
  const agentBoard = await Lead.aggregate([
    { $match: role === "Sales Agent" ? { assignedAgent: leads[0]?.assignedAgent?._id } : {} },
    { $group: { _id: "$assignedAgent", leads: { $sum: 1 }, won: { $sum: { $cond: [{ $eq: ["$stage", "Closed Won"] }, 1, 0] } }, avgScore: { $avg: "$aiScore" } } },
    { $limit: 6 }
  ]);

  ok(res, {
    role,
    kpis: {
      activeLeads,
      conversionRate,
      toursScheduled: visitsToday.length,
      revenueClosed,
      occupancyRate,
      followupsDue: tasksDue.length,
      leadsAtRisk: atRisk.length,
      totalRevenue: revenueClosed,
      monthlyRevenueGrowth: 18,
      activeReservations: reservations.length,
      highRiskProperties,
      revenuePipeline: Math.round(scored.filter((item) => item.ai.urgencyScore > 60).reduce((sum, item) => sum + item.lead.budget * 2, 0)),
      leadToBookingRatio,
      overdueFollowups: tasksDue.length,
      toursPending: visitsToday.filter((visit) => visit.status === "Scheduled").length,
      unassignedLeads,
      reservationsAwaitingConfirmation: pendingReservations,
      operationsSla: opsSla,
      followupCompletionRate: Math.max(62, 100 - tasksDue.length * 3),
      queueBacklog,
      leadEscalations: atRisk.length,
      myLeads: activeLeads,
      myConversionRate: conversionRate,
      activeNegotiations: negotiations,
      reservationsClosed: myClosed,
      tasksPending: tasksDue.length,
      personalRevenueClosed: revenueClosed
    },
    funnel: ["New", "Contacted", "Tour Scheduled", "Tour Done", "Negotiation", "Reserved", "Closed Won"].map((stage) => ({
      stage,
      value: leads.filter((lead) => stage === "Closed Won" ? lead.stage === "Closed Won" : lead.stage === stage).length
    })),
    revenueTrend: buildRevenueTrend(reservations),
    propertyPerformance: pressure.slice(0, 8),
    hotPipeline,
    toursToday: visitsToday,
    overdueFollowups: tasksDue,
    aiInsights: scored.slice(0, 10).map((item) => ({ lead: item.lead, ...item.ai })),
    operationsFeed: feed,
    revivalQueue,
    inventoryPressure: pressure,
    bookingRiskAlerts,
    demandHeatmap,
    agentBoard,
    quickActions:
      role === "Admin"
        ? ["Add Property", "Create Reservation", "Manage Users", "Export Analytics", "Assign Leads", "Generate Report"]
        : role === "Sales Ops"
          ? ["Assign Lead", "Schedule Tour", "Reassign Agent", "Trigger Follow-up", "Escalate Lead", "Create Task"]
          : ["Call Lead", "Update Status", "Add Note", "Schedule Follow-up", "Complete Tour", "Send Reservation Link"],
    roleFocus:
      role === "Admin"
        ? {
            title: "Founder Command Center",
            subtitle: "Revenue, occupancy, expansion pressure, and performance forecasting across the business.",
            primaryWidget: "Revenue Forecast Engine",
            insightTitle: "AI Business Insights"
          }
        : role === "Sales Ops"
          ? {
              title: "Operations Control Room",
              subtitle: "Queues, SLA drift, follow-up discipline, handoffs, and booking bottlenecks.",
              primaryWidget: "Smart Follow-up Engine",
              insightTitle: "Lead Escalation Alerts"
            }
          : {
              title: "My Closing Workspace",
              subtitle: "Assigned leads, tour prep, reminders, next best actions, and personal conversion targets.",
              primaryWidget: "Lead Priority Engine",
              insightTitle: "Next Best Actions"
            }
  });
});

function buildRevenueTrend(reservations: any[]) {
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (7 - i) * 7);
    return { key: `W${i + 1}`, start: date, revenue: 0 };
  });
  reservations.forEach((reservation) => {
    const created = new Date(reservation.createdAt ?? Date.now()).getTime();
    const index = weeks.findIndex((week, i) => {
      const next = weeks[i + 1]?.start?.getTime() ?? Date.now() + 86400000;
      return created >= week.start.getTime() && created < next;
    });
    if (index >= 0) weeks[index].revenue += Number(reservation.depositPaid ?? 0) + Number(reservation.monthlyRent ?? 0);
  });
  let carry = 0;
  return weeks.map((week) => {
    carry += week.revenue;
    return { month: week.key, revenue: carry };
  });
}
