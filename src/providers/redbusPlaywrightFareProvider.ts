import { chromium, type Browser, type Page } from "playwright";
import { formatRedbusDate } from "../domain/dateOnly.js";
import { BusType, SeatType } from "../domain/enums.js";
import type { FareOption, FareSearchResult, TripSearch } from "../domain/types.js";
import { config } from "../config.js";
import type { FareProvider } from "./fareProvider.js";
import { resolveRedbusCity, type RedbusCity } from "./redbusCityMap.js";

type ExtractedBus = {
  operatorName?: string;
  departureTime?: string;
  fareText?: string;
  seatsText?: string;
  busTypeText?: string;
};

export class RedbusPlaywrightFareProvider implements FareProvider {
  readonly name = "redbus-playwright";

  async searchFares(search: TripSearch): Promise<FareSearchResult> {
    const browser = await chromium.launch({
      headless: config.REDBUS_HEADLESS
    });

    try {
      const page = await browser.newPage({
        viewport: {
          width: 1366,
          height: 900
        },
        locale: "en-IN",
        timezoneId: "Asia/Kolkata"
      });

      page.setDefaultTimeout(config.REDBUS_TIMEOUT_MS);
      const url = buildRedbusSearchUrl(search);
      const expectedDate = formatRedbusDate(search.journeyDate);
      await openSearchPage(page, url);
      await dismissPopups(page);
      await assertExpectedJourneyDate(page, expectedDate);
      await page.waitForTimeout(2500);

      const extracted = await extractBusCards(page);
      const options = extracted
        .map((bus) => toFareOption(bus, search))
        .filter((option): option is FareOption => Boolean(option))
        .filter((option) => matchesPreferences(option, search));

      if (options.length === 0) {
        throw new Error(`redBus returned no parseable fares for ${search.sourceCity} -> ${search.destinationCity}. The page may be blocked, empty, or changed.`);
      }

      return {
        provider: this.name,
        searchedAt: new Date(),
        options
      };
    } finally {
      await closeBrowser(browser);
    }
  }
}

export function buildRedbusSearchUrl(search: TripSearch): string {
  const source = resolveRedbusCity(search.sourceCity);
  const destination = resolveRedbusCity(search.destinationCity);
  const onward = formatRedbusDate(search.journeyDate);
  const url = new URL("https://www.redbus.in/search");
  setCitySearchParams(url, "from", source);
  url.searchParams.set("srcCountry", source.country);
  setCitySearchParams(url, "to", destination);
  url.searchParams.set("destCountry", destination.country);
  url.searchParams.set("onward", onward);
  url.searchParams.set("doj", onward);
  url.searchParams.set("ref", "modifySearch");
  return url.toString();
}

function setCitySearchParams(url: URL, direction: "from" | "to", city: RedbusCity): void {
  const prefix = direction === "from" ? "fromCity" : "toCity";
  url.searchParams.set(`${prefix}Name`, city.name);
  url.searchParams.set(`${prefix}Id`, city.id);
  url.searchParams.set(`${prefix}Type`, city.type);
}

async function openSearchPage(page: Page, url: string): Promise<void> {
  await page.goto(url, {
    waitUntil: "commit",
    timeout: config.REDBUS_TIMEOUT_MS
  });

  await page.waitForSelector("body", {
    timeout: Math.min(config.REDBUS_TIMEOUT_MS, 15_000)
  });

  await page.waitForLoadState("domcontentloaded", {
    timeout: Math.min(config.REDBUS_TIMEOUT_MS, 15_000)
  }).catch(() => undefined);
}

async function dismissPopups(page: Page): Promise<void> {
  const labels = ["No thanks", "Not now", "Maybe later", "Close", "Skip"];
  for (const label of labels) {
    const button = page.getByText(label, { exact: false }).first();
    if (await button.isVisible().catch(() => false)) {
      await button.click().catch(() => undefined);
    }
  }

  const closeSelectors = [
    "[aria-label='Close']",
    "[class*='close']",
    "[class*='Close']",
    ".modalClose",
    ".icon-close"
  ];

  for (const selector of closeSelectors) {
    const closeButton = page.locator(selector).first();
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click().catch(() => undefined);
    }
  }
}

async function assertExpectedJourneyDate(page: Page, expectedDate: string): Promise<void> {
  const finalUrl = page.url();
  const parsedUrl = new URL(finalUrl);
  const urlDates = [parsedUrl.searchParams.get("onward"), parsedUrl.searchParams.get("doj")].filter(Boolean);

  if (urlDates.length > 0 && !urlDates.includes(expectedDate)) {
    throw new Error(`redBus changed the journey date. Expected ${expectedDate}, final URL: ${finalUrl}`);
  }

  const bodyText = await page.locator("body").innerText({ timeout: 10_000 }).catch(() => "");
  const visibleDateMatch = bodyText.match(/\b\d{1,2}\s+[A-Z][a-z]{2},\s+\d{4}\b/);
  if (!visibleDateMatch) {
    return;
  }

  const expectedVisibleDate = expectedDate.replace(/^0/, "").replace(/-/g, " ").replace(/(\w{3}) (\d{4})$/, "$1, $2");
  if (visibleDateMatch[0] !== expectedVisibleDate) {
    throw new Error(`redBus changed the visible journey date. Expected ${expectedVisibleDate}, saw ${visibleDateMatch[0]}, final URL: ${finalUrl}`);
  }
}

async function extractBusCards(page: Page): Promise<ExtractedBus[]> {
  const cardResults = await page.evaluate(() => {
    const selectors = [
      "li.bus-item",
      "div.bus-item",
      "[class*='bus-item']",
      "[class*='clearfix'][class*='row']"
    ];

    const cards = uniqueElements(selectors.flatMap((selector) => Array.from(document.querySelectorAll<HTMLElement>(selector))));

    const extracted: ExtractedBus[] = [];

    for (const card of cards) {
      const text = normalizeText(card.innerText);
      if (!text || !/(\u20b9|INR|rs\.?|\bseats?\b|\btravels\b)/i.test(text)) {
        continue;
      }

      extracted.push({
        operatorName: textFrom(card, [".travels", "[class*='travels']", "[class*='operator']", "[class*='name']"]),
        departureTime: textFrom(card, [".dp-time", "[class*='dp-time']", "[class*='departure']", "[class*='start-time']"]),
        fareText: textFrom(card, [".fare", "[class*='fare']", "[class*='price']"]) || firstMatch(text, /(\u20b9\s?[\d,]+|INR\s?[\d,]+|Rs\.?\s?[\d,]+)/i),
        seatsText: textFrom(card, ["[class*='seat']", "[class*='avail']"]) || firstMatch(text, /(\d+)\s+seats?\s+(available|left)/i),
        busTypeText: textFrom(card, [".bus-type", "[class*='bus-type']", "[class*='type']"]) || text
      });
    }

    return extracted;

    function uniqueElements(elements: HTMLElement[]): HTMLElement[] {
      return Array.from(new Set(elements));
    }

    function textFrom(root: HTMLElement, selectorsToTry: string[]): string | undefined {
      for (const selector of selectorsToTry) {
        const element = root.querySelector<HTMLElement>(selector);
        const text = element ? normalizeText(element.innerText) : "";
        if (text) {
          return text;
        }
      }
      return undefined;
    }

    function normalizeText(value: string): string {
      return value.replace(/\s+/g, " ").trim();
    }

    function firstMatch(value: string, pattern: RegExp): string | undefined {
      return value.match(pattern)?.[0];
    }
  });

  const textResults = extractFromVisibleText(await page.locator("body").innerText());
  return textResults.length > 0 ? textResults : cardResults;
}

function extractFromVisibleText(text: string): ExtractedBus[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const results: ExtractedBus[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const fareLine = lines[index]!;
    if (!/^\u20b9[\d,]+$/.test(fareLine)) {
      continue;
    }

    const nearbyBefore = lines.slice(Math.max(0, index - 12), index);
    const nearbyAfter = lines.slice(index + 1, Math.min(lines.length, index + 12));
    const context = [...nearbyBefore, ...nearbyAfter].join(" ");
    if (/starting from/i.test(context) || !/\bOnwards\b/i.test(context)) {
      continue;
    }

    const seatsText = [...nearbyBefore].reverse().find((line) => /\b\d+\s+Seats?\b/i.test(line));
    const departureTime = nearbyBefore.find((line) => /^([01]?\d|2[0-3]):[0-5]\d$/.test(line));
    const busTypeText = nearbyAfter.find((line) => /(A\/C|AC|NON A\/C|NONAC|Sleeper|Seater|Volvo|Bharat Benz|Electric)/i.test(line));
    const operatorName = [...nearbyAfter, ...nearbyBefore].find(isLikelyOperatorName);

    results.push({
      fareText: fareLine,
      seatsText,
      departureTime,
      busTypeText,
      operatorName
    });
  }

  return results;
}

function isLikelyOperatorName(line: string): boolean {
  if (line.length < 3 || line.length > 80 || /^show buses$/i.test(line) || /^onwards$/i.test(line)) {
    return false;
  }

  if (/^\u20b9[\d,]+$/.test(line) || /^([01]?\d|2[0-3]):[0-5]\d$/.test(line) || /\b\d+\s+Seats?\b/i.test(line)) {
    return false;
  }

  return /(travels|bus|express|tour|link|vrl|srs|orange|intercity|ksrtc|transport|metrolink|maharaja|mahalaxmi|shree)/i.test(line);
}

function toFareOption(bus: ExtractedBus, search: TripSearch): FareOption | null {
  const farePaise = parseFarePaise(bus.fareText);
  if (!farePaise) {
    return null;
  }

  const busType = inferBusType(bus.busTypeText);
  const seatType = inferSeatType(bus.busTypeText);

  return {
    operatorName: bus.operatorName || "Unknown operator",
    departureTime: parseDepartureTime(bus.departureTime) || "00:00",
    farePaise,
    availableSeats: parseAvailableSeats(bus.seatsText) ?? 1,
    busType: busType ?? (search.busType === BusType.ANY ? BusType.ANY : search.busType),
    seatType: seatType ?? (search.seatType === SeatType.ANY ? SeatType.ANY : search.seatType)
  };
}

function parseFarePaise(value?: string): number | undefined {
  if (!value) {
    return undefined;
  }

  const match = value.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  if (!match) {
    return undefined;
  }

  return Math.round(Number(match[1]) * 100);
}

function parseAvailableSeats(value?: string): number | undefined {
  if (!value) {
    return undefined;
  }

  const match = value.match(/(\d+)/);
  return match ? Number(match[1]) : undefined;
}

function parseDepartureTime(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const match = value.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (!match) {
    return undefined;
  }

  return `${match[1]!.padStart(2, "0")}:${match[2]}`;
}

function inferBusType(value?: string): BusType | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.toLowerCase();
  if (/\bnon[-\s]?a\/?c\b|\bnon[-\s]?ac\b/.test(normalized)) {
    return BusType.NON_AC;
  }
  if (/\ba\/?c\b|\bac\b|volvo|scania|bharatbenz/.test(normalized)) {
    return BusType.AC;
  }
  return undefined;
}

function inferSeatType(value?: string): SeatType | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.toLowerCase();
  if (normalized.includes("sleeper")) {
    return SeatType.SLEEPER;
  }
  if (normalized.includes("seater") || normalized.includes("semi sleeper")) {
    return SeatType.SEATER;
  }
  return undefined;
}

function matchesPreferences(option: FareOption, search: TripSearch): boolean {
  const busTypeMatches = search.busType === BusType.ANY || option.busType === BusType.ANY || option.busType === search.busType;
  const seatTypeMatches = search.seatType === SeatType.ANY || option.seatType === SeatType.ANY || option.seatType === search.seatType;
  return busTypeMatches && seatTypeMatches;
}

async function closeBrowser(browser: Browser): Promise<void> {
  await browser.close().catch(() => undefined);
}
