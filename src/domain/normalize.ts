export function normalizeCity(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

export function formatRupees(paise: number): string {
  return `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;
}

export function median(values: number[]): number {
  if (values.length === 0) {
    throw new Error("Cannot compute median of an empty list");
  }

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[middle]!;
  }

  return Math.round((sorted[middle - 1]! + sorted[middle]!) / 2);
}
