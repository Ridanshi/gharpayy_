import bcrypt from "bcrypt";
import mongoose, { InferSchemaType } from "mongoose";
import { Role } from "../types.js";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["Admin", "Sales Ops", "Sales Agent"] satisfies Role[], required: true },
    avatar: String,
    phone: String,
    region: String,
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

export type UserDocument = InferSchemaType<typeof userSchema> & {
  comparePassword(candidate: string): Promise<boolean>;
};

export const User = mongoose.model("User", userSchema);
