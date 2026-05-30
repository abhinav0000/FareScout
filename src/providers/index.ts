import { config } from "../config.js";
import type { FareProvider } from "./fareProvider.js";
import { MockFareProvider } from "./mockFareProvider.js";
import { RedbusPlaywrightFareProvider } from "./redbusPlaywrightFareProvider.js";

export function createFareProvider(): FareProvider {
  switch (config.FARE_PROVIDER) {
    case "mock":
      return new MockFareProvider();
    case "redbus-playwright":
      return new RedbusPlaywrightFareProvider();
  }
}
