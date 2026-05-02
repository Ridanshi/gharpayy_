import mongoose, { InferSchemaType } from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    lead: { type: mongoose.Schema.Types.ObjectId, ref: "Lead", required: true, index: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true },
    attachments: [String],
    pinned: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export type NoteDocument = InferSchemaType<typeof noteSchema>;
export const Note = mongoose.model("Note", noteSchema);
