import { z } from "zod";
import { BusType, SeatType } from "./enums.js";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
const windowSchema = z.string().regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/, "Use HH:mm-HH:mm").optional();

export type ParsedTrackCommand = {
  sourceCity: string;
  destinationCity: string;
  journeyDate: Date;
  seatType: SeatType;
  busType: BusType;
  departureWindow?: string;
  preferredOperator?: string;
};

export function parseTrackCommand(text: string, now = new Date()): ParsedTrackCommand {
  const tokens = text.trim().split(/\s+/).filter(Boolean);
  if (tokens[0] === "/track") {
    tokens.shift();
  }

  if (tokens.length < 3) {
    throw new Error("Usage: /track Mumbai Pune 2026-06-12 sleeper ac 18:00-23:59");
  }

  const [sourceCity, destinationCity, dateToken, seatToken = "any", busToken = "any", windowToken, ...operatorParts] = tokens;
  const date = dateSchema.parse(dateToken);
  const journeyDate = new Date(`${date}T00:00:00.000+05:30`);

  if (Number.isNaN(journeyDate.getTime()) || journeyDate < startOfToday(now)) {
    throw new Error("Journey date must be today or later in YYYY-MM-DD format.");
  }

  const seatType = parseSeatType(seatToken);
  const busType = parseBusType(busToken);
  const departureWindow = windowToken ? windowSchema.parse(windowToken) : undefined;
  const preferredOperator = operatorParts.length > 0 ? operatorParts.join(" ") : undefined;

  return {
    sourceCity,
    destinationCity,
    journeyDate,
    seatType,
    busType,
    departureWindow,
    preferredOperator
  };
}

function parseSeatType(value: string): SeatType {
  switch (value.toLowerCase()) {
    case "seater":
      return SeatType.SEATER;
    case "sleeper":
      return SeatType.SLEEPER;
    case "any":
      return SeatType.ANY;
    default:
      throw new Error("Seat type must be one of: any, seater, sleeper.");
  }
}

function parseBusType(value: string): BusType {
  const normalized = value.toLowerCase().replace("-", "_");
  switch (normalized) {
    case "ac":
      return BusType.AC;
    case "non_ac":
    case "nonac":
      return BusType.NON_AC;
    case "any":
      return BusType.ANY;
    default:
      throw new Error("Bus type must be one of: any, ac, non_ac.");
  }
}

function startOfToday(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}
