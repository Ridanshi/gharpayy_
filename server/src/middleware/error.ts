import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError.js";

export function notFound(req: Request, _res: Response, next: NextFunction) {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  const status = err instanceof AppError ? err.statusCode : 500;
  res.status(status).json({
    success: false,
    message: err.message || "Something went wrong"
  });
}
