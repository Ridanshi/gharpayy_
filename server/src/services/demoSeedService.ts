import { User } from "../models/User.js";

const demoUsers = [
  {
    name: "Ananya Rao",
    email: "admin@flowops.ai",
    password: "FlowOps@123",
    role: "Admin",
    region: "Bengaluru",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Ananya%20Rao"
  },
  {
    name: "Kabir Mehta",
    email: "ops@flowops.ai",
    password: "FlowOps@123",
    role: "Sales Ops",
    region: "Bengaluru East",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Kabir%20Mehta"
  },
  {
    name: "Meera Iyer",
    email: "agent@flowops.ai",
    password: "FlowOps@123",
    role: "Sales Agent",
    region: "Bengaluru South",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Meera%20Iyer"
  }
] as const;

export async function ensureDemoUsers() {
  const existing = await User.find({ email: { $in: demoUsers.map((user) => user.email) } }).select("email");
  const existingEmails = new Set(existing.map((user) => user.email));
  const missingUsers = demoUsers.filter((user) => !existingEmails.has(user.email));

  if (!missingUsers.length) {
    console.log("Demo users already present");
    return;
  }

  await User.create(missingUsers.map((user) => ({ ...user, active: true })));
  console.log(`Seeded ${missingUsers.length} demo user${missingUsers.length === 1 ? "" : "s"}`);
}
