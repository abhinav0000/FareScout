export const SeatType = {
  ANY: "ANY",
  SEATER: "SEATER",
  SLEEPER: "SLEEPER"
} as const;

export type SeatType = (typeof SeatType)[keyof typeof SeatType];

export const BusType = {
  ANY: "ANY",
  AC: "AC",
  NON_AC: "NON_AC"
} as const;

export type BusType = (typeof BusType)[keyof typeof BusType];

export const TripStatus = {
  ACTIVE: "ACTIVE",
  PAUSED: "PAUSED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED"
} as const;

export type TripStatus = (typeof TripStatus)[keyof typeof TripStatus];

export const Recommendation = {
  BOOK_NOW: "BOOK_NOW",
  WAIT: "WAIT"
} as const;

export type Recommendation = (typeof Recommendation)[keyof typeof Recommendation];
