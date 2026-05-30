import { describe, expect, it } from "vitest";
import { BusType, SeatType } from "../src/domain/enums.js";
import { buildRedbusSearchUrl } from "../src/providers/redbusPlaywrightFareProvider.js";

describe("buildRedbusSearchUrl", () => {
  it("builds a redBus route URL with the onward date", () => {
    const url = buildRedbusSearchUrl({
      sourceCity: "Mumbai",
      destinationCity: "Pune",
      journeyDate: new Date("2026-06-12T00:00:00.000+05:30"),
      seatType: SeatType.SLEEPER,
      busType: BusType.AC
    });

    expect(url).toContain("https://www.redbus.in/bus-tickets/mumbai-to-pune");
    expect(url).toContain("fromCityName=Mumbai");
    expect(url).toContain("toCityName=Pune");
    expect(url).toContain("onward=12-Jun-2026");
  });
});
