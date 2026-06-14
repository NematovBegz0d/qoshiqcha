# Qoshiqcha — Telegram Mini App (fast food)

Tez ovqat buyurtma tizimi: Telegram Mini App (frontend) + bot/backend (Express +
Telegraf) + Firebase Firestore. Monorepo.

## Tuzilma

```
/            Frontend — React 19 + TanStack Start/Router + Vite + Tailwind v4 + Zustand
/bot         Backend  — Node + Express + Telegraf + Firebase Admin SDK
firestore.rules         Firestore xavfsizlik qoidalari (barcha write yopiq)
firestore.indexes.json  Firestore composite indexlar
render.yaml             Backend deploy blueprint (Render)
```

## Texnologiyalar

- **Frontend:** React 19, TanStack Start/Router, Vite 7, Tailwind v4, Zustand, Firebase Web SDK (faqat o'qish), Radix UI, i18n (uz/ru/en).
- **Backend:** Express 4, Telegraf 4, Firebase Admin SDK.
- **DB:** Firebase Firestore.

## Xavfsizlik modeli (qisqacha)

- Client SDK Firestore'ga **hech narsa yoza olmaydi** (`firestore.rules` — barcha write `false`).
- Barcha yozish backend (Admin SDK) orqali, har biri **Telegram `initData` HMAC** tekshiruvi bilan.
- Narxlar **serverda** Firestore'dan qayta hisoblanadi (`recalculateCart`) — client narx manipulyatsiya qila olmaydi.
- Admin huquqi server-side `ADMIN_TELEGRAM_IDS` env orqali (`VITE_ADMIN_TELEGRAM_IDS` faqat UI guard).

## Lokal ishga tushirish

### 1. Frontend

```bash
cp .env.example .env        # qiymatlarni to'ldiring
npm install
npm run dev                 # http://localhost:8080
```

### 2. Backend (bot)

```bash
cd bot
cp .env.example .env        # qiymatlarni to'ldiring
npm install
npm run dev                 # http://localhost:3005
```

Telegram Mini App'ni lokal sinash uchun frontendni HTTPS orqali ochish kerak
(masalan `ngrok http 8080`) va `WEB_APP_URL` ni o'sha manzilga qo'ying.

## Testlar

```bash
# Backend (Node built-in test runner)
cd bot && npm test

# Frontend (Vitest)
npm test
```

## Deploy

### Backend → Render

`render.yaml` (repo root) — yagona kanonik blueprint. Render'da maxfiy env'larni
qo'lda kiriting: `BOT_TOKEN`, `ADMIN_CHAT_ID`, `ADMIN_TELEGRAM_IDS`,
`FIREBASE_SERVICE_ACCOUNT`, `WEB_APP_URL`, `CORS_ORIGIN`.
`BOT_WEBHOOK_SECRET` va `HEALTH_CHECK_SECRET` avtomatik generatsiya qilinadi.

> Eslatma: Railway uchun `bot/railway.json` va `bot/Procfile` ham mavjud (muqobil).

### Frontend → Cloudflare Workers

Loyiha `wrangler.jsonc` + `@cloudflare/vite-plugin` bilan Cloudflare Workers'ga
moslangan:

```bash
npm run build
npx wrangler deploy
```

Deploy qilingach, backend'dagi `WEB_APP_URL` va `CORS_ORIGIN` ni frontend manziliga
to'g'rilang.

### Firestore (qoidalar + indexlar)

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes   # /api/orders/my so'rovi shunga tayanadi
```

## Dependency gigiyenasi

Ishlatilmagan paketlar tozalangan — runtime `dependencies` faqat kodda haqiqatan
import qilinadigan paketlardan iborat (`@radix-ui` dan faqat `react-dialog` qolgan).
Tozalik `src/__tests__/deadCode.test.ts` dagi guard testlar bilan himoyalangan:
ishlatilmagan paket qayta qo'shilsa testlar yiqiladi.

> Yangi paket qo'shganda uni haqiqatan import qiling; aks holda `npm test` ogohlantiradi.

