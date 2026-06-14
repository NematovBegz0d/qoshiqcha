import { db } from "./firebaseAdmin.js";

// Firestore `branches` kolleksiyasi — filiallarning yagona haqiqat manbai.
// Admin panel ulardagi nom/ish vaqti/koordinatani tahrirlaydi (adminBranches.js).
//
// Quyidagi DEFAULT_BRANCHES faqat Firestore hali bo'sh bo'lgan holatda ishlatiladi
// va frontend src/data/businessInfo.ts `defaultBranches` bilan BIR XIL bo'lishi SHART
// (id, openFrom, openTo). Aks holda olib-ketish buyurtmasi validatsiyadan o'tmaydi.
export const DEFAULT_BRANCHES = Object.freeze([
  {
    id: "main",
    name: "Markaziy filial",
    openFrom: "09:00",
    openTo: "24:00",
  },
]);

const DEFAULT_BY_ID = new Map(DEFAULT_BRANCHES.map((branch) => [branch.id, branch]));

function normalizeBranch(id, data) {
  return {
    id,
    name: typeof data.name === "string" && data.name.trim() ? data.name.trim() : "Filial",
    openFrom: typeof data.openFrom === "string" ? data.openFrom : "09:00",
    openTo: typeof data.openTo === "string" ? data.openTo : "24:00",
  };
}

/**
 * Filialni id bo'yicha qaytaradi.
 * - Avval Firestore `branches/{id}` dan o'qiydi (admin tahrir qilgan manba).
 * - Topilmasa — faqat DEFAULT_BRANCHES dagi id bilan moslikni tekshiradi
 *   (Firestore hali to'ldirilmagan yangi o'rnatish holati).
 * @returns {Promise<{id, name, openFrom, openTo} | null>}
 */
export async function getBranchById(id) {
  if (!id || typeof id !== "string") return null;

  const snap = await db.collection("branches").doc(id).get();
  if (snap.exists) {
    return normalizeBranch(id, snap.data() ?? {});
  }

  return DEFAULT_BY_ID.get(id) ?? null;
}
