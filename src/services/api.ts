// Umumiy backend API client.
// Barcha service'lar (orderService, adminApi, notificationService) shu modulni
// ishlatadi — fetch, xato ishlash va BASE URL logikasi bitta joyda.

export const API_URL = (
  (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3005"
).replace(/\/$/, "");

/** 401 — Telegram initData yaroqsiz/eskirgan. UI bunda "botni qayta oching" deydi. */
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Backendga JSON so'rov yuboradi va javobni parse qiladi.
 *
 * @throws {AuthError} — 401 (initData yaroqsiz)
 * @throws {Error}     — tarmoq xatosi yoki !ok (backend error message bilan)
 */
export async function apiRequest<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: Record<string, unknown>,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Server bilan aloqa yo'q. Internetingizni tekshiring.");
  }

  if (res.status === 401) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new AuthError(err.error ?? "Telegram autentifikatsiya xatosi. Bot orqali qayta oching.");
  }

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `Server xatosi (${res.status}). Keyinroq urinib ko'ring.`);
  }

  return res.json() as Promise<T>;
}
