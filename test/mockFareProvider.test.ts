import { describe, expect, it } from "vitest";
import { BusType, SeatType } from "../src/domain/enums.js";
import { MockFareProvider } from "../src/providers/mockFareProvider.js";

describe("MockFareProvider", () => {
  it("returns plausible fare options", async () => {
    const provider = new MockFareProvider();
    const result = await provider.searchFares({
      sourceCity: "Mumbai",
      destinationCity: "Pune",
      journeyDate: new Date("2026-06-12T00:00:00.000Z"),
      seatType: SeatType.SLEEPER,
      busType: BusType.AC
    });

    expect(result.provider).toBe("mock");
    expect(result.options.length).toBeGreaterThan(0);
    expect(result.options.every((option) => option.farePaise > 0)).toBe(true);
  });
});
