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

4. Firebase paketini o'rnating:

```bash
bun add firebase
```

5. `src/services/firebase.ts` ichidagi commented kodni faollashtiring.
6. `src/services/productService.ts` va `orderService.ts` ichidagi Firestore variantlarini yoqing.

### Frontend deploy (Netlify / Vercel)

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

---

## 3. Firestore tuzilishi

Kolleksiyalar:

- `users` — telegramId bo'yicha
- `categories`
- `products`
- `orders`
- `settings/global` — single doc

### Firestore Rules (boshlang'ich)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {

    function isAdmin() {
      return request.auth != null
        && get(/databases/$(db)/documents/settings/global).data.adminTelegramIds
            .hasAny([request.auth.uid]);
    }

    match /products/{id}   { allow read: if true;  allow write: if isAdmin(); }
    match /categories/{id} { allow read: if true;  allow write: if isAdmin(); }
    match /settings/{id}   { allow read: if true;  allow write: if isAdmin(); }

    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    match /orders/{id} {
      // Foydalanuvchi faqat o'z buyurtmalarini ko'radi.
      allow read: if request.auth != null
        && (resource.data.telegramId == int(request.auth.uid) || isAdmin());
      // Yozish faqat server (Admin SDK) orqali.
      allow create, update, delete: if isAdmin();
    }
  }
}
```

> Eslatma: real loyihada Firebase Auth + custom claims orqali admin'ni belgilash tavsiya etiladi.

---

## 4. Telegram Mini App integratsiyasi

`telegram-web-app.js` `__root.tsx` ichida ulangan. `src/lib/telegram.ts` ichidagi helper'lar:

- `initTelegram()` — ready + expand
- `getTelegramUser()` — user info
- `haptic()` / `notify()` — tactile feedback
- `useBackButton(cb)` — native BackButton

### Xavfsizlik

- Bot tokeni faqat serverda (`bot/.env`)
- `verifyTelegramInitData.js` — initData hash tekshiruvi
- Order narxlari serverda qayta hisoblanishi shart (`bot/src/index.js` ichida TODO qo'yilgan)

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

## 6. Keyingi qadamlar

- [ ] Firebase paketini o'rnating va `src/services/firebase.ts` yoqing
- [ ] Mock data o'rniga Firestore'dan o'qing
- [ ] Frontend → bot API uchun `/api/orders` chaqirig'ini qo'shing
- [ ] BotFather'da Web App URL ni kiriting
- [ ] Bot va frontend'ni deploy qiling
- [ ] Admin Telegram ID'larni `settings/global`'ga qo'shing
