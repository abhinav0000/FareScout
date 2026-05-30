import { describe, expect, it } from "vitest";
import { renderForecastChart } from "../src/charts/forecastChart.js";

describe("renderForecastChart", () => {
  it("renders a PNG buffer", async () => {
    const buffer = await renderForecastChart({
      currentFarePaise: 120000,
      predictedLowestFarePaise: 105000,
      expectedBestWindow: "3-7 days before departure",
      confidence: 0.7,
      recommendation: "WAIT",
      reasoning: "Test forecast",
      points: [
        { label: "Now", farePaise: 120000 },
        { label: "Jun 1", farePaise: 105000 },
        { label: "Jun 2", farePaise: 112000 }
      ]
    });

    expect(buffer.length).toBeGreaterThan(1000);
    expect(buffer.subarray(1, 4).toString("ascii")).toBe("PNG");
  });
});
