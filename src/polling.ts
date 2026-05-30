import { createBot } from "./bot/bot.js";
import { logger } from "./logger.js";

const bot = createBot();

void bot.start({
  onStart: (info) => {
    logger.info({ username: info.username }, "bot polling started");
  }
});
