import { addHours } from "date-fns";
import { config } from "../config.js";
import { BusType, SeatType, TripStatus } from "../domain/enums.js";
import { normalizeCity } from "../domain/normalize.js";
import type { ParsedTrackCommand } from "../domain/tripParser.js";
import { prisma } from "../db.js";

export async function upsertTelegramUser(input: {
  telegramId: number;
  username?: string;
  firstName?: string;
}) {
  return prisma.telegramUser.upsert({
    where: {
      telegramId: BigInt(input.telegramId)
    },
    update: {
      username: input.username,
      firstName: input.firstName
    },
    create: {
      id: `tg_${input.telegramId}`,
      telegramId: BigInt(input.telegramId),
      username: input.username,
      firstName: input.firstName
    }
  });
}

export async function createTrackedTrip(userId: string, parsed: ParsedTrackCommand) {
  const activeCount = await prisma.trackedTrip.count({
    where: {
      userId,
      status: TripStatus.ACTIVE
    }
  });

  if (activeCount >= config.MAX_ACTIVE_TRIPS_PER_USER) {
    throw new Error(`You can track up to ${config.MAX_ACTIVE_TRIPS_PER_USER} active trips.`);
  }

  return prisma.trackedTrip.create({
    data: {
      userId,
      sourceCity: parsed.sourceCity,
      destinationCity: parsed.destinationCity,
      normalizedSource: normalizeCity(parsed.sourceCity),
      normalizedDest: normalizeCity(parsed.destinationCity),
      journeyDate: parsed.journeyDate,
      seatType: parsed.seatType ?? SeatType.ANY,
      busType: parsed.busType ?? BusType.ANY,
      departureWindow: parsed.departureWindow,
      preferredOperator: parsed.preferredOperator,
      nextCollectionAt: new Date()
    }
  });
}

export async function scheduleNextCollection(tripId: string) {
  return prisma.trackedTrip.update({
    where: { id: tripId },
    data: {
      nextCollectionAt: addHours(new Date(), config.COLLECTION_INTERVAL_HOURS)
    }
  });
}

export async function cancelTripForUser(tripId: string, userId: string) {
  return prisma.trackedTrip.updateMany({
    where: {
      id: tripId,
      userId
    },
    data: {
      status: TripStatus.CANCELLED
    }
  });
}

export function tripToSearch(trip: {
  sourceCity: string;
  destinationCity: string;
  journeyDate: Date;
  seatType: SeatType;
  busType: BusType;
  departureWindow: string | null;
  preferredOperator: string | null;
}) {
  return {
    sourceCity: trip.sourceCity,
    destinationCity: trip.destinationCity,
    journeyDate: trip.journeyDate,
    seatType: trip.seatType,
    busType: trip.busType,
    departureWindow: trip.departureWindow ?? undefined,
    preferredOperator: trip.preferredOperator ?? undefined
  };
}
