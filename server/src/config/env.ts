import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT ?? 8080),
  mongoUri: process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/flowops-ai",
  jwtSecret: process.env.JWT_SECRET ?? "dev-flowops-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:5173"
};
