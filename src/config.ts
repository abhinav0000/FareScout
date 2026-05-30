import "dotenv/config";
import { z } from "zod";

const configSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.string().default("info"),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  PUBLIC_WEBHOOK_URL: z.string().url().optional().or(z.literal("")),
  DATABASE_URL: z.string().default("postgresql://postgres:postgres@localhost:5432/bus_fare_bot?schema=public"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  FARE_PROVIDER: z.enum(["mock", "redbus-playwright"]).default("mock"),
  COLLECTION_INTERVAL_HOURS: z.coerce.number().min(4).max(6).default(6),
  MAX_ACTIVE_TRIPS_PER_USER: z.coerce.number().int().positive().default(10),
  REDBUS_HEADLESS: z
    .string()
    .default("false")
    .transform((value) => value.toLowerCase() === "true"),
  REDBUS_TIMEOUT_MS: z.coerce.number().int().positive().default(45_000)
});

export const config = configSchema.parse(process.env);

export const isTelegramConfigured = Boolean(config.TELEGRAM_BOT_TOKEN);
