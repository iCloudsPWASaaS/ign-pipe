export function asNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function asText(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

export function money(value: unknown, currency = "GBP"): string {
  const n = asNumber(value);
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(n);
}

export function shortDate(value: unknown): string {
  if (!value) return "—";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function dateInputValue(value: unknown): string {
  if (!value) return "";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function timeInputValue(value: unknown): string {
  if (!value) return "";
  return String(value).slice(0, 5);
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function displayAddress(row: {
  p_no?: unknown;
  p_name?: unknown;
  p_location?: unknown;
  post_code?: unknown;
}): string {
  return [row.p_no, row.p_name, row.p_location, row.post_code]
    .map((value) => asText(value))
    .filter(Boolean)
    .join(", ");
}
