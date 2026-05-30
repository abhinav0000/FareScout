import { describe, expect, it } from "vitest";
import { formatDateOnly } from "../src/domain/dateOnly.js";
import { BusType, SeatType } from "../src/domain/enums.js";
import { parseTrackCommand } from "../src/domain/tripParser.js";

describe("parseTrackCommand", () => {
  it("parses the core tracking command", () => {
    const parsed = parseTrackCommand("/track Mumbai Pune 2026-06-12 sleeper ac 18:00-23:59", new Date("2026-05-29T00:00:00.000Z"));

    expect(parsed.sourceCity).toBe("Mumbai");
    expect(parsed.destinationCity).toBe("Pune");
    expect(parsed.seatType).toBe(SeatType.SLEEPER);
    expect(parsed.busType).toBe(BusType.AC);
    expect(parsed.departureWindow).toBe("18:00-23:59");
    expect(formatDateOnly(parsed.journeyDate)).toBe("2026-06-12");
  });

  it("keeps the user-entered date stable instead of shifting by timezone", () => {
    const parsed = parseTrackCommand("/track Gurdaspur gurugram 2026-06-04 sleeper ac 18:00-23:59", new Date("2026-05-30T09:00:00.000Z"));

    expect(formatDateOnly(parsed.journeyDate)).toBe("2026-06-04");
  });

  it("rejects unsupported seat types", () => {
    expect(() => parseTrackCommand("/track Mumbai Pune 2026-06-12 cabin ac", new Date("2026-05-29T00:00:00.000Z"))).toThrow(
      "Seat type"
    );
  });
});
