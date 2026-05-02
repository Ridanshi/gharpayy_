import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { authRoutes } from "./routes/authRoutes.js";
import { leadRoutes } from "./routes/leadRoutes.js";
import { resourceRoutes } from "./routes/resourceRoutes.js";
import { errorHandler, notFound } from "./middleware/error.js";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));
app.use(rateLimit({ windowMs: 60_000, limit: 300 }));

app.get("/health", (_req, res) => res.json({ ok: true, service: "flowops-api" }));
app.use("/api/auth", authRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api", resourceRoutes);

app.use(notFound);
app.use(errorHandler);
