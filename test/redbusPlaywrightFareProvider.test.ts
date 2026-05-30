import { describe, expect, it } from "vitest";
import { BusType, SeatType } from "../src/domain/enums.js";
import { buildRedbusSearchUrl } from "../src/providers/redbusPlaywrightFareProvider.js";

describe("buildRedbusSearchUrl", () => {
  it("builds a redBus route URL with the onward date", () => {
    const url = buildRedbusSearchUrl({
      sourceCity: "Mumbai",
      destinationCity: "Pune",
      journeyDate: new Date(Date.UTC(2026, 5, 12, 12, 0, 0, 0)),
      seatType: SeatType.SLEEPER,
      busType: BusType.AC
    });

    expect(url).toContain("https://www.redbus.in/bus-tickets/mumbai-to-pune");
    expect(url).toContain("fromCityName=Mumbai");
    expect(url).toContain("toCityName=Pune");
    expect(url).toContain("onward=12-Jun-2026");
    expect(url).toContain("doj=12-Jun-2026");
  });
});
