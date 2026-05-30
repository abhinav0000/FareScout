import { differenceInHours } from "date-fns";
import type { FareSearchResult, FareSnapshotInput } from "../domain/types.js";
import { median } from "../domain/normalize.js";

export function summarizeFareResult(result: FareSearchResult, journeyDate: Date): FareSnapshotInput {
  if (result.options.length === 0) {
    throw new Error("No fare options returned by provider.");
  }

  const fares = result.options.map((option) => option.farePaise);
  const cheapest = result.options.reduce((best, option) => (option.farePaise < best.farePaise ? option : best), result.options[0]!);

  return {
    provider: result.provider,
    lowestFarePaise: cheapest.farePaise,
    medianFarePaise: median(fares),
    busCount: result.options.length,
    availableSeats: result.options.reduce((sum, option) => sum + option.availableSeats, 0),
    operatorName: cheapest.operatorName,
    observedAt: result.searchedAt,
    hoursToDeparture: Math.max(0, differenceInHours(journeyDate, result.searchedAt)),
    raw: result
  };
}
