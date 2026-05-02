import mongoose, { InferSchemaType } from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    type: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: String,
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    lead: { type: mongoose.Schema.Types.ObjectId, ref: "Lead" },
    property: { type: mongoose.Schema.Types.ObjectId, ref: "Property" },
    reservation: { type: mongoose.Schema.Types.ObjectId, ref: "Reservation" }
  },
  { timestamps: true }
);

activitySchema.index({ createdAt: -1 });

export type ActivityDocument = InferSchemaType<typeof activitySchema>;
export const Activity = mongoose.model("Activity", activitySchema);
