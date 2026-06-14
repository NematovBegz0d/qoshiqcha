import Redis from "ioredis";

// Distributed rate limit (va kelajakda boshqa shared state) uchun ixtiyoriy
// Redis ulanishi. REDIS_URL sozlanmagan bo'lsa — client null bo'ladi va
// chaqiruvchi kod in-memory rejimga tushadi (lokal dev / testlar Redissiz ishlaydi).
//
// Eslatma: bu modul ataylab env.js ni import QILMAYDI. env.js ilova ishga
// tushganda majburiy o'zgaruvchilar (BOT_TOKEN va h.k.) bo'lmasa throw qiladi;
// rate limit middleware esa izolyatsiyada unit-test qilinadi. Shu sababli
// REDIS_URL to'g'ridan-to'g'ri process.env dan o'qiladi (testlar uchun xavfsiz).
//
// Muhim sozlamalar:
//   enableOfflineQueue: false  → Redis uzilganda buyruqlar navbatda kutmaydi,
//                                darrov reject bo'ladi → rate limit "fail-open"
//                                yo'liga tez tushadi (API to'xtab qolmaydi).
//   maxRetriesPerRequest: 2    → har bir buyruq cheksiz qayta urinmaydi.

const REDIS_URL = (process.env.REDIS_URL || "").trim();

let client = null;

if (REDIS_URL) {
  client = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 2,
    enableOfflineQueue: false,
    retryStrategy(times) {
      // Eksponensialga yaqin, lekin 2s da cheklangan qayta ulanish.
      return Math.min(times * 200, 2000);
    },
  });

  client.on("connect", () => console.log("[redis] ulandi"));
  client.on("error", (err) => console.error("[redis] xato:", err.message));
}

/**
 * Faol Redis clientini qaytaradi yoki REDIS_URL sozlanmagan bo'lsa null.
 * @returns {import("ioredis").Redis | null}
 */
export function getRedis() {
  return client;
}
