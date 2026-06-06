import { normalizeCity } from "../domain/normalize.js";

export type RedbusCity = {
  id: string;
  name: string;
  country: "IND";
  type: "CITY";
  aliases: string[];
};

const cities: RedbusCity[] = [
  {
    id: "65832",
    name: "Gurdaspur",
    country: "IND",
    type: "CITY",
    aliases: ["gurdaspur"]
  },
  {
    id: "70015",
    name: "Gurugram (Gurgaon)",
    country: "IND",
    type: "CITY",
    aliases: ["gurugram", "gurgaon", "gurugram-gurgaon"]
  },
  {
    id: "462",
    name: "Mumbai",
    country: "IND",
    type: "CITY",
    aliases: ["mumbai", "bombay"]
  },
  {
    id: "130",
    name: "Pune",
    country: "IND",
    type: "CITY",
    aliases: ["pune"]
  }
];

const cityByAlias = new Map<string, RedbusCity>();

for (const city of cities) {
  cityByAlias.set(normalizeCity(city.name), city);
  for (const alias of city.aliases) {
    cityByAlias.set(normalizeCity(alias), city);
  }
}

export function resolveRedbusCity(input: string): RedbusCity {
  const city = cityByAlias.get(normalizeCity(input));
  if (!city) {
    throw new Error(`redBus city not configured: ${input}. Add it to redbusCityMap.ts.`);
  }

  return city;
}

