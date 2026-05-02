import mongoose, { InferSchemaType } from "mongoose";

const visitSchema = new mongoose.Schema(
  {
    lead: { type: mongoose.Schema.Types.ObjectId, ref: "Lead", required: true, index: true },
    property: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true, index: true },
    agent: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    scheduledAt: { type: Date, required: true, index: true },
    status: { type: String, enum: ["Scheduled", "Checked In", "Completed", "No Show", "Cancelled"], default: "Scheduled" },
    feedback: String,
    rating: Number,
    reminderSent: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export type VisitDocument = InferSchemaType<typeof visitSchema>;
export const Visit = mongoose.model("Visit", visitSchema);
