import { Bot, Context, InputFile } from "grammy";
import { TripStatus } from "../domain/enums.js";
import { config } from "../config.js";
import { prisma } from "../db.js";
import { parseTrackCommand } from "../domain/tripParser.js";
import { buildForecast } from "../forecast/forecastEngine.js";
import { renderForecastChart } from "../charts/forecastChart.js";
import { enqueueFareCollection } from "../queues.js";
import { cancelTripForUser, createTrackedTrip, upsertTelegramUser } from "../services/trips.js";
import { forecastMessage, helpMessage, tripCreatedMessage } from "./messages.js";

export function createBot(): Bot {
  if (!config.TELEGRAM_BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN is required to create the Telegram bot.");
  }

  const bot = new Bot(config.TELEGRAM_BOT_TOKEN);

  bot.command("start", async (ctx) => {
    await ensureUser(ctx);
    await ctx.reply(helpMessage());
  });

  bot.command("help", async (ctx) => {
    await ctx.reply(helpMessage());
  });

  bot.command("track", async (ctx) => {
    const user = await ensureUser(ctx);
    try {
      const parsed = parseTrackCommand(ctx.message?.text ?? "");
      const trip = await createTrackedTrip(user.id, parsed);
      await enqueueFareCollection(trip.id);
      await ctx.reply(tripCreatedMessage(trip));
    } catch (error) {
      await ctx.reply(error instanceof Error ? error.message : "Could not create tracked trip.");
    }
  });

  bot.command("trips", async (ctx) => {
    const user = await ensureUser(ctx);
    const trips = await prisma.trackedTrip.findMany({
      where: {
        userId: user.id,
        status: TripStatus.ACTIVE
      },
      orderBy: { createdAt: "desc" },
      take: 20
    });

    if (trips.length === 0) {
      await ctx.reply("No active trips yet. Add one with /track Mumbai Pune 2026-06-12 sleeper ac 18:00-23:59");
      return;
    }

    await ctx.reply(
      trips
        .map((trip: { id: string; sourceCity: string; destinationCity: string; journeyDate: Date }) => `${trip.id}: ${trip.sourceCity} -> ${trip.destinationCity} on ${trip.journeyDate.toISOString().slice(0, 10)}`)
        .join("\n")
    );
  });

  bot.command("forecast", async (ctx) => {
    const user = await ensureUser(ctx);
    const tripId = commandArgument(ctx.message?.text);
    if (!tripId) {
      await ctx.reply("Usage: /forecast <trip_id>");
      return;
    }

    const trip = await prisma.trackedTrip.findFirst({
      where: {
        id: tripId,
        userId: user.id
      },
      include: {
        snapshots: {
          orderBy: { observedAt: "asc" },
          take: 30
        }
      }
    });

    if (!trip) {
      await ctx.reply("Trip not found.");
      return;
    }

    if (trip.snapshots.length === 0) {
      await enqueueFareCollection(trip.id);
      await ctx.reply("No fare observations yet. I queued the first collection job.");
      return;
    }

    const forecast = buildForecast(trip.journeyDate, trip.snapshots);
    const chart = await renderForecastChart(forecast);
    await ctx.reply(forecastMessage(forecast));
    await ctx.replyWithPhoto(new InputFile(chart, `forecast-${trip.id}.png`));
  });

  bot.command("untrack", async (ctx) => {
    const user = await ensureUser(ctx);
    const tripId = commandArgument(ctx.message?.text);
    if (!tripId) {
      await ctx.reply("Usage: /untrack <trip_id>");
      return;
    }

    const result = await cancelTripForUser(tripId, user.id);
    await ctx.reply(result.count > 0 ? "Tracking stopped." : "Trip not found.");
  });

  bot.catch(async (error) => {
    await error.ctx.reply("Something went wrong. Please try again in a moment.");
  });

  return bot;
}

async function ensureUser(ctx: Context) {
  const from = ctx.from;
  if (!from) {
    throw new Error("Telegram user is missing from context.");
  }

  return upsertTelegramUser({
    telegramId: from.id,
    username: from.username,
    firstName: from.first_name
  });
}

function commandArgument(text?: string): string | undefined {
  const [, argument] = (text ?? "").trim().split(/\s+/, 2);
  return argument;
}
