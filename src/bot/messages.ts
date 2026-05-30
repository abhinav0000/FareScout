import type { ForecastResult } from "../domain/types.js";
import { formatDateOnly } from "../domain/dateOnly.js";
import { formatRupees } from "../domain/normalize.js";

type TrackedTripMessage = {
  id: string;
  sourceCity: string;
  destinationCity: string;
  journeyDate: Date;
  seatType: string;
  busType: string;
};

export function helpMessage(): string {
  return [
    "Track India intercity bus fares and get a buy/wait forecast.",
    "",
    "Commands:",
    "/track Mumbai Pune 2026-06-12 sleeper ac 18:00-23:59",
    "/trips",
    "/forecast <trip_id>",
    "/untrack <trip_id>",
    "",
    "Seat type: any, seater, sleeper",
    "Bus type: any, ac, non_ac"
  ].join("\n");
}

export function tripCreatedMessage(trip: TrackedTripMessage): string {
  return [
    "Tracking started.",
    `Trip ID: ${trip.id}`,
    `${trip.sourceCity} -> ${trip.destinationCity}`,
    `Journey date: ${formatDateOnly(trip.journeyDate)}`,
    `Preference: ${trip.seatType}, ${trip.busType}`,
    "I will check fares every 4-6 hours and forecast the best booking window."
  ].join("\n");
}

export function forecastMessage(forecast: ForecastResult): string {
  return [
    `Recommendation: ${forecast.recommendation === "BOOK_NOW" ? "BOOK NOW" : "WAIT"}`,
    `Current lowest fare: ${formatRupees(forecast.currentFarePaise)}`,
    `Predicted lowest fare: ${formatRupees(forecast.predictedLowestFarePaise)}`,
    `Best window: ${forecast.expectedBestWindow}`,
    `Confidence: ${Math.round(forecast.confidence * 100)}%`,
    "",
    forecast.reasoning
  ].join("\n");
}
