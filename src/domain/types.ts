import type { BusType, SeatType } from "./enums.js";

export type TripSearch = {
  sourceCity: string;
  destinationCity: string;
  journeyDate: Date;
  seatType: SeatType;
  busType: BusType;
  departureWindow?: string;
  preferredOperator?: string;
};

export type FareOption = {
  operatorName: string;
  departureTime: string;
  farePaise: number;
  availableSeats: number;
  busType: BusType;
  seatType: SeatType;
};

export type FareSearchResult = {
  provider: string;
  searchedAt: Date;
  options: FareOption[];
};

export type FareSnapshotInput = {
  provider: string;
  lowestFarePaise: number;
  medianFarePaise: number;
  busCount: number;
  availableSeats: number;
  operatorName?: string;
  observedAt: Date;
  hoursToDeparture: number;
  raw: unknown;
};

export type ForecastPoint = {
  label: string;
  farePaise: number;
};

export type ForecastResult = {
  currentFarePaise: number;
  predictedLowestFarePaise: number;
  expectedBestWindow: string;
  confidence: number;
  recommendation: "BOOK_NOW" | "WAIT";
  reasoning: string;
  points: ForecastPoint[];
};
