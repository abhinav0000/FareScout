import { addDays, differenceInCalendarDays, format } from "date-fns";
import type { FareProvider } from "./fareProvider.js";
import type { FareOption, FareSearchResult, TripSearch } from "../domain/types.js";
import { normalizeCity } from "../domain/normalize.js";
import { BusType, SeatType } from "../domain/enums.js";

const operators = ["VRL Travels", "Orange Tours", "SRS Travels", "IntrCity SmartBus", "National Travels"];

export class MockFareProvider implements FareProvider {
  readonly name = "mock";

  async searchFares(search: TripSearch): Promise<FareSearchResult> {
    const seed = hash(`${normalizeCity(search.sourceCity)}:${normalizeCity(search.destinationCity)}:${format(search.journeyDate, "yyyy-MM-dd")}`);
    const daysOut = Math.max(0, differenceInCalendarDays(search.journeyDate, new Date()));
    const routeBase = 450 + (seed % 700);
    const demand = demandMultiplier(search.journeyDate, daysOut);
    const options: FareOption[] = Array.from({ length: 8 }, (_, index) => {
      const operatorSeed = seed + index * 37;
      const busType = search.busType === BusType.ANY ? (index % 3 === 0 ? BusType.NON_AC : BusType.AC) : search.busType;
      const seatType = search.seatType === SeatType.ANY ? (index % 2 === 0 ? SeatType.SLEEPER : SeatType.SEATER) : search.seatType;
      const seatPremium = seatType === SeatType.SLEEPER ? 180 : 0;
      const acPremium = busType === BusType.AC ? 120 : 0;
      const noise = (operatorSeed % 160) - 60;
      const fareRupees = Math.max(250, Math.round((routeBase + seatPremium + acPremium + noise) * demand));

      return {
        operatorName: operators[index % operators.length]!,
        departureTime: `${String(18 + (index % 6)).padStart(2, "0")}:00`,
        farePaise: fareRupees * 100,
        availableSeats: Math.max(1, 36 - Math.round(demand * 8) - index * 2),
        busType,
        seatType
      };
    });

    return {
      provider: this.name,
      searchedAt: new Date(),
      options
    };
  }
}

function demandMultiplier(journeyDate: Date, daysOut: number): number {
  const weekday = journeyDate.getDay();
  const weekendPremium = weekday === 5 || weekday === 6 || weekday === 0 ? 1.18 : 1;
  const urgencyPremium = daysOut <= 1 ? 1.35 : daysOut <= 3 ? 1.2 : daysOut <= 7 ? 1.08 : 1;
  const advanceDiscount = daysOut >= 21 ? 0.92 : 1;
  const festivalLikePremium = isFestivalLikeWindow(journeyDate) ? 1.28 : 1;
  return weekendPremium * urgencyPremium * advanceDiscount * festivalLikePremium;
}

function isFestivalLikeWindow(date: Date): boolean {
  const monthDay = format(date, "MM-dd");
  return ["01-14", "08-15", "10-02", "10-20", "10-21", "10-22", "12-25"].includes(monthDay);
}

function hash(value: string): number {
  let output = 0;
  for (const char of value) {
    output = (output * 31 + char.charCodeAt(0)) >>> 0;
  }
  return output;
}

export function futureMockSnapshots(search: TripSearch, count = 7): { date: Date; farePaise: number }[] {
  const base = 60000 + (hash(`${search.sourceCity}:${search.destinationCity}`) % 50000);
  return Array.from({ length: count }, (_, index) => ({
    date: addDays(new Date(), index),
    farePaise: Math.round(base * (1 + Math.sin(index / 2) * 0.06 + index * 0.015))
  }));
}
