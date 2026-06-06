import { describe, expect, it } from "vitest";
import { BusType, SeatType } from "../src/domain/enums.js";
import { buildRedbusSearchUrl } from "../src/providers/redbusPlaywrightFareProvider.js";

describe("buildRedbusSearchUrl", () => {
  it("builds a redBus /search URL with city IDs and the onward date", () => {
    const url = buildRedbusSearchUrl({
      sourceCity: "Gurdaspur",
      destinationCity: "gurugram",
      journeyDate: new Date(Date.UTC(2026, 5, 4, 12, 0, 0, 0)),
      seatType: SeatType.SLEEPER,
      busType: BusType.AC
    });
    const parsedUrl = new URL(url);

    expect(`${parsedUrl.origin}${parsedUrl.pathname}`).toBe("https://www.redbus.in/search");
    expect(parsedUrl.searchParams.get("fromCityName")).toBe("Gurdaspur");
    expect(parsedUrl.searchParams.get("fromCityId")).toBe("65832");
    expect(parsedUrl.searchParams.get("srcCountry")).toBe("IND");
    expect(parsedUrl.searchParams.get("fromCityType")).toBe("CITY");
    expect(parsedUrl.searchParams.get("toCityName")).toBe("Gurugram (Gurgaon)");
    expect(parsedUrl.searchParams.get("toCityId")).toBe("70015");
    expect(parsedUrl.searchParams.get("destCountry")).toBe("IND");
    expect(parsedUrl.searchParams.get("toCityType")).toBe("CITY");
    expect(parsedUrl.searchParams.get("onward")).toBe("04-Jun-2026");
    expect(parsedUrl.searchParams.get("doj")).toBe("04-Jun-2026");
    expect(parsedUrl.searchParams.get("ref")).toBe("modifySearch");
  });
});
