import type { FareSearchResult, TripSearch } from "../domain/types.js";

export interface FareProvider {
  readonly name: string;
  searchFares(search: TripSearch): Promise<FareSearchResult>;
}
