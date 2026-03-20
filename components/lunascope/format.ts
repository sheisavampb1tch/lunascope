export function formatPercent(value: number, digits = 0) {
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatSignedPercent(value: number, digits = 1) {
  const normalized = value * 100;
  const prefix = normalized > 0 ? "+" : "";
  return `${prefix}${normalized.toFixed(digits)}%`;
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value);
}

export function formatClock(value: string) {
  const date = new Date(value);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatHoursUntil(value: string | null | undefined) {
  if (!value) return null;

  const diff = new Date(value).getTime() - Date.now();
  if (Number.isNaN(diff)) return null;

  const hours = Math.max(1, Math.round(diff / 3_600_000));
  return hours;
}

export function formatCategoryTag(value: string | null | undefined) {
  return (value ?? "General").toUpperCase();
}

export function convictionFromSignal(score: number, confidence?: "LOW" | "MEDIUM" | "HIGH") {
  const base = Math.max(52, Math.min(96, Math.round(score * 9)));

  if (confidence === "HIGH") return Math.min(98, base + 6);
  if (confidence === "LOW") return Math.max(48, base - 6);
  return base;
}

export function shortenAddress(value: string | null | undefined) {
  if (!value) return "Guest";
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}
