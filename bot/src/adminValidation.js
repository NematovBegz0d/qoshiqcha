import { admin } from "./firebaseAdmin.js";
import { ValidationError } from "./priceService.js";

const ID_RE = /^[a-zA-Z0-9_-]{1,80}$/;
const TIME_RE = /^(?:[01]\d|2[0-3]):[0-5]\d$|^24:00$/;
const SAFE_URL_RE = /^https?:\/\/[^\s]+$/i;

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function assertAllowedKeys(input, allowedKeys, label) {
  for (const key of Object.keys(input)) {
    if (!allowedKeys.has(key)) {
      throw new ValidationError(`${label}: ruxsat etilmagan maydon "${key}"`);
    }
  }
}

function cleanString(value, label, { min = 0, max = 200 } = {}) {
  if (typeof value !== "string") {
    throw new ValidationError(`${label} matn bo'lishi kerak`);
  }
  const cleaned = value.trim();
  if (cleaned.length < min) {
    throw new ValidationError(`${label} kiritilmagan`);
  }
  if (cleaned.length > max) {
    throw new ValidationError(`${label} ${max} belgidan oshmasin`);
  }
  return cleaned;
}

function cleanOptionalString(value, label, max = 200) {
  if (value === undefined) return undefined;
  if (value === null) return "";
  return cleanString(value, label, { max });
}

function cleanId(value, label) {
  const cleaned = cleanString(value, label, { min: 1, max: 80 });
  if (!ID_RE.test(cleaned)) {
    throw new ValidationError(`${label} faqat harf, raqam, "-" va "_" bo'lishi mumkin`);
  }
  return cleaned;
}

function cleanNumber(value, label, { min = 0, max = 100000000, integer = false } = {}) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new ValidationError(`${label} son bo'lishi kerak`);
  }
  if (integer && !Number.isInteger(number)) {
    throw new ValidationError(`${label} butun son bo'lishi kerak`);
  }
  if (number < min || number > max) {
    throw new ValidationError(`${label} ${min} va ${max} oralig'ida bo'lishi kerak`);
  }
  return number;
}

function cleanBoolean(value, label) {
  if (typeof value !== "boolean") {
    throw new ValidationError(`${label} true yoki false bo'lishi kerak`);
  }
  return value;
}

function slugify(value, fallback) {
  const source = String(value || fallback || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return source || `item-${Date.now().toString(36)}`;
}

function cleanImageUrl(value) {
  const url = cleanString(value, "Rasm URL", { min: 1, max: 1000 });
  if (!SAFE_URL_RE.test(url)) {
    throw new ValidationError("Rasm URL http yoki https bilan boshlanishi kerak");
  }
  return url;
}

function cleanVariants(value) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) throw new ValidationError("Variantlar ro'yxat bo'lishi kerak");
  if (value.length > 20) throw new ValidationError("Variantlar soni 20 tadan oshmasin");

  return value.map((variant, index) => {
    if (!isPlainObject(variant)) throw new ValidationError(`Variant #${index + 1} noto'g'ri`);
    return {
      id: cleanId(variant.id, `Variant #${index + 1} ID`),
      name: cleanString(variant.name, `Variant #${index + 1} nomi`, { min: 1, max: 80 }),
      price: cleanNumber(variant.price, `Variant #${index + 1} narxi`, { min: 1 }),
    };
  });
}

function cleanModifiers(value) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) throw new ValidationError("Modifierlar ro'yxat bo'lishi kerak");
  if (value.length > 20) throw new ValidationError("Modifierlar soni 20 tadan oshmasin");

  return value.map((modifier, index) => {
    if (!isPlainObject(modifier)) throw new ValidationError(`Modifier #${index + 1} noto'g'ri`);
    const options = Array.isArray(modifier.options) ? modifier.options : [];
    if (options.length > 30) {
      throw new ValidationError(`Modifier #${index + 1} optionlari 30 tadan oshmasin`);
    }

    return {
      id: cleanId(modifier.id, `Modifier #${index + 1} ID`),
      name: cleanString(modifier.name, `Modifier #${index + 1} nomi`, { min: 1, max: 80 }),
      type: modifier.type === "single" || modifier.type === "multi" ? modifier.type : "multi",
      maxSelect: cleanNumber(modifier.maxSelect, `Modifier #${index + 1} limit`, {
        min: 1,
        max: 30,
        integer: true,
      }),
      required: cleanBoolean(!!modifier.required, `Modifier #${index + 1} required`),
      options: options.map((option, optionIndex) => {
        if (!isPlainObject(option)) {
          throw new ValidationError(`Modifier #${index + 1} option #${optionIndex + 1} noto'g'ri`);
        }
        return {
          id: cleanId(option.id, `Option #${optionIndex + 1} ID`),
          name: cleanString(option.name, `Option #${optionIndex + 1} nomi`, {
            min: 1,
            max: 80,
          }),
          price: cleanNumber(option.price, `Option #${optionIndex + 1} narxi`),
        };
      }),
    };
  });
}

export function cleanSettingsPatch(patch) {
  if (!isPlainObject(patch)) throw new ValidationError("settings patch noto'g'ri");
  assertAllowedKeys(
    patch,
    new Set(["deliveryPrice", "freeDeliveryFrom", "minOrderPrice", "workingHours", "shopIsOpen"]),
    "settings",
  );

  const cleaned = {};
  if ("deliveryPrice" in patch) {
    cleaned.deliveryPrice = cleanNumber(patch.deliveryPrice, "Yetkazib berish narxi", {
      max: 5000000,
      integer: true,
    });
  }
  if ("freeDeliveryFrom" in patch) {
    cleaned.freeDeliveryFrom = cleanNumber(patch.freeDeliveryFrom, "Bepul yetkazish summasi", {
      max: 50000000,
      integer: true,
    });
  }
  if ("minOrderPrice" in patch) {
    cleaned.minOrderPrice = cleanNumber(patch.minOrderPrice, "Minimal buyurtma", {
      max: 50000000,
      integer: true,
    });
  }
  if ("shopIsOpen" in patch) {
    cleaned.shopIsOpen = cleanBoolean(patch.shopIsOpen, "Do'kon holati");
  }
  if ("workingHours" in patch) {
    if (!isPlainObject(patch.workingHours)) {
      throw new ValidationError("Ish vaqti noto'g'ri");
    }
    const from = cleanString(patch.workingHours.from, "Ish boshlanish vaqti", { min: 5, max: 5 });
    const to = cleanString(patch.workingHours.to, "Ish tugash vaqti", { min: 5, max: 5 });
    if (!TIME_RE.test(from) || !TIME_RE.test(to)) {
      throw new ValidationError("Ish vaqti HH:mm formatida bo'lishi kerak");
    }
    cleaned.workingHours = { from, to };
  }
  if (Object.keys(cleaned).length === 0) throw new ValidationError("Saqlanadigan maydon yo'q");
  return cleaned;
}

export async function cleanProductPayload(product, { partial = false } = {}) {
  if (!isPlainObject(product)) throw new ValidationError("product noto'g'ri");
  assertAllowedKeys(
    product,
    new Set([
      "id",
      "name",
      "name_ru",
      "name_en",
      "slug",
      "categoryId",
      "description",
      "description_ru",
      "description_en",
      "image",
      "price",
      "oldPrice",
      "weight",
      "rating",
      "reviewsCount",
      "active",
      "popular",
      "variants",
      "modifiers",
    ]),
    "product",
  );

  const cleaned = {};

  if (!partial || "name" in product) {
    cleaned.name = cleanString(product.name, "Mahsulot nomi", { min: 1, max: 120 });
  }
  if (!partial || "categoryId" in product) {
    cleaned.categoryId = cleanId(product.categoryId, "Kategoriya ID");
    const categorySnap = await admin
      .firestore()
      .collection("categories")
      .doc(cleaned.categoryId)
      .get();
    if (!categorySnap.exists) {
      throw new ValidationError("Tanlangan kategoriya topilmadi");
    }
  }
  if (!partial || "price" in product) {
    cleaned.price = cleanNumber(product.price, "Mahsulot narxi", { min: 1, integer: true });
  }
  if (!partial || "image" in product) {
    cleaned.image = cleanImageUrl(product.image);
  }

  if ("slug" in product || (!partial && cleaned.name)) {
    cleaned.slug = slugify(product.slug, cleaned.name);
  }
  if ("description" in product || !partial) {
    cleaned.description = cleanOptionalString(product.description ?? "", "Tavsif", 1000);
  }
  if ("name_ru" in product) {
    cleaned.name_ru = cleanOptionalString(product.name_ru, "Nomi (RU)", 120);
  }
  if ("name_en" in product) {
    cleaned.name_en = cleanOptionalString(product.name_en, "Nomi (EN)", 120);
  }
  if ("description_ru" in product) {
    cleaned.description_ru = cleanOptionalString(product.description_ru, "Tavsif (RU)", 1000);
  }
  if ("description_en" in product) {
    cleaned.description_en = cleanOptionalString(product.description_en, "Tavsif (EN)", 1000);
  }
  if ("oldPrice" in product) {
    cleaned.oldPrice =
      product.oldPrice === null || product.oldPrice === ""
        ? null
        : cleanNumber(product.oldPrice, "Eski narx", { min: 1, integer: true });
  }
  if ("weight" in product || !partial) {
    cleaned.weight = cleanOptionalString(product.weight ?? "", "Og'irlik", 80);
  }
  if ("rating" in product || !partial) {
    cleaned.rating = cleanNumber(product.rating ?? 5, "Reyting", { min: 0, max: 5 });
  }
  if ("reviewsCount" in product || !partial) {
    cleaned.reviewsCount = cleanNumber(product.reviewsCount ?? 0, "Sharhlar soni", {
      min: 0,
      integer: true,
    });
  }
  if ("active" in product || !partial) {
    cleaned.active = cleanBoolean(product.active ?? true, "Mahsulot holati");
  }
  if ("popular" in product) {
    cleaned.popular = cleanBoolean(product.popular, "Mashhur holati");
  }
  if ("variants" in product) {
    cleaned.variants = cleanVariants(product.variants);
  }
  if ("modifiers" in product) {
    cleaned.modifiers = cleanModifiers(product.modifiers);
  }

  if (Object.keys(cleaned).length === 0) throw new ValidationError("Saqlanadigan maydon yo'q");
  return cleaned;
}

export function cleanCategoryPayload(category, { partial = false } = {}) {
  if (!isPlainObject(category)) throw new ValidationError("category noto'g'ri");
  assertAllowedKeys(
    category,
    new Set(["id", "name", "name_ru", "name_en", "slug", "icon", "order", "active"]),
    "category",
  );

  const cleaned = {};
  if (!partial || "name" in category) {
    cleaned.name = cleanString(category.name, "Kategoriya nomi", { min: 1, max: 80 });
  }
  if ("name_ru" in category) {
    cleaned.name_ru = cleanOptionalString(category.name_ru, "Nomi (RU)", 80);
  }
  if ("name_en" in category) {
    cleaned.name_en = cleanOptionalString(category.name_en, "Nomi (EN)", 80);
  }
  if ("slug" in category || (!partial && cleaned.name)) {
    cleaned.slug = slugify(category.slug, cleaned.name);
  }
  if ("icon" in category || !partial) {
    cleaned.icon = cleanString(category.icon ?? "", "Kategoriya ikonkasi", { min: 1, max: 16 });
  }
  if ("order" in category || !partial) {
    cleaned.order = cleanNumber(category.order ?? 99, "Kategoriya tartibi", {
      min: 0,
      max: 999,
      integer: true,
    });
  }
  if ("active" in category || !partial) {
    cleaned.active = cleanBoolean(category.active ?? true, "Kategoriya holati");
  }

  if (Object.keys(cleaned).length === 0) throw new ValidationError("Saqlanadigan maydon yo'q");
  return cleaned;
}

export function cleanDocumentId(id, label) {
  return cleanId(id, label);
}

export function cleanBranchPayload(branch, { partial = false } = {}) {
  if (!isPlainObject(branch)) throw new ValidationError("branch noto'g'ri");
  assertAllowedKeys(
    branch,
    new Set(["id", "name", "address", "phone", "hours", "openFrom", "openTo", "lat", "lng"]),
    "branch",
  );

  const cleaned = {};
  if (!partial || "name" in branch) {
    cleaned.name = cleanString(branch.name, "Filial nomi", { min: 1, max: 120 });
  }
  if (!partial || "address" in branch) {
    cleaned.address = cleanString(branch.address, "Manzil", { min: 1, max: 300 });
  }
  if (!partial || "phone" in branch) {
    cleaned.phone = cleanString(branch.phone, "Telefon", { min: 1, max: 30 });
  }
  if (!partial || "hours" in branch) {
    cleaned.hours = cleanString(branch.hours, "Ish vaqti", { min: 1, max: 50 });
  }
  if (!partial || "openFrom" in branch) {
    const from = cleanString(branch.openFrom ?? "09:00", "Ochilish vaqti", { min: 5, max: 5 });
    if (!TIME_RE.test(from)) throw new ValidationError("Ochilish vaqti HH:mm bo'lishi kerak");
    cleaned.openFrom = from;
  }
  if (!partial || "openTo" in branch) {
    const to = cleanString(branch.openTo ?? "23:00", "Yopilish vaqti", { min: 5, max: 5 });
    if (!TIME_RE.test(to)) throw new ValidationError("Yopilish vaqti HH:mm bo'lishi kerak");
    cleaned.openTo = to;
  }
  if (!partial || "lat" in branch) {
    cleaned.lat = cleanNumber(branch.lat ?? 0, "Kenglik (lat)", { min: -90, max: 90 });
  }
  if (!partial || "lng" in branch) {
    cleaned.lng = cleanNumber(branch.lng ?? 0, "Uzunlik (lng)", { min: -180, max: 180 });
  }

  if (Object.keys(cleaned).length === 0) throw new ValidationError("Saqlanadigan maydon yo'q");
  return cleaned;
}

export function cleanContactsPatch(patch) {
  if (!isPlainObject(patch)) throw new ValidationError("contacts patch noto'g'ri");
  assertAllowedKeys(patch, new Set(["contacts", "socials", "workingHours"]), "contacts");

  const cleaned = {};

  if ("contacts" in patch) {
    if (!Array.isArray(patch.contacts))
      throw new ValidationError("contacts ro'yxat bo'lishi kerak");
    if (patch.contacts.length > 10) throw new ValidationError("contacts 10 tadan oshmasin");
    cleaned.contacts = patch.contacts.map((c, i) => {
      if (!isPlainObject(c)) throw new ValidationError(`Kontakt #${i + 1} noto'g'ri`);
      return {
        label: cleanString(c.label, `Kontakt #${i + 1} nomi`, { min: 1, max: 60 }),
        value: cleanString(c.value, `Kontakt #${i + 1} qiymati`, { min: 1, max: 100 }),
        href: cleanString(c.href, `Kontakt #${i + 1} havolasi`, { min: 1, max: 300 }),
      };
    });
  }

  if ("socials" in patch) {
    if (!Array.isArray(patch.socials)) throw new ValidationError("socials ro'yxat bo'lishi kerak");
    if (patch.socials.length > 10) throw new ValidationError("socials 10 tadan oshmasin");
    cleaned.socials = patch.socials.map((s, i) => {
      if (!isPlainObject(s)) throw new ValidationError(`Ijtimoiy #${i + 1} noto'g'ri`);
      return {
        label: cleanString(s.label, `Ijtimoiy #${i + 1} nomi`, { min: 1, max: 60 }),
        href: cleanString(s.href, `Ijtimoiy #${i + 1} havolasi`, { min: 1, max: 300 }),
        color: cleanString(s.color, `Ijtimoiy #${i + 1} rangi`, { min: 1, max: 120 }),
      };
    });
  }

  if ("workingHours" in patch) {
    cleaned.workingHours = cleanString(patch.workingHours, "Ish vaqti matni", { min: 1, max: 100 });
  }

  if (Object.keys(cleaned).length === 0) throw new ValidationError("Saqlanadigan maydon yo'q");
  return cleaned;
}

export function cleanPromotionPayload(promotion, { partial = false } = {}) {
  if (!isPlainObject(promotion)) throw new ValidationError("promotion noto'g'ri");
  assertAllowedKeys(
    promotion,
    new Set([
      "id",
      "title",
      "title_ru",
      "title_en",
      "description",
      "description_ru",
      "description_en",
      "badge",
      "color",
      "image",
      "expiresAt",
      "active",
      "order",
    ]),
    "promotion",
  );

  const cleaned = {};
  if (!partial || "title" in promotion) {
    cleaned.title = cleanString(promotion.title, "Aksiya nomi", { min: 1, max: 120 });
  }
  if ("title_ru" in promotion) {
    cleaned.title_ru = cleanOptionalString(promotion.title_ru, "Nomi (RU)", 120);
  }
  if ("title_en" in promotion) {
    cleaned.title_en = cleanOptionalString(promotion.title_en, "Nomi (EN)", 120);
  }
  if ("description" in promotion || !partial) {
    cleaned.description = cleanOptionalString(promotion.description ?? "", "Tavsif", 500);
  }
  if ("description_ru" in promotion) {
    cleaned.description_ru = cleanOptionalString(promotion.description_ru, "Tavsif (RU)", 500);
  }
  if ("description_en" in promotion) {
    cleaned.description_en = cleanOptionalString(promotion.description_en, "Tavsif (EN)", 500);
  }
  if (!partial || "badge" in promotion) {
    cleaned.badge = cleanString(promotion.badge ?? "", "Badge", { min: 1, max: 20 });
  }
  if ("color" in promotion || !partial) {
    cleaned.color = cleanString(promotion.color ?? "from-pink-500 to-rose-500", "Rang", {
      min: 1,
      max: 100,
    });
  }
  if ("image" in promotion) {
    cleaned.image = promotion.image ? cleanImageUrl(promotion.image) : "";
  }
  if (!partial || "expiresAt" in promotion) {
    cleaned.expiresAt = cleanString(promotion.expiresAt ?? "Doimiy", "Amal qilish muddati", {
      min: 1,
      max: 50,
    });
  }
  if ("active" in promotion || !partial) {
    cleaned.active = cleanBoolean(promotion.active ?? true, "Aksiya holati");
  }
  if ("order" in promotion || !partial) {
    cleaned.order = cleanNumber(promotion.order ?? 99, "Tartib", {
      min: 0,
      max: 999,
      integer: true,
    });
  }

  if (Object.keys(cleaned).length === 0) throw new ValidationError("Saqlanadigan maydon yo'q");
  return cleaned;
}
