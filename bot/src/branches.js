// Filiallar manbasi — Firestore "branches" kolleksiyasi (admin panel orqali boshqariladi).
//
// MUHIM: Bu default ro'yxat frontend `src/data/businessInfo.ts` dagi
// `defaultBranches` bilan MOS bo'lishi kerak. U faqat Firestore "branches"
// kolleksiyasi bo'sh bo'lganda ishlatiladigan zaxira (fallback) hisoblanadi —
// xuddi frontend ham shu holatda `defaultBranches` ga tushgani kabi.
export const DEFAULT_BRANCHES = Object.freeze([
  {
    id: "main",
    name: "Markaziy filial",
    address: "Buxoro sh., Eski shahar, 1-uy",
    phone: "+998 71 200 00 00",
    hours: "09:00 - 00:00",
    openFrom: "09:00",
    openTo: "24:00",
    lat: 39.7747,
    lng: 64.4286,
  },
]);

function getDefaultBranchById(id) {
  return DEFAULT_BRANCHES.find((branch) => branch.id === id) ?? null;
}

/**
 * Filialni ID bo'yicha topadi.
 *
 * Frontend bilan bir xil manbadan (Firestore "branches") o'qiydi:
 *   1. Firestore "branches/{id}" hujjati bo'lsa — o'shani qaytaradi.
 *   2. Firestore'da topilmasa — DEFAULT_BRANCHES zaxirasidan qidiradi
 *      (Firestore bo'sh holatini frontend bilan moslash uchun).
 *   3. Hech qayerda topilmasa — null.
 *
 * @param {FirebaseFirestore.Firestore} db
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export async function getBranchById(db, id) {
  try {
    const snap = await db.collection("branches").doc(id).get();
    if (snap.exists) {
      return { id: snap.id, ...snap.data() };
    }
  } catch (err) {
    // Firestore xatosi — zaxiraga tushamiz, lekin logga yozamiz
    console.error("[branches] Firestore o'qish xatosi:", err?.message ?? err);
  }
  return getDefaultBranchById(id);
}
