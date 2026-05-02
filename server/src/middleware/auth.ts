import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { Role } from "../types.js";
import { AppError } from "../utils/AppError.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: Role;
        name: string;
        email: string;
      };
    }
  }
}

type JwtPayload = { id: string };

export async function protect(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next(new AppError("Authentication required", 401));

  const token = header.replace("Bearer ", "");
  const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;
  const user = await User.findById(decoded.id);
  if (!user || !user.active) return next(new AppError("Invalid session", 401));

  req.user = {
    id: user.id,
    role: user.role as Role,
    name: user.name,
    email: user.email
  };
  next();
}

export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError("You do not have access to this resource", 403));
    }
    next();
  };
}
