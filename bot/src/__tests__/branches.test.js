// Node built-in test runner (Node 18+).
// Ishga tushirish: node --test src/__tests__/branches.test.js

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getBranchById, DEFAULT_BRANCHES } from "../branches.js";

// ─── Fake Firestore ──────────────────────────────────────────────────────────

/**
 * Soddalashtirilgan Firestore mock'i: faqat collection("branches").doc(id).get()
 * zanjirini qo'llab-quvvatlaydi.
 *
 * @param {Record<string, object>} docs - { [id]: data }
 * @param {{ throwOnGet?: boolean }} [opts]
 */
function makeFakeDb(docs = {}, { throwOnGet = false } = {}) {
  return {
    collection(name) {
      assert.equal(name, "branches", "faqat 'branches' kolleksiyasi o'qilishi kerak");
      return {
        doc(id) {
          return {
            async get() {
              if (throwOnGet) throw new Error("Firestore unavailable");
              const data = docs[id];
              return {
                exists: data !== undefined,
                id,
                data: () => data,
              };
            },
          };
        },
      };
    },
  };
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe("getBranchById — Firestore'dan o'qish", () => {
  it("Firestore'da mavjud filial → hujjat ma'lumotini id bilan qaytaradi", async () => {
    const db = makeFakeDb({
      branch_abc: { name: "Yangi filial", openFrom: "10:00", openTo: "22:00" },
    });
    const branch = await getBranchById(db, "branch_abc");
    assert.equal(branch.id, "branch_abc");
    assert.equal(branch.name, "Yangi filial");
    assert.equal(branch.openFrom, "10:00");
    assert.equal(branch.openTo, "22:00");
  });

  it("Firestore'da topilmagan, lekin DEFAULT_BRANCHES da bor (\"main\") → zaxira qaytadi", async () => {
    const db = makeFakeDb({}); // bo'sh Firestore
    const branch = await getBranchById(db, "main");
    assert.ok(branch, "default 'main' filial qaytishi kerak");
    assert.equal(branch.id, "main");
    assert.equal(branch.openFrom, DEFAULT_BRANCHES[0].openFrom);
  });

  it("hech qayerda yo'q ID → null", async () => {
    const db = makeFakeDb({});
    const branch = await getBranchById(db, "mavjud_emas_xyz");
    assert.equal(branch, null);
  });

  it("Firestore xatosi → zaxiraga tushadi (\"main\" topiladi)", async () => {
    const db = makeFakeDb({}, { throwOnGet: true });
    const branch = await getBranchById(db, "main");
    assert.ok(branch, "Firestore xatosida ham default 'main' qaytishi kerak");
    assert.equal(branch.id, "main");
  });

  it("Firestore xatosi + default'da ham yo'q → null", async () => {
    const db = makeFakeDb({}, { throwOnGet: true });
    const branch = await getBranchById(db, "branch_xyz");
    assert.equal(branch, null);
  });

  it("Firestore filiali default ID bilan bir xil bo'lsa → Firestore ustun turadi", async () => {
    const db = makeFakeDb({
      main: { name: "Override filial", openFrom: "08:00", openTo: "20:00" },
    });
    const branch = await getBranchById(db, "main");
    assert.equal(branch.name, "Override filial");
    assert.equal(branch.openFrom, "08:00");
  });
});
