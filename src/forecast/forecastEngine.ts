import { differenceInHours, format } from "date-fns";
import type { Recommendation } from "../domain/enums.js";
import type { ForecastPoint, ForecastResult } from "../domain/types.js";

type SnapshotLike = {
  lowestFarePaise: number;
  medianFarePaise: number;
  availableSeats: number;
  busCount: number;
  observedAt: Date;
  hoursToDeparture: number;
};

export function buildForecast(journeyDate: Date, snapshots: SnapshotLike[], now = new Date()): ForecastResult {
  if (snapshots.length === 0) {
    throw new Error("At least one fare snapshot is required to build a forecast.");
  }

  const ordered = [...snapshots].sort((a, b) => a.observedAt.getTime() - b.observedAt.getTime());
  const latest = ordered[ordered.length - 1]!;
  const observedMinimum = Math.min(...ordered.map((snapshot) => snapshot.lowestFarePaise));
  const hoursToDeparture = Math.max(0, differenceInHours(journeyDate, now));
  const urgencyMultiplier = urgencyFloorMultiplier(hoursToDeparture);
  const trend = computeTrend(ordered);
  const availabilityPressure = computeAvailabilityPressure(latest);
  const predictedLowestFarePaise = Math.round(Math.min(
    latest.lowestFarePaise,
    observedMinimum,
    latest.lowestFarePaise * urgencyMultiplier * trend
  ));
  const savingPaise = latest.lowestFarePaise - predictedLowestFarePaise;
  const savingRatio = savingPaise / latest.lowestFarePaise;
  const confidence = computeConfidence(ordered.length, hoursToDeparture, availabilityPressure);
  const recommendation: Recommendation = savingRatio >= 0.08 && availabilityPressure < 0.7 && hoursToDeparture > 24 ? "WAIT" : "BOOK_NOW";

  return {
    currentFarePaise: latest.lowestFarePaise,
    predictedLowestFarePaise,
    expectedBestWindow: expectedWindow(hoursToDeparture, recommendation),
    confidence,
    recommendation,
    reasoning: reasoning(recommendation, savingRatio, availabilityPressure, ordered.length),
    points: buildForecastPoints(latest.lowestFarePaise, predictedLowestFarePaise, hoursToDeparture)
  };
}

function computeTrend(snapshots: SnapshotLike[]): number {
  if (snapshots.length < 2) {
    return 0.97;
  }

  const first = snapshots[0]!;
  const latest = snapshots[snapshots.length - 1]!;
  const changeRatio = (latest.lowestFarePaise - first.lowestFarePaise) / first.lowestFarePaise;
  if (changeRatio > 0.08) {
    return 0.99;
  }
  if (changeRatio < -0.08) {
    return 0.94;
  }
  return 0.96;
}

function computeAvailabilityPressure(snapshot: SnapshotLike): number {
  if (snapshot.busCount <= 0) {
    return 1;
  }

  const estimatedCapacity = snapshot.busCount * 36;
  return Math.max(0, Math.min(1, 1 - snapshot.availableSeats / estimatedCapacity));
}

function urgencyFloorMultiplier(hoursToDeparture: number): number {
  if (hoursToDeparture <= 24) {
    return 1;
  }
  if (hoursToDeparture <= 72) {
    return 0.98;
  }
  if (hoursToDeparture <= 168) {
    return 0.95;
  }
  return 0.92;
}

function computeConfidence(sampleCount: number, hoursToDeparture: number, availabilityPressure: number): number {
  const sampleScore = Math.min(0.45, sampleCount * 0.06);
  const horizonScore = hoursToDeparture <= 168 ? 0.3 : 0.18;
  const availabilityPenalty = availabilityPressure > 0.8 ? 0.15 : 0;
  return Math.max(0.25, Math.min(0.9, 0.25 + sampleScore + horizonScore - availabilityPenalty));
}

function expectedWindow(hoursToDeparture: number, recommendation: Recommendation): string {
  if (recommendation === "BOOK_NOW") {
    return "Now";
  }

  if (hoursToDeparture > 168) {
    return "3-7 days before departure";
  }

  if (hoursToDeparture > 72) {
    return "24-72 hours before departure";
  }

  return "Next 24 hours";
}

function reasoning(recommendation: Recommendation, savingRatio: number, availabilityPressure: number, sampleCount: number): string {
  if (recommendation === "WAIT") {
    return `Waiting may save about ${Math.round(savingRatio * 100)}%; availability pressure is still moderate from ${sampleCount} observations.`;
  }

  if (availabilityPressure >= 0.7) {
    return "Availability pressure is high, so the chance of losing good options outweighs likely savings.";
  }

  return "Predicted savings from waiting are small, so booking now is the safer choice.";
}

function buildForecastPoints(currentFarePaise: number, predictedLowestFarePaise: number, hoursToDeparture: number): ForecastPoint[] {
  const pointCount = Math.min(7, Math.max(3, Math.ceil(hoursToDeparture / 24)));
  return Array.from({ length: pointCount }, (_, index) => {
    const progress = pointCount === 1 ? 1 : index / (pointCount - 1);
    const curve = Math.sin(progress * Math.PI);
    const farePaise = Math.round(currentFarePaise - (currentFarePaise - predictedLowestFarePaise) * curve);
    return {
      label: index === 0 ? "Now" : format(new Date(Date.now() + index * 24 * 60 * 60 * 1000), "MMM d"),
      farePaise
    };
  });
}
