import { describe, expect, it } from "vitest";
import { buildForecast } from "../src/forecast/forecastEngine.js";

describe("buildForecast", () => {
  it("recommends waiting when future savings are meaningful and availability is healthy", () => {
    const now = new Date("2026-05-29T00:00:00.000Z");
    const forecast = buildForecast(
      new Date("2026-06-12T00:00:00.000Z"),
      [
        snapshot(100000, 140, "2026-05-28T00:00:00.000Z"),
        snapshot(98000, 130, "2026-05-29T00:00:00.000Z")
      ],
      now
    );

    expect(forecast.recommendation).toBe("WAIT");
    expect(forecast.predictedLowestFarePaise).toBeLessThan(forecast.currentFarePaise);
  });

  it("recommends booking when seats are tight", () => {
    const now = new Date("2026-05-29T00:00:00.000Z");
    const forecast = buildForecast(
      new Date("2026-06-12T00:00:00.000Z"),
      [
        {
          ...snapshot(100000, 4, "2026-05-29T00:00:00.000Z"),
          busCount: 8
        }
      ],
      now
    );

    expect(forecast.recommendation).toBe("BOOK_NOW");
  });
});

function snapshot(lowestFarePaise: number, availableSeats: number, observedAt: string) {
  return {
    lowestFarePaise,
    medianFarePaise: lowestFarePaise + 12000,
    availableSeats,
    busCount: 8,
    observedAt: new Date(observedAt),
    hoursToDeparture: 300
  };
}
