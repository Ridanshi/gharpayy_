import { Activity } from "../models/Activity.js";
import { Lead } from "../models/Lead.js";
import { Property } from "../models/Property.js";
import { Reservation } from "../models/Reservation.js";
import { Task } from "../models/Task.js";
import { User } from "../models/User.js";
import { Visit } from "../models/Visit.js";
import { pressureIndex } from "../services/aiService.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { created, ok } from "../utils/apiResponse.js";

export const listUsers = asyncHandler(async (_req, res) => ok(res, await User.find().select("-password").sort({ role: 1 })));
export const listActivity = asyncHandler(async (_req, res) => ok(res, await Activity.find().populate("actor lead property reservation").sort({ createdAt: -1 }).limit(40)));
export const createActivity = asyncHandler(async (req, res) => {
  const activity = await Activity.create({
    type: req.body.type ?? "system.event",
    title: req.body.title,
    description: req.body.description,
    actor: req.user?.id,
    lead: req.body.lead,
    property: req.body.property,
    reservation: req.body.reservation
  });
  created(res, activity);
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select("-password");
  await Activity.create({ type: "user.updated", title: "User access updated", description: `${user?.name} updated`, actor: req.user?.id });
  ok(res, user);
});

export const listProperties = asyncHandler(async (_req, res) => {
  const properties = await Property.find().populate("manager", "name avatar").sort({ createdAt: -1, demandScore: -1 });
  ok(res, properties.map((property) => ({ ...property.toObject(), pressure: pressureIndex(property.toObject()) })));
});

export const createProperty = asyncHandler(async (req, res) => {
  const name = String(req.body.name ?? "").trim();
  const locality = String(req.body.locality ?? "").trim();
  const address = String(req.body.address ?? "").trim();
  const landmark = String(req.body.landmark ?? "").trim();
  if (name.length < 2) throw new AppError("Property name is required", 400);
  if (locality.length < 2) throw new AppError("Area is required", 400);
  if (address.length < 4) throw new AppError("Address is required", 400);
  const averageRent = Number(req.body.averageRent ?? 14500);
  const totalRooms = Number(req.body.totalRooms ?? req.body.rooms ?? 6);
  if (!Number.isFinite(averageRent) || averageRent <= 0) throw new AppError("Monthly rent must be greater than 0", 400);
  if (!Number.isInteger(totalRooms) || totalRooms <= 0) throw new AppError("Total rooms must be a positive whole number", 400);
  const occupiedRooms = Math.min(totalRooms, Number(req.body.occupiedRooms ?? 0));
  const availableRooms = Math.max(0, Number(req.body.availableRooms ?? totalRooms - occupiedRooms));
  if (occupiedRooms < 0 || availableRooms < 0 || occupiedRooms + availableRooms > totalRooms) throw new AppError("Invalid room occupancy values", 400);
  const amenities = typeof req.body.amenities === "string" ? req.body.amenities.split(",").map((item: string) => item.trim()).filter(Boolean) : req.body.amenities;
  const tags = Array.isArray(req.body.tags) ? req.body.tags.map((item: string) => String(item).trim()).filter(Boolean) : typeof req.body.tags === "string" ? req.body.tags.split(",").map((item: string) => item.trim()).filter(Boolean) : [];
  const property = await Property.create({
    name,
    locality,
    city: req.body.city ?? "Bengaluru",
    address,
    landmark,
    description: String(req.body.description ?? "").trim(),
    status: req.body.status ?? "Active",
    propertyType: req.body.propertyType ?? "PG",
    gender: req.body.gender ?? "Co-living",
    manager: req.user?.id,
    images: req.body.images?.length ? req.body.images : [],
    amenities: amenities?.length ? amenities : ["WiFi", "Meals", "Laundry", "Security"],
    tags,
    averageRent,
    inquiryVolume: Math.max(12, availableRooms * 5 + Math.round(Math.random() * 12)),
    tourVolume: Math.max(4, occupiedRooms + Math.round(Math.random() * 6)),
    bookingVelocity: Math.max(1, Math.round(occupiedRooms / 2)),
    conversionScore: Math.min(92, 44 + occupiedRooms * 4),
    demandScore: Math.min(94, 48 + availableRooms * 3 + occupiedRooms * 2),
    pricingPressure: Math.min(88, 42 + occupiedRooms * 3),
    rooms: Array.from({ length: totalRooms }, (_, i) => {
      const occupied = i < occupiedRooms;
      return {
      label: `A-${101 + i}`,
      occupancyType: i % 3 === 0 ? "Single" : i % 3 === 1 ? "Double" : "Triple",
      rent: averageRent,
      deposit: averageRent * 2,
      bedCount: 1,
      occupiedBeds: occupied ? 1 : 0,
      status: occupied ? "Occupied" : "Available"
    };
    })
  });
  await Activity.create({ type: "property.created", title: "Property added", description: property.name, actor: req.user?.id, property: property.id });
  created(res, { ...property.toObject(), pressure: pressureIndex(property.toObject()) });
});

export const getProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id).populate("manager", "name avatar");
  ok(res, property ? { ...property.toObject(), pressure: pressureIndex(property.toObject()) } : null);
});

export const updateProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) return ok(res, null);
  if (typeof req.body.markFull === "boolean") {
    property.rooms.forEach((room: any) => {
      room.occupiedBeds = req.body.markFull ? room.bedCount : 0;
      room.status = req.body.markFull ? "Occupied" : "Available";
    });
    property.status = req.body.markFull ? "Full" : "Active";
  }
  if (typeof req.body.occupiedRooms === "number") {
    property.rooms.forEach((room: any, index: number) => {
      const occupied = index < Number(req.body.occupiedRooms);
      room.occupiedBeds = occupied ? room.bedCount : 0;
      room.status = occupied ? "Occupied" : "Available";
    });
  }
  if (req.body.status && !("markFull" in req.body)) property.status = req.body.status;
  await property.save();
  await Activity.create({ type: "property.updated", title: "Property occupancy updated", description: property.name, actor: req.user?.id, property: property.id });
  ok(res, { ...property.toObject(), pressure: pressureIndex(property.toObject()) });
});

export const listVisits = asyncHandler(async (req, res) => ok(res, await Visit.find(req.user?.role === "Sales Agent" ? { agent: req.user.id } : {}).populate("lead property agent").sort({ scheduledAt: 1 }).limit(100)));
export const updateVisit = asyncHandler(async (req, res) => {
  const visit = await Visit.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate("lead property agent");
  if (visit) {
    const leadId = (visit.lead as any)?._id ?? visit.lead;
    await Activity.create({ type: "visit.updated", title: `Visit ${visit.status}`, description: req.body.feedback, actor: req.user?.id, lead: visit.lead, property: visit.property });
    await Lead.findByIdAndUpdate(leadId, {
      ...(visit.status === "Completed" ? { stage: "Tour Done" } : {}),
      lastActivityAt: new Date(),
      $push: {
        activity: {
          type: "visit.updated",
          title: `Visit ${visit.status}`,
          description: req.body.feedback ?? `Tour marked ${visit.status}`,
          actor: req.user?.id,
          createdAt: new Date()
        }
      }
    });
  }
  ok(res, visit);
});

export const listReservations = asyncHandler(async (req, res) => ok(res, await Reservation.find(req.user?.role === "Sales Agent" ? { assignedAgent: req.user.id } : {}).populate("lead property assignedAgent").sort({ createdAt: -1 }).limit(100)));
export const createReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.create(req.body);
  await Lead.findByIdAndUpdate(reservation.lead, { stage: "Reserved", lastActivityAt: new Date() });
  await Activity.create({ type: "booking.created", title: "Reservation created", reservation: reservation.id, lead: reservation.lead, property: reservation.property, actor: req.user?.id });
  created(res, reservation);
});
export const updateReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate("lead property assignedAgent");
  if (reservation) {
    await Activity.create({ type: "reservation.updated", title: `Reservation ${reservation.status}`, description: `Payment ${reservation.paymentStatus}`, reservation: reservation.id, lead: reservation.lead, property: reservation.property, actor: req.user?.id });
  }
  ok(res, reservation);
});

export const listTasks = asyncHandler(async (_req, res) => ok(res, await Task.find().populate("lead owner").sort({ dueAt: 1 }).limit(100)));
export const createTask = asyncHandler(async (req, res) => {
  const task = await Task.create({ title: req.body.title, lead: req.body.lead, owner: req.body.owner ?? req.user?.id, dueAt: req.body.dueAt, priority: req.body.priority ?? "High" });
  await Activity.create({ type: "task.created", title: "Task created", description: task.title, actor: req.user?.id, lead: task.lead });
  created(res, await task.populate("lead owner"));
});

export const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate("lead owner");
  if (task) await Activity.create({ type: "task.updated", title: `Task ${task.status}`, description: task.title, actor: req.user?.id, lead: task.lead });
  ok(res, task);
});

export const listAnalytics = asyncHandler(async (_req, res) => {
  ok(res, {
    sources: [
      { source: "Website", leads: 18, conversion: 34 },
      { source: "WhatsApp", leads: 14, conversion: 41 },
      { source: "MagicBricks", leads: 9, conversion: 27 },
      { source: "Referral", leads: 6, conversion: 52 },
      { source: "Walk-in", leads: 3, conversion: 46 }
    ],
    agents: [
      { name: "Ananya Rao", won: 11, tours: 22, revenue: 428000 },
      { name: "Kabir Mehta", won: 9, tours: 18, revenue: 374000 },
      { name: "Meera Iyer", won: 7, tours: 16, revenue: 315000 }
    ],
    bookings: Array.from({ length: 12 }, (_, i) => ({ month: `M${i + 1}`, bookings: 8 + Math.round(Math.sin(i / 2) * 4 + i), occupancy: 62 + i * 2 }))
  });
});
