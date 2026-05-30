import { Worker } from "bullmq";
import { redisConnection } from "./queues.js";
import { logger } from "./logger.js";
import { createFareProvider } from "./providers/index.js";
import { collectFareForTrip } from "./services/collection.js";

const provider = createFareProvider();

const worker = new Worker<{ tripId: string }>(
  "fare-collection",
  async (job) => {
    const result = await collectFareForTrip(job.data.tripId, provider);
    logger.info({ tripId: job.data.tripId, collected: Boolean(result) }, "fare collection complete");
  },
  {
    connection: redisConnection,
    concurrency: 5
  }
);

worker.on("failed", (job, error) => {
  logger.error(
    {
      jobId: job?.id,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    },
    "fare collection failed"
  );
});

logger.info("fare collection worker started");
