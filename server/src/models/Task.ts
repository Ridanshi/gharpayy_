import mongoose, { InferSchemaType } from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    lead: { type: mongoose.Schema.Types.ObjectId, ref: "Lead", index: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    dueAt: { type: Date, required: true, index: true },
    priority: { type: String, enum: ["Low", "Medium", "High", "Urgent"], default: "Medium" },
    status: { type: String, enum: ["Open", "Done", "Overdue"], default: "Open", index: true }
  },
  { timestamps: true }
);

export type TaskDocument = InferSchemaType<typeof taskSchema>;
export const Task = mongoose.model("Task", taskSchema);
