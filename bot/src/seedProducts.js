/**
 * Firestore seed script — categories, products va settings/global yozadi.
 *
 * Ishlatish:
 *   cd bot && npm run seed:products
 *
 * Xatti-harakat:
 *   - Mavjud hujjatlar yangilanadi (set with merge: false → to'liq qayta yoziladi).
 *   - Yangi hujjatlar yaratiladi.
 *   - Dublikat yaratilmaydi (har bir doc o'z ID si bilan yoziladi).
 *   - createdAt har ishga tushirilganda yangilanadi — bu seed script uchun me'yor.
 */

import "dotenv/config";
import { db, admin } from "./firebaseAdmin.js";

const ts = () => admin.firestore.FieldValue.serverTimestamp();

// ─── Categories ────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "lavash", name: "Lavash", slug: "lavash", icon: "🌯", order: 1, active: true },
  { id: "doner", name: "Doner", slug: "doner", icon: "🥙", order: 2, active: true },
  { id: "burger", name: "Burger", slug: "burger", icon: "🍔", order: 3, active: true },
  { id: "hotdog", name: "Hot-dog", slug: "hotdog", icon: "🌭", order: 4, active: true },
  { id: "pizza", name: "Pitsa", slug: "pizza", icon: "🍕", order: 5, active: true },
  { id: "fri-sous", name: "Fri & Souslar", slug: "fri-sous", icon: "🍟", order: 6, active: true },
];

// ─── Products ──────────────────────────────────────────────────────────────

// Unsplash base URL helper
const img = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`;

const PRODUCTS = [
  // ── Lavash ────────────────────────────────────────────────────────────────
  {
    id: "p1",
    name: "Lavash oddiy",
    slug: "lavash-oddiy",
    categoryId: "lavash",
    description: "Yangi pishirilgan yumshoq lavash, mazali to'ldirgichlar bilan.",
    image: img("photo-1626700051175-6818013e1d4f"),
    price: 32000,
    oldPrice: null,
    weight: "320 g",
    active: true,
    popular: false,
    rating: 4.7,
    reviewsCount: 0,
    variants: [],
    modifiers: [],
  },
  {
    id: "p2",
    name: "Lavash katta",
    slug: "lavash-katta",
    categoryId: "lavash",
    description: "Katta o'lchamdagi to'yimli lavash.",
    image: img("photo-1599487488170-d11ec9c172f0"),
    price: 37000,
    oldPrice: null,
    weight: "420 g",
    active: true,
    popular: true,
    rating: 4.8,
    reviewsCount: 0,
    variants: [],
    modifiers: [],
  },
  {
    id: "p3",
    name: "Tandir lavash oddiy",
    slug: "tandir-lavash-oddiy",
    categoryId: "lavash",
    description: "Tandir usulida pishirilgan an'anaviy lavash.",
    image: img("photo-1606755962773-d324e0a13086"),
    price: 37000,
    oldPrice: null,
    weight: "380 g",
    active: true,
    popular: true,
    rating: 4.9,
    reviewsCount: 0,
    variants: [],
    modifiers: [],
  },
  {
    id: "p4",
    name: "Tandir lavash katta",
    slug: "tandir-lavash-katta",
    categoryId: "lavash",
    description: "Katta o'lchamdagi tandir lavash, ikki kishi uchun.",
    image: img("photo-1604382354936-07c5d9983bd3"),
    price: 42000,
    oldPrice: null,
    weight: "500 g",
    active: true,
    popular: false,
    rating: 4.8,
    reviewsCount: 0,
    variants: [],
    modifiers: [],
  },

  // ── Doner ─────────────────────────────────────────────────────────────────
  {
    id: "p5",
    name: "Doner oddiy",
    slug: "doner-oddiy",
    categoryId: "doner",
    description: "Klassik doner — go'sht, sabzavotlar va maxsus sous.",
    image: img("photo-1529006557810-274b9b2fc783"),
    price: 30000,
    oldPrice: null,
    weight: "300 g",
    active: true,
    popular: false,
    rating: 4.7,
    reviewsCount: 0,
    variants: [],
    modifiers: [],
  },
  {
    id: "p6",
    name: "Doner katta",
    slug: "doner-katta",
    categoryId: "doner",
    description: "Katta o'lchamdagi to'yimli doner.",
    image: img("photo-1561651188-d207bbec4ec3"),
    price: 35000,
    oldPrice: null,
    weight: "420 g",
    active: true,
    popular: true,
    rating: 4.8,
    reviewsCount: 0,
    variants: [],
    modifiers: [],
  },
  {
    id: "p7",
    name: "Arab kabob oddiy",
    slug: "arab-kabob-oddiy",
    categoryId: "doner",
    description: "Arab uslubidagi kabob lavashda.",
    image: img("photo-1504674900247-0877df9cc836"),
    price: 32000,
    oldPrice: null,
    weight: "320 g",
    active: true,
    popular: false,
    rating: 4.7,
    reviewsCount: 0,
    variants: [],
    modifiers: [],
  },
  {
    id: "p8",
    name: "Arab kabob katta",
    slug: "arab-kabob-katta",
    categoryId: "doner",
    description: "Katta o'lchamdagi arab uslubidagi kabob.",
    image: img("photo-1544025162-d76538964ab6"),
    price: 36000,
    oldPrice: null,
    weight: "430 g",
    active: true,
    popular: true,
    rating: 4.8,
    reviewsCount: 0,
    variants: [],
    modifiers: [],
  },

  // ── Burger ────────────────────────────────────────────────────────────────
  {
    id: "p9",
    name: "Burger savatcha",
    slug: "burger-savatcha",
    categoryId: "burger",
    description: "Burger + fri kartoshka + sovutilgan ichimlik. To'liq set.",
    image: img("photo-1568901346375-23c9450c58cd"),
    price: 46000,
    oldPrice: 55000,
    weight: "600 g",
    active: true,
    popular: true,
    rating: 4.9,
    reviewsCount: 0,
    variants: [],
    modifiers: [],
  },
  {
    id: "p10",
    name: "Pishloqli burger",
    slug: "pishloqli-burger",
    categoryId: "burger",
    description: "Mol go'shti kotleti, ikki qatlam pishloq va maxsus sous.",
    image: img("photo-1571091718767-18b5b1457add"),
    price: 35000,
    oldPrice: null,
    weight: "350 g",
    active: true,
    popular: true,
    rating: 4.8,
    reviewsCount: 0,
    variants: [],
    modifiers: [],
  },
  {
    id: "p11",
    name: "Gamburger",
    slug: "gamburger",
    categoryId: "burger",
    description: "Klassik gamburger — oddiy va mazali.",
    image: img("photo-1553979459-d2229ba7433b"),
    price: 30000,
    oldPrice: null,
    weight: "280 g",
    active: true,
    popular: false,
    rating: 4.6,
    reviewsCount: 0,
    variants: [],
    modifiers: [],
  },

  // ── Hot-dog ───────────────────────────────────────────────────────────────
  {
    id: "p12",
    name: "Qazili hot-dog",
    slug: "qazili-hotdog",
    categoryId: "hotdog",
    description: "Milliy qazi go'shti bilan tayyorlangan maxsus hot-dog.",
    image: img("photo-1572802419224-296b0aeee0d9"),
    price: 33000,
    oldPrice: null,
    weight: "260 g",
    active: true,
    popular: true,
    rating: 4.9,
    reviewsCount: 0,
    variants: [],
    modifiers: [],
  },
  {
    id: "p13",
    name: "Hot-dog oddiy",
    slug: "hotdog-oddiy",
    categoryId: "hotdog",
    description: "Oddiy hot-dog — tez va to'yimli.",
    image: img("photo-1572802419224-296b0aeee0d9"),
    price: 20000,
    oldPrice: null,
    weight: "200 g",
    active: true,
    popular: false,
    rating: 4.5,
    reviewsCount: 0,
    variants: [],
    modifiers: [],
  },
  {
    id: "p14",
    name: "Hot-dog katta",
    slug: "hotdog-katta",
    categoryId: "hotdog",
    description: "Katta o'lchamdagi hot-dog.",
    image: img("photo-1572802419224-296b0aeee0d9"),
    price: 22000,
    oldPrice: null,
    weight: "240 g",
    active: true,
    popular: false,
    rating: 4.6,
    reviewsCount: 0,
    variants: [],
    modifiers: [],
  },
  {
    id: "p15",
    name: "Klassik hot-dog",
    slug: "klassik-hotdog",
    categoryId: "hotdog",
    description: "Yumshoq bulochka va kolbasa — klassika.",
    image: img("photo-1603360946369-dc9bb6258143"),
    price: 16000,
    oldPrice: null,
    weight: "180 g",
    active: true,
    popular: false,
    rating: 4.4,
    reviewsCount: 0,
    variants: [],
    modifiers: [],
  },
  {
    id: "p16",
    name: "Double hot-dog",
    slug: "double-hotdog",
    categoryId: "hotdog",
    description: "Ikki kolbasa bilan tayyorlangan kuchli hot-dog.",
    image: img("photo-1603360946369-dc9bb6258143"),
    price: 21000,
    oldPrice: null,
    weight: "230 g",
    active: true,
    popular: false,
    rating: 4.6,
    reviewsCount: 0,
    variants: [],
    modifiers: [],
  },
  {
    id: "p17",
    name: "Amerikancha hot-dog",
    slug: "amerikancha-hotdog",
    categoryId: "hotdog",
    description: "Amerika uslubida tayyorlangan hot-dog.",
    image: img("photo-1572802419224-296b0aeee0d9"),
    price: 20000,
    oldPrice: null,
    weight: "210 g",
    active: true,
    popular: false,
    rating: 4.5,
    reviewsCount: 0,
    variants: [],
    modifiers: [],
  },
  {
    id: "p18",
    name: "Shashlikli hot-dog",
    slug: "shashlikli-hotdog",
    categoryId: "hotdog",
    description: "O'zbek shashliqi bilan tayyorlangan maxsus hot-dog.",
    image: img("photo-1529006557810-274b9b2fc783"),
    price: 25000,
    oldPrice: null,
    weight: "250 g",
    active: true,
    popular: true,
    rating: 4.8,
    reviewsCount: 0,
    variants: [],
    modifiers: [],
  },

  // ── Pizza ─────────────────────────────────────────────────────────────────
  {
    id: "p19",
    name: "Pepperoni pitsa",
    slug: "pepperoni",
    categoryId: "pizza",
    description: "Italyan pepperoni va mozzarella bilan klassik pitsa.",
    image: img("photo-1565299624946-b28f40a0ae38"),
    price: 75000,
    oldPrice: null,
    weight: "33 sm",
    active: true,
    popular: true,
    rating: 4.9,
    reviewsCount: 0,
    variants: [],
    modifiers: [],
  },
  {
    id: "p20",
    name: "Tovuqli va qo'ziqorinli pitsa",
    slug: "tovuqli-qoziqorinli",
    categoryId: "pizza",
    description: "Tovuq go'shti va yangi qo'ziqorin bilan tayyorlangan pitsa.",
    image: img("photo-1574071318508-1cdbab80d002"),
    price: 80000,
    oldPrice: null,
    weight: "33 sm",
    active: true,
    popular: false,
    rating: 4.7,
    reviewsCount: 0,
    variants: [],
    modifiers: [],
  },
  {
    id: "p21",
    name: "Go'shtli assorti pitsa",
    slug: "goshtli-assorti",
    categoryId: "pizza",
    description: "Bir nechta turdagi go'sht bilan tayyorlangan maxsus pitsa.",
    image: img("photo-1513104890138-7c749659a591"),
    price: 95000,
    oldPrice: null,
    weight: "35 sm",
    active: true,
    popular: true,
    rating: 4.8,
    reviewsCount: 0,
    variants: [],
    modifiers: [],
  },
  {
    id: "p22",
    name: "Bolonez pitsa",
    slug: "bolonez",
    categoryId: "pizza",
    description: "Italyan bolonez sousi va mol go'shti bilan pitsa.",
    image: img("photo-1628840042765-356cda07504e"),
    price: 90000,
    oldPrice: null,
    weight: "33 sm",
    active: true,
    popular: false,
    rating: 4.7,
    reviewsCount: 0,
    variants: [],
    modifiers: [],
  },

  // ── Fri & Souslar ─────────────────────────────────────────────────────────
  {
    id: "p23",
    name: "Qishloqcha kartoshka",
    slug: "qishloqcha-kartoshka",
    categoryId: "fri-sous",
    description: "Po'sti bilan qovurilgan mazali qishloqcha kartoshka.",
    image: img("photo-1573080496219-bb080dd4f877"),
    price: 20000,
    oldPrice: null,
    weight: "250 g",
    active: true,
    popular: true,
    rating: 4.8,
    reviewsCount: 0,
    variants: [],
    modifiers: [],
  },
  {
    id: "p24",
    name: "Fri sharchalari",
    slug: "fri-sharchalari",
    categoryId: "fri-sous",
    description: "Oltin jigarrang va qarsildoq fri sharchalar.",
    image: img("photo-1541592106381-b31e9677c0e5"),
    price: 15000,
    oldPrice: null,
    weight: "180 g",
    active: true,
    popular: false,
    rating: 4.6,
    reviewsCount: 0,
    variants: [],
    modifiers: [],
  },
  {
    id: "p25",
    name: "Kartoshka fri",
    slug: "kartoshka-fri",
    categoryId: "fri-sous",
    description: "Klassik oltin rangdagi kartoshka fri.",
    image: img("photo-1576777647209-e8733d7b851d"),
    price: 15000,
    oldPrice: null,
    weight: "200 g",
    active: true,
    popular: false,
    rating: 4.5,
    reviewsCount: 0,
    variants: [],
    modifiers: [],
  },
  {
    id: "p26",
    name: "Sous",
    slug: "sous",
    categoryId: "fri-sous",
    description: "Qo'shimcha sous: ketchup, sarimsoq yoki pishloq.",
    image: img("photo-1472476443507-c7dcb4b2beef"),
    price: 3000,
    oldPrice: null,
    weight: "30 g",
    active: true,
    popular: false,
    rating: 4.5,
    reviewsCount: 0,
    variants: [],
    modifiers: [],
  },
];

// ─── Settings ──────────────────────────────────────────────────────────────

const SETTINGS = {
  deliveryPrice: 15000,
  freeDeliveryFrom: 50000,
  minOrderPrice: 25000,
  workingHours: { from: "09:00", to: "00:00" },
  shopIsOpen: true,
};

// ─── Seed function ─────────────────────────────────────────────────────────

async function seed() {
  console.log("🌱 Seed boshlandi...\n");

  // Firestore batch — bitta atomic operatsiya
  // Bir batch max 500 write: 6 + 26 + 1 = 33 ✓
  const batch = db.batch();

  // ── Categories ────────────────────────────────────────────────────────────
  for (const cat of CATEGORIES) {
    const { id, ...data } = cat;
    const ref = db.collection("categories").doc(id);
    batch.set(ref, { ...data, createdAt: ts(), updatedAt: ts() });
  }
  console.log(`  ✓ ${CATEGORIES.length} ta kategoriya batch ga qo'shildi`);

  // ── Products ──────────────────────────────────────────────────────────────
  for (const product of PRODUCTS) {
    const { id, ...data } = product;
    const ref = db.collection("products").doc(id);
    batch.set(ref, { ...data, createdAt: ts(), updatedAt: ts() });
  }
  console.log(`  ✓ ${PRODUCTS.length} ta mahsulot batch ga qo'shildi`);

  // ── Commit ────────────────────────────────────────────────────────────────
  await batch.commit();
  console.log("\n  ✓ Batch muvaffaqiyatli yozildi (categories + products)\n");

  // ── Settings (alohida — merge: true: qo'shimcha fieldlarni saqlab qoladi) ─
  await db
    .collection("settings")
    .doc("global")
    .set({ ...SETTINGS, updatedAt: ts() }, { merge: true });
  console.log("  ✓ settings/global yozildi\n");

  // ── Xulosa ────────────────────────────────────────────────────────────────
  console.log("✅ Seed yakunlandi:");
  console.log(`   Kategoriyalar : ${CATEGORIES.length}`);
  console.log(`   Mahsulotlar   : ${PRODUCTS.length}`);
  console.log("   Settings      : global\n");

  const popularCount = PRODUCTS.filter((p) => p.popular).length;
  console.log(`   Mashhur (popular: true) : ${popularCount} ta mahsulot`);
  console.log(
    `   Jami narx oralig'i     : ${Math.min(...PRODUCTS.map((p) => p.price)).toLocaleString()} – ${Math.max(...PRODUCTS.map((p) => p.price)).toLocaleString()} UZS`,
  );
}

// ─── Run ───────────────────────────────────────────────────────────────────

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ Seed xatosi:", err.message);
    process.exit(1);
  });
