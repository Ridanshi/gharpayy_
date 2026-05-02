import { connectDb } from "../config/db.js";
import { Activity } from "../models/Activity.js";
import { Lead } from "../models/Lead.js";
import { Note } from "../models/Note.js";
import { Notification } from "../models/Notification.js";
import { Property } from "../models/Property.js";
import { Reservation } from "../models/Reservation.js";
import { Task } from "../models/Task.js";
import { User } from "../models/User.js";
import { Visit } from "../models/Visit.js";
import { scoreLead } from "../services/aiService.js";

const names = ["Aarav Sharma", "Diya Nair", "Rohan Verma", "Saanvi Rao", "Ishaan Gupta", "Anika Menon", "Kabir Singh", "Myra Kapoor", "Vivaan Reddy", "Tara Iyer", "Arjun Shah", "Nisha Patel", "Reyansh Jain", "Avni Kulkarni", "Dev Malhotra", "Kiara Bhat", "Yash Agarwal", "Aisha Khan", "Neil Dsouza", "Riya Chatterjee"];
const locations = ["Koramangala", "HSR Layout", "Indiranagar", "Whitefield", "Marathahalli", "BTM Layout", "Bellandur", "Electronic City", "Jayanagar", "Manyata Tech Park"];
const stages = ["New", "Contacted", "Tour Scheduled", "Tour Done", "Negotiation", "Reserved", "Closed Won", "Closed Lost"];
const amenities = ["WiFi", "Meals", "Laundry", "Housekeeping", "Power Backup", "Gym", "Security", "Parking", "Study Lounge", "Rooftop Cafe"];

function pick<T>(items: T[]) {
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

async function seed() {
  await connectDb();
  await Promise.all([User.deleteMany({}), Lead.deleteMany({}), Property.deleteMany({}), Reservation.deleteMany({}), Visit.deleteMany({}), Task.deleteMany({}), Note.deleteMany({}), Notification.deleteMany({}), Activity.deleteMany({})]);

  const users = await User.create([
    { name: "Ananya Rao", email: "admin@flowops.ai", password: "FlowOps@123", role: "Admin", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Ananya%20Rao", region: "Bengaluru" },
    { name: "Kabir Mehta", email: "ops@flowops.ai", password: "FlowOps@123", role: "Sales Ops", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Kabir%20Mehta", region: "Bengaluru East" },
    { name: "Meera Iyer", email: "agent@flowops.ai", password: "FlowOps@123", role: "Sales Agent", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Meera%20Iyer", region: "Bengaluru South" }
  ]);

  const properties = await Property.create(
    Array.from({ length: 20 }, (_, i) => {
      const locality = pick(locations);
      const averageRent = 9500 + Math.round(Math.random() * 11500);
      return {
        name: `${["Nest", "Urban", "Cove", "Hive", "Casa"][i % 5]} ${locality} ${i + 1}`,
        locality,
        city: "Bengaluru",
        address: `${12 + i}, ${locality} Main Road`,
        gender: pick(["Male", "Female", "Co-living"]),
        manager: pick(users)._id,
        images: [
          "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80"
        ],
        amenities: amenities.sort(() => 0.5 - Math.random()).slice(0, 6),
        averageRent,
        rooms: Array.from({ length: 8 }, (_, r) => {
          const bedCount = pick([1, 2, 3]);
          const occupiedBeds = Math.min(bedCount, Math.floor(Math.random() * (bedCount + 1)));
          return {
            label: `${String.fromCharCode(65 + Math.floor(r / 4))}-${101 + r}`,
            occupancyType: bedCount === 1 ? "Single" : bedCount === 2 ? "Double" : "Triple",
            rent: averageRent + (bedCount === 1 ? 5500 : bedCount === 2 ? 1200 : -900),
            deposit: averageRent * 2,
            bedCount,
            occupiedBeds,
            status: occupiedBeds === bedCount ? "Occupied" : "Available"
          };
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

  const leads = [];
  for (let i = 0; i < 50; i += 1) {
    const viewed = properties.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 4));
    const stage = pick(stages);
    const lead = new Lead({
      name: names[i % names.length],
      email: `lead${i + 1}@example.com`,
      phone: `+91 9${Math.floor(100000000 + Math.random() * 899999999)}`,
      source: pick(["Website", "WhatsApp", "MagicBricks", "Referral", "Walk-in"]),
      stage,
      budget: 9000 + Math.round(Math.random() * 13000),
      preferredLocation: pick(locations),
      moveInDate: days(3 + Math.round(Math.random() * 40)),
      occupancyPreference: pick(["Single", "Double", "Triple"]),
      genderPreference: pick(["Male", "Female", "Any"]),
      assignedAgent: pick(users)._id,
      tags: [pick(["High intent", "Budget sensitive", "Urgent move-in", "Parent involved", "IT corridor"])],
      nextFollowUpAt: days(-2 + Math.round(Math.random() * 7)),
      lastContactedAt: days(-Math.round(Math.random() * 6)),
      lastActivityAt: days(-Math.round(Math.random() * 6)),
      propertiesViewed: viewed.map((p) => p._id),
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

  await Note.create(leads.slice(0, 18).map((lead) => ({ lead: lead._id, author: pick(users)._id, body: "Qualified move-in timeline, budget ceiling, and preferred commute corridor. Shared two recommended PG options." })));
  await Task.create(leads.slice(0, 26).map((lead, i) => ({ title: i % 3 === 0 ? "Revive inactive lead" : "Confirm tour slot", lead: lead._id, owner: lead.assignedAgent, dueAt: days(-2 + (i % 8)), priority: i % 4 === 0 ? "Urgent" : "High", status: i % 5 === 0 ? "Overdue" : "Open" })));
  await Visit.create(leads.slice(0, 22).map((lead, i) => ({ lead: lead._id, property: pick(properties)._id, agent: lead.assignedAgent, scheduledAt: tourSlot((i % 9) - 2, i), status: pick(["Scheduled", "Checked In", "Completed", "No Show"]), feedback: i % 2 === 0 ? "Liked room quality, asked for deposit flexibility." : undefined, rating: i % 2 === 0 ? 4 : undefined })));
  await Reservation.create(leads.slice(0, 15).map((lead) => {
    const property = pick(properties);
    const room = pick(property.rooms);
    return { lead: lead._id, property: property._id, roomId: room._id, assignedAgent: lead.assignedAgent, status: pick(["Reserved", "Deposit Pending", "Confirmed", "Checked In", "Completed"]), monthlyRent: room.rent, depositAmount: room.deposit, depositPaid: Math.random() > 0.4 ? room.deposit : Math.round(room.deposit / 2), paymentStatus: Math.random() > 0.4 ? "Paid" : "Partial", moveInDate: lead.moveInDate };
  }));

  await Activity.create(leads.slice(0, 30).map((lead, i) => ({ type: pick(["tour.scheduled", "lead.reassigned", "booking.confirmed", "payment.received", "followup.overdue"]), title: pick(["Tour scheduled", "Lead reassigned", "Booking confirmed", "Payment received", "Follow-up overdue"]), description: "Operational event generated from seed activity.", actor: pick(users)._id, lead: lead._id, property: pick(properties)._id, createdAt: days(-Math.round(i / 3)) })));
  await Notification.create(users.map((user) => ({ user: user._id, title: "High-intent queue ready", body: "FlowOps AI found fresh leads with strong booking intent.", type: "insight" })));

  console.log("Seed complete: demo users, 50 leads, 20 properties, 15 reservations.");
  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
