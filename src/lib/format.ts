const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"] as const;

/** Convert latin digits inside a string to Persian digits. */
export function toPersianDigits(value: string | number): string {
  return String(value).replace(/\d/g, (digit) => FA_DIGITS[Number(digit)]);
}

/** 1250000 -> "۱٬۲۵۰٬۰۰۰" */
export function formatNumber(value: number, persian = true): string {
  const grouped = new Intl.NumberFormat("en-US").format(Math.round(value));
  return persian ? toPersianDigits(grouped) : grouped;
}

/** Price in Iranian Toman. */
export function formatPrice(value: number, withUnit = true): string {
  const base = `${formatNumber(value)}`;
  return withUnit ? `${base} تومان` : base;
}

/** Compact price for tight spaces: 1.2M */
export function formatCompactPrice(value: number): string {
  if (value >= 1_000_000_000) return `${toPersianDigits((value / 1_000_000_000).toFixed(1))} میلیارد`;
  if (value >= 1_000_000) return `${toPersianDigits((value / 1_000_000).toFixed(1))} میلیون`;
  if (value >= 1_000) return `${toPersianDigits(Math.round(value / 1_000))} هزار`;
  return formatNumber(value);
}

/** Percentage discount between two prices. */
export function discountPercent(price: number, compareAt?: number | null): number {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

const persianDate = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const persianDateTime = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(value: string | Date): string {
  return persianDate.format(new Date(value));
}

export function formatDateTime(value: string | Date): string {
  return persianDateTime.format(new Date(value));
}

/** "۳ روز پیش" style relative time. */
export function formatRelative(value: string | Date): string {
  const then = new Date(value).getTime();
  const diff = Date.now() - then;
  const day = 86_400_000;
  if (diff < 3_600_000) {
    const minutes = Math.max(1, Math.round(diff / 60_000));
    return `${toPersianDigits(minutes)} دقیقه پیش`;
  }
  if (diff < day) return `${toPersianDigits(Math.round(diff / 3_600_000))} ساعت پیش`;
  if (diff < 30 * day) return `${toPersianDigits(Math.round(diff / day))} روز پیش`;
  if (diff < 365 * day) return `${toPersianDigits(Math.round(diff / (30 * day)))} ماه پیش`;
  return `${toPersianDigits(Math.round(diff / (365 * day)))} سال پیش`;
}

/** Mask middle of a phone number: 0912***4567 */
export function maskPhone(phone: string): string {
  if (phone.length < 8) return phone;
  return `${phone.slice(0, 4)}***${phone.slice(-4)}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("");
}
