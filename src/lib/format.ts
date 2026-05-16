export const formatUZS = (n: number) =>
  new Intl.NumberFormat("ru-RU").format(Math.round(n)) + " UZS";

export const orderNumber = () =>
  "#" + Math.random().toString(36).slice(2, 6).toUpperCase() + Date.now().toString().slice(-4);

/** Parses "DD.MM.YYYY" strings. Non-date strings (e.g. "Doimiy") return false — treated as never expiring. */
export function isPromoExpired(expiresAt: string): boolean {
  const parts = expiresAt?.trim().split(".");
  if (parts?.length !== 3) return false;
  const [d, m, y] = parts.map(Number);
  if (!d || !m || !y || y < 2000) return false;
  return new Date(y, m - 1, d + 1).getTime() <= Date.now();
}
