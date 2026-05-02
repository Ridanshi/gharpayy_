import mongoose, { InferSchemaType } from "mongoose";

const activityEntry = new mongoose.Schema(
  {
    type: { type: String, required: true },
    title: { type: String, required: true },
    description: String,
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    metadata: mongoose.Schema.Types.Mixed,
    createdAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const leadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, index: "text" },
    email: { type: String, lowercase: true },
    phone: { type: String, required: true, index: true },
    source: { type: String, default: "Website" },
    stage: {
      type: String,
      enum: ["New", "Contacted", "Tour Scheduled", "Tour Done", "Negotiation", "Reserved", "Closed Won", "Closed Lost"],
      default: "New",
      index: true
    },
    budget: { type: Number, required: true },
    preferredLocation: { type: String, required: true, index: true },
    moveInDate: Date,
    occupancyPreference: { type: String, enum: ["Single", "Double", "Triple"], default: "Double" },
    genderPreference: { type: String, enum: ["Male", "Female", "Any"], default: "Any" },
    assignedAgent: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    tags: [String],
    aiScore: { type: Number, default: 50, index: true },
    conversionProbability: { type: Number, default: 0.35 },
    nextFollowUpAt: { type: Date, index: true },
    lastContactedAt: Date,
    lastActivityAt: { type: Date, default: Date.now, index: true },
    propertiesViewed: [{ type: mongoose.Schema.Types.ObjectId, ref: "Property" }],
    pricingViews: { type: Number, default: 0 },
    notesCount: { type: Number, default: 0 },
    lostReason: String,
    statusHistory: [
      {
        stage: String,
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        changedAt: { type: Date, default: Date.now }
      }
    ],
    activity: [activityEntry]
  },
  { timestamps: true }
);

leadSchema.index({ name: "text", phone: "text", email: "text", preferredLocation: "text" });
leadSchema.index({ stage: 1, aiScore: -1, nextFollowUpAt: 1 });

export type LeadDocument = InferSchemaType<typeof leadSchema>;
export const Lead = mongoose.model("Lead", leadSchema);
