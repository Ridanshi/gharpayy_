import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { User } from "../models/User.js";
import { env } from "../config/env.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { ok } from "../utils/apiResponse.js";

function signToken(id: string) {
  return jwt.sign({ id }, env.jwtSecret, { expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"] });
}

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await (user as typeof user & { comparePassword(candidate: string): Promise<boolean> }).comparePassword(password))) {
    throw new AppError("Invalid email or password", 401);
  }
  ok(res, {
    token: signToken(user.id),
    user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar }
  });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?.id);
  ok(res, user);
});
