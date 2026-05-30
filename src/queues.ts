import { Queue } from "bullmq";
import { config } from "./config.js";

const redisUrl = new URL(config.REDIS_URL);

export const redisConnection = {
  host: redisUrl.hostname,
  port: Number(redisUrl.port || 6379),
  username: redisUrl.username || undefined,
  password: redisUrl.password || undefined,
  maxRetriesPerRequest: null
};

export const fareCollectionQueue = new Queue<{ tripId: string }, void, "collect">("fare-collection", {
  connection: redisConnection
});

export async function enqueueFareCollection(tripId: string) {
  await fareCollectionQueue.add(
    "collect",
    { tripId },
    {
      jobId: `collect-${tripId}`,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 30_000
      },
      removeOnComplete: 100,
      removeOnFail: 100
    }
  );
}
