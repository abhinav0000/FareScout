import Fastify from "fastify";
import formBody from "@fastify/formbody";
import { webhookCallback } from "grammy";
import { config, isTelegramConfigured } from "./config.js";
import { logger } from "./logger.js";
import { prisma } from "./db.js";
import { createBot } from "./bot/bot.js";
import { enqueueFareCollection } from "./queues.js";

const app = Fastify({
  loggerInstance: logger
});

await app.register(formBody);

app.get("/health", async () => ({
  ok: true,
  service: "bus-fare-predictor-bot"
}));

app.post("/admin/collect-due", async () => {
  const trips = await prisma.trackedTrip.findMany({
    where: {
      status: "ACTIVE",
      nextCollectionAt: {
        lte: new Date()
      }
    },
    select: {
      id: true
    },
    take: 500
  });

  await Promise.all(trips.map((trip) => enqueueFareCollection(trip.id)));
  return {
    enqueued: trips.length
  };
});

if (isTelegramConfigured) {
  const bot = createBot();
  app.post("/telegram/webhook", webhookCallback(bot, "fastify"));

  if (config.PUBLIC_WEBHOOK_URL) {
    await bot.api.setWebhook(`${config.PUBLIC_WEBHOOK_URL}/telegram/webhook`);
    logger.info("Telegram webhook configured");
  }
} else {
  logger.warn("TELEGRAM_BOT_TOKEN is not set; Telegram webhook is disabled.");
}

try {
  await app.listen({
    port: config.PORT,
    host: "0.0.0.0"
  });
} catch (error) {
  logger.error(error);
  process.exit(1);
}
