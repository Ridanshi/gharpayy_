import mongoose, { InferSchemaType } from "mongoose";

const reservationSchema = new mongoose.Schema(
  {
    lead: { type: mongoose.Schema.Types.ObjectId, ref: "Lead", required: true, index: true },
    property: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true, index: true },
    roomId: { type: mongoose.Schema.Types.ObjectId, required: true },
    assignedAgent: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["Reserved", "Deposit Pending", "Confirmed", "Checked In", "Completed"],
      default: "Reserved",
      index: true
    },
    monthlyRent: { type: Number, required: true },
    depositAmount: { type: Number, required: true },
    depositPaid: { type: Number, default: 0 },
    paymentStatus: { type: String, enum: ["Pending", "Partial", "Paid"], default: "Pending" },
    moveInDate: Date,
    confirmedAt: Date
  },
  { timestamps: true }
);

export type ReservationDocument = InferSchemaType<typeof reservationSchema>;
export const Reservation = mongoose.model("Reservation", reservationSchema);
