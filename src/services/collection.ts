import { buildForecast } from "../forecast/forecastEngine.js";
import type { FareProvider } from "../providers/fareProvider.js";
import { prisma } from "../db.js";
import { summarizeFareResult } from "./fareSnapshots.js";
import { scheduleNextCollection, tripToSearch } from "./trips.js";

export async function collectFareForTrip(tripId: string, provider: FareProvider) {
  const trip = await prisma.trackedTrip.findUnique({
    where: { id: tripId },
    include: {
      snapshots: {
        orderBy: { observedAt: "asc" },
        take: 30
      }
    }
  });

  if (!trip || trip.status !== "ACTIVE") {
    return null;
  }

  const result = await provider.searchFares(tripToSearch(trip));
  const summary = summarizeFareResult(result, trip.journeyDate);

  const snapshot = await prisma.fareSnapshot.create({
    data: {
      tripId: trip.id,
      provider: summary.provider,
      lowestFarePaise: summary.lowestFarePaise,
      medianFarePaise: summary.medianFarePaise,
      busCount: summary.busCount,
      availableSeats: summary.availableSeats,
      operatorName: summary.operatorName,
      observedAt: summary.observedAt,
      hoursToDeparture: summary.hoursToDeparture,
      raw: JSON.parse(JSON.stringify(summary.raw))
    }
  });

  const snapshots = [...trip.snapshots, snapshot];
  const forecast = buildForecast(trip.journeyDate, snapshots);
  const storedForecast = await prisma.forecast.create({
    data: {
      tripId: trip.id,
      currentFarePaise: forecast.currentFarePaise,
      predictedLowestFarePaise: forecast.predictedLowestFarePaise,
      expectedBestWindow: forecast.expectedBestWindow,
      confidence: forecast.confidence,
      recommendation: forecast.recommendation,
      reasoning: forecast.reasoning
    }
  });

  await scheduleNextCollection(trip.id);

  return {
    trip,
    snapshot,
    forecast,
    storedForecast
  };
}
