import mongoose, { InferSchemaType } from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    occupancyType: { type: String, enum: ["Single", "Double", "Triple"], required: true },
    rent: { type: Number, required: true },
    deposit: { type: Number, required: true },
    bedCount: { type: Number, required: true },
    occupiedBeds: { type: Number, default: 0 },
    status: { type: String, enum: ["Available", "Reserved", "Occupied", "Maintenance"], default: "Available" }
  },
  { timestamps: true }
);

const propertySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, index: "text" },
    locality: { type: String, required: true, index: true },
    city: { type: String, default: "Bengaluru" },
    address: String,
    landmark: String,
    description: String,
    status: { type: String, enum: ["Active", "Filling", "Full", "Archived", "Maintenance"], default: "Active", index: true },
    propertyType: { type: String, enum: ["PG", "Co-living", "Hostel", "Apartment"], default: "PG" },
    gender: { type: String, enum: ["Male", "Female", "Co-living"], default: "Co-living" },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    images: [String],
    amenities: [String],
    tags: [String],
    rooms: [roomSchema],
    inquiryVolume: { type: Number, default: 0 },
    tourVolume: { type: Number, default: 0 },
    bookingVelocity: { type: Number, default: 0 },
    conversionScore: { type: Number, default: 50 },
    demandScore: { type: Number, default: 50 },
    pricingPressure: { type: Number, default: 50 },
    averageRent: { type: Number, default: 0 },
    rating: { type: Number, default: 4.4 }
  },
  { timestamps: true }
);

propertySchema.index({ locality: 1, demandScore: -1 });

export type PropertyDocument = InferSchemaType<typeof propertySchema>;
export const Property = mongoose.model("Property", propertySchema);
