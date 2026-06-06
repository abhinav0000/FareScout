import { describe, expect, it } from "vitest";
import { resolveRedbusCity } from "../src/providers/redbusCityMap.js";

describe("resolveRedbusCity", () => {
  it("resolves Gurugram aliases to redBus canonical city metadata", () => {
    expect(resolveRedbusCity("gurugram")).toMatchObject({
      id: "70015",
      name: "Gurugram (Gurgaon)"
    });

    expect(resolveRedbusCity("gurgaon")).toMatchObject({
      id: "70015",
      name: "Gurugram (Gurgaon)"
    });
  });

  it("throws a helpful error for unknown cities", () => {
    expect(() => resolveRedbusCity("Atlantis")).toThrow("redBus city not configured: Atlantis");
  });
});
