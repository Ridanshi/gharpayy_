import { Activity } from "../models/Activity.js";
import { Lead } from "../models/Lead.js";
import { Note } from "../models/Note.js";
import { Notification } from "../models/Notification.js";
import { Property } from "../models/Property.js";
import { Reservation } from "../models/Reservation.js";
import { Task } from "../models/Task.js";
import { User } from "../models/User.js";
import { Visit } from "../models/Visit.js";
import { scoreLead } from "./aiService.js";

const names = ["Aarav Sharma", "Diya Nair", "Rohan Verma", "Saanvi Rao", "Ishaan Gupta", "Anika Menon", "Kabir Singh", "Myra Kapoor", "Vivaan Reddy", "Tara Iyer", "Arjun Shah", "Nisha Patel", "Reyansh Jain", "Avni Kulkarni", "Dev Malhotra", "Kiara Bhat", "Yash Agarwal", "Aisha Khan", "Neil Dsouza", "Riya Chatterjee"];
const locations = ["Koramangala", "HSR Layout", "Indiranagar", "Whitefield", "Marathahalli", "BTM Layout", "Bellandur", "Electronic City", "Jayanagar", "Manyata Tech Park"];
const stages = ["New", "Contacted", "Tour Scheduled", "Tour Done", "Negotiation", "Reserved", "Closed Won", "Closed Lost"] as const;
const amenities = ["WiFi", "Meals", "Laundry", "Housekeeping", "Power Backup", "Gym", "Security", "Parking", "Study Lounge", "Rooftop Cafe"];
const images = [
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80"
];

function pick<T>(items: readonly T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function days(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date;
}

function tourSlot(offset: number, index: number) {
  const date = days(offset);
  const hours = [9, 10, 11, 14, 15, 16, 18, 19];
  date.setHours(hours[index % hours.length], (index * 17) % 60, 0, 0);
  return date;
}

export async function ensureBusinessDemoData() {
  const users = await User.find({ active: true }).sort({ role: 1 });
  if (!users.length) {
    console.log("Business demo seed skipped: no auth users found");
    return;
  }

  let properties = await Property.find();
  if (await Property.countDocuments() === 0) {
    properties = await seedProperties(users);
    console.log(`Seeded ${properties.length} demo properties`);
  }

  let leads = await Lead.find();
  if (await Lead.countDocuments() === 0) {
    leads = await seedLeads(users, properties);
    console.log(`Seeded ${leads.length} demo leads`);
  }

  if (properties.length === 0 || leads.length === 0) {
    console.log("Business demo seed skipped related records: properties or leads unavailable");
    return;
  }

  if (await Note.countDocuments() === 0) {
    await Note.create(leads.slice(0, 18).map((lead) => ({ lead: lead._id, author: pick(users)._id, body: "Qualified move-in timeline, budget ceiling, and preferred commute corridor. Shared two recommended PG options." })));
    console.log("Seeded demo notes");
  }

  if (await Task.countDocuments() === 0) {
    await Task.create(leads.slice(0, 26).map((lead, index) => ({ title: index % 3 === 0 ? "Revive inactive lead" : "Confirm tour slot", lead: lead._id, owner: lead.assignedAgent ?? pick(users)._id, dueAt: days(-2 + (index % 8)), priority: index % 4 === 0 ? "Urgent" : "High", status: index % 5 === 0 ? "Overdue" : "Open" })));
    console.log("Seeded demo tasks");
  }

  if (await Visit.countDocuments() === 0) {
    await Visit.create(leads.slice(0, 24).map((lead, index) => ({ lead: lead._id, property: pick(properties)._id, agent: lead.assignedAgent ?? pick(users)._id, scheduledAt: tourSlot((index % 9) - 2, index), status: pick(["Scheduled", "Checked In", "Completed", "No Show"] as const), feedback: index % 2 === 0 ? "Liked room quality, asked for deposit flexibility." : undefined, rating: index % 2 === 0 ? 4 : undefined })));
    console.log("Seeded demo visits");
  }

  if (await Reservation.countDocuments() === 0) {
    await Reservation.create(leads.slice(0, 15).map((lead) => {
      const property = pick(properties);
      const room = pick(property.rooms);
      return { lead: lead._id, property: property._id, roomId: room._id, assignedAgent: lead.assignedAgent ?? pick(users)._id, status: pick(["Reserved", "Deposit Pending", "Confirmed", "Checked In", "Completed"] as const), monthlyRent: room.rent, depositAmount: room.deposit, depositPaid: Math.random() > 0.4 ? room.deposit : Math.round(room.deposit / 2), paymentStatus: Math.random() > 0.4 ? "Paid" : "Partial", moveInDate: lead.moveInDate };
    }));
    console.log("Seeded demo reservations");
  }

  if (await Activity.countDocuments() === 0) {
    await Activity.create(leads.slice(0, 32).map((lead, index) => ({ type: pick(["tour.scheduled", "lead.reassigned", "booking.confirmed", "payment.received", "followup.overdue"] as const), title: pick(["Tour scheduled", "Lead reassigned", "Booking confirmed", "Payment received", "Follow-up overdue"] as const), description: "Operational event generated from demo activity.", actor: pick(users)._id, lead: lead._id, property: pick(properties)._id, createdAt: days(-Math.round(index / 3)) })));
    console.log("Seeded demo activity feed");
  }

  if (await Notification.countDocuments() === 0) {
    await Notification.create(users.map((user) => ({ user: user._id, title: "High-intent queue ready", body: "FlowOps AI found fresh leads with strong booking intent.", type: "insight" })));
    console.log("Seeded demo notifications");
  }
}

async function seedProperties(users: any[]) {
  return Property.create(
    Array.from({ length: 20 }, (_, index) => {
      const locality = pick(locations);
      const averageRent = 9500 + Math.round(Math.random() * 11500);
      return {
        name: `${["Nest", "Urban", "Cove", "Hive", "Casa"][index % 5]} ${locality} ${index + 1}`,
        locality,
        city: "Bengaluru",
        address: `${12 + index}, ${locality} Main Road`,
        landmark: `Near ${pick(["Metro Station", "Tech Park", "Bus Depot", "Market", "College Gate"])}`,
        description: "Managed PG with furnished rooms, predictable operations, and strong demand from working professionals.",
        status: pick(["Active", "Filling", "Full", "Maintenance"] as const),
        propertyType: pick(["PG", "Co-living", "Hostel", "Apartment"] as const),
        gender: pick(["Male", "Female", "Co-living"] as const),
        manager: pick(users)._id,
        images: images.slice(0, 2),
        amenities: amenities.sort(() => 0.5 - Math.random()).slice(0, 6),
        tags: [pick(["Near metro", "IT corridor", "Premium", "Budget", "Fast filling"] as const)],
        averageRent,
        rooms: Array.from({ length: 8 }, (_, roomIndex) => {
          const bedCount = pick([1, 2, 3] as const);
          const occupiedBeds = Math.min(bedCount, Math.floor(Math.random() * (bedCount + 1)));
          return { label: `${String.fromCharCode(65 + Math.floor(roomIndex / 4))}-${101 + roomIndex}`, occupancyType: bedCount === 1 ? "Single" : bedCount === 2 ? "Double" : "Triple", rent: averageRent + (bedCount === 1 ? 5500 : bedCount === 2 ? 1200 : -900), deposit: averageRent * 2, bedCount, occupiedBeds, status: occupiedBeds === bedCount ? "Occupied" : "Available" };
        }),
        inquiryVolume: 20 + Math.round(Math.random() * 80),
        tourVolume: 8 + Math.round(Math.random() * 36),
        bookingVelocity: 2 + Math.round(Math.random() * 10),
        conversionScore: 35 + Math.round(Math.random() * 60),
        demandScore: 30 + Math.round(Math.random() * 65),
        pricingPressure: 35 + Math.round(Math.random() * 60),
        rating: Number((4 + Math.random()).toFixed(1))
      };
    })
  );
}

async function seedLeads(users: any[], properties: any[]) {
  const leads = [];
  for (let index = 0; index < 50; index += 1) {
    const viewed = properties.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 4));
    const stage = pick(stages);
    const lead = new Lead({
      name: names[index % names.length],
      email: `lead${index + 1}@example.com`,
      phone: `+91 9${Math.floor(100000000 + Math.random() * 899999999)}`,
      source: pick(["Website", "WhatsApp", "MagicBricks", "Referral", "Walk-in"] as const),
      stage,
      budget: 9000 + Math.round(Math.random() * 13000),
      preferredLocation: pick(locations),
      moveInDate: days(3 + Math.round(Math.random() * 40)),
      occupancyPreference: pick(["Single", "Double", "Triple"] as const),
      genderPreference: pick(["Male", "Female", "Any"] as const),
      assignedAgent: pick(users)._id,
      tags: [pick(["High intent", "Budget sensitive", "Urgent move-in", "Parent involved", "IT corridor"] as const)],
      nextFollowUpAt: days(-2 + Math.round(Math.random() * 7)),
      lastContactedAt: days(-Math.round(Math.random() * 6)),
      lastActivityAt: days(-Math.round(Math.random() * 6)),
      propertiesViewed: viewed.map((property) => property._id),
      pricingViews: Math.round(Math.random() * 5),
      statusHistory: [{ stage, changedBy: pick(users)._id, changedAt: days(-Math.round(Math.random() * 10)) }],
      activity: [
        { type: "lead.created", title: "Lead captured from inbound channel", actor: pick(users)._id, createdAt: days(-8) },
        { type: "lead.engaged", title: "Pricing and availability shared", actor: pick(users)._id, createdAt: days(-3) }
      ]
    });
    const ai = scoreLead(lead.toObject());
    lead.aiScore = ai.urgencyScore;
    lead.conversionProbability = ai.conversionProbability;
    leads.push(await lead.save());
  }
  return leads;
}
