# Qoshiqcha fast food — Telegram Mini App

To'liq stack: **Frontend (TanStack Start + React)** + **Firebase (Firestore/Storage)** + **Node.js bot (Telegraf)**.

---

## 1. Frontend (joriy loyiha)

Mavjud TanStack Start loyihasi. Ishga tushirish:

```bash
bun install
bun run dev
```

### Firebase'ni ulash

1. [Firebase Console](https://console.firebase.google.com)'da loyiha yarating.
2. Web app qo'shing va config nusxa oling.
3. Loyiha rootida `.env.local` yarating:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

`firebase` paketi allaqachon `package.json` da. Firestore frontend'ga to'liq ulangan:

- O'qish (katalog, mahsulot, filial, aksiya, sozlama, sharhlar) — `src/services/firebase.ts` + Zustand store'lar orqali to'g'ridan-to'g'ri Firestore'dan (read-only rules).
- Yozish (buyurtma, status, admin CRUD) — bot serveridagi `/api` endpointlari orqali (Admin SDK). Client hech qachon to'g'ridan Firestore'ga yozmaydi.

### Frontend deploy (Netlify / Vercel / Cloudflare)

Build buyrug'i: `bun run build` · Output: `dist/` (yoki TanStack adapter chiqaradi).
`.env` o'zgaruvchilarini hosting paneliga qo'shing.

---

## 2. Bot (`bot/` papkasi)

Node.js + Telegraf + Firebase Admin + Express.

```bash
cd bot
cp .env.example .env
# .env'ni to'ldiring
npm install
npm start
```

### .env ma'lumotlari

- `BOT_TOKEN` — [@BotFather](https://t.me/BotFather)
- `WEB_APP_URL` — frontend deployed URL (https kerak)
- `ADMIN_CHAT_ID` — admin guruh ID (botni admin qiling)
- `ADMIN_TELEGRAM_IDS` — admin user ID'lar (vergul bilan)
- `FIREBASE_SERVICE_ACCOUNT` — service account JSON (Firebase Console → Project Settings → Service accounts → Generate)

### BotFather'da Mini App sozlash

1. `/newbot` → token oling
2. `/setmenubutton` → "🛒 Buyurtma berish" + WEB_APP_URL
3. `/setdomain` → frontend domeni

### Bot deploy

**Render** / **Railway** / **VPS** — har qanday Node host. Build: `npm install` · Start: `npm start`. WebSocket kerak emas.

0 budjetli hostlarda, masalan Render Free, service uxlab qolishi mumkin. Bunday joyda polling o'rniga webhook ishlating:

```
BOT_POLLING=false
BOT_WEBHOOK_URL=https://your-backend.onrender.com/telegram/webhook
BOT_WEBHOOK_PATH=/telegram/webhook
BOT_WEBHOOK_SECRET=long_random_string
```

`BOT_WEBHOOK_SECRET` ixtiyoriy, lekin production uchun tavsiya qilinadi.

---

## 3. Firestore tuzilishi

Kolleksiyalar:

- `users` — telegramId bo'yicha
- `categories`
- `products`
- `orders`
- `branches` — filiallar (admin paneldan tahrirlanadi)
- `promotions`
- `reviews`
- `settings/global` — ommaviy do'kon sozlamalari (single doc)
- `settings/contacts` — kontakt/ijtimoiy ma'lumotlar

### Firestore Rules

Joriy rules loyiha rootidagi [`firestore.rules`](../firestore.rules) faylida. Asosiy tamoyil:
**barcha o'qish ochiq joylar (`products`, `categories`, `branches`, `promotions`, `reviews`,
`settings/global`) `read: if true`; barcha yozish va `orders` butunlay `if false`** — yozuv faqat
bot serveridagi Admin SDK orqali, Telegram `initData` tekshiruvi bilan boradi. `orders` client
SDK uchun o'qish ham yopiq (shaxsiy ma'lumot), foydalanuvchi buyurtmalarini `POST /api/orders/my`
backend endpointidan oladi.

### Firestore Indexes

`POST /api/orders/my` `where(telegramId) + orderBy(createdAt desc)` so'rovini ishlatadi — bu
composite index talab qiladi. Index [`firestore.indexes.json`](../firestore.indexes.json) da
e'lon qilingan. Deploy qiling:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

---

## 4. Telegram Mini App integratsiyasi

`telegram-web-app.js` `__root.tsx` ichida ulangan. `src/lib/telegram.ts` ichidagi helper'lar:

- `initTelegram()` — ready + expand
- `getTelegramUser()` — user info
- `haptic()` / `notify()` — tactile feedback
- `useBackButton(cb)` — native BackButton

### Xavfsizlik

- Bot tokeni faqat serverda (`bot/.env`)
- `verifyTelegramInitData.js` — initData hash tekshiruvi (timing-safe, auth_date eskirish oynasi)
- Order narxlari serverda Firestore'dan qayta hisoblanadi (`priceService.js → recalculateCart`) —
  client yuborgan narxlarga ishonilmaydi
- Idempotentlik: har checkout `clientOrderId` yuboradi; takroriy so'rov dublikat buyurtma yaratmaydi

---

## 5. Sahifalar

| Route            | Tavsif                                          |
| ---------------- | ----------------------------------------------- |
| `/`              | Bosh sahifa (kategoriyalar, mahsulotlar, promo) |
| `/product/$id`   | Mahsulot detali, variantlar, modifierlar        |
| `/cart`          | Savat                                           |
| `/checkout`      | Telefon, manzil, to'lov, tasdiqlash             |
| `/order-success` | Tasdiq sahifasi                                 |
| `/orders`        | Foydalanuvchi buyurtmalari + status             |
| `/profile`       | Telegram user, sozlamalar                       |
| `/address`       | Manzillar CRUD + geolocation                    |
| `/admin`         | Admin dashboard (statistika, status boshqaruvi) |

---

## 6. Ishga tushirish checklist (deploy)

- [ ] Frontend `.env` (`VITE_*`) ni hosting paneliga qo'shing
- [ ] Bot `.env` (`BOT_TOKEN`, `ADMIN_TELEGRAM_IDS`, `ADMIN_CHAT_ID`, `FIREBASE_SERVICE_ACCOUNT`,
      `CORS_ORIGIN`, `WEB_APP_URL`) ni bot host paneliga qo'shing
- [ ] `firebase deploy --only firestore:rules,firestore:indexes`
- [ ] Filiallarni admin paneldan Firestore `branches` ga kiriting (aks holda default `main` ishlatiladi)
- [ ] BotFather'da Web App URL (`/setmenubutton`) va domen (`/setdomain`) ni kiriting
- [ ] Bot va frontend'ni deploy qiling, `/healthz/telegram` orqali webhook holatini tekshiring

## 7. Testlar

```bash
# Frontend (vitest)
bun run test            # yoki: npx vitest run

# Bot (node:test)
cd bot && npm test
```
