import { describe, expect, it } from "vitest";
import { formatDateOnly, formatRedbusDate, parseDateOnly } from "../src/domain/dateOnly.js";

describe("dateOnly helpers", () => {
  it("round trips a user-entered journey date without timezone drift", () => {
    const date = parseDateOnly("2026-06-04");

    expect(formatDateOnly(date)).toBe("2026-06-04");
    expect(formatRedbusDate(date)).toBe("04-Jun-2026");
  });
});
