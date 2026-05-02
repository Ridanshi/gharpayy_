import mongoose, { InferSchemaType } from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    body: String,
    type: { type: String, default: "info" },
    readAt: Date
  },
  { timestamps: true }
);

export type NotificationDocument = InferSchemaType<typeof notificationSchema>;
export const Notification = mongoose.model("Notification", notificationSchema);
