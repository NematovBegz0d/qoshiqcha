import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join, sep } from "path";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");
const UI_DIR = join(SRC, "components", "ui");

function readAllSrc(dir: string, excludeDirs: string[] = []): string {
  let content = "";
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      const normalized = full.replace(/[\\/]/g, sep);
      const excluded = excludeDirs.some(
        (ex) => normalized === ex || normalized.startsWith(ex + sep),
      );
      if (!excluded) content += readAllSrc(full, excludeDirs);
    } else if (e.name.endsWith(".ts") || e.name.endsWith(".tsx")) {
      content += readFileSync(full, "utf-8") + "\n";
    }
  }
  return content;
}

const appCode = readAllSrc(SRC, [UI_DIR, join(SRC, "__tests__")]);

// ─── 1. O'CHIRILGAN FAYLLAR HAQIQATAN YO'Q ───────────────────────────────────

describe("O'CHIRILGAN FAYLLAR — mavjud emasligi tekshiriladi", () => {
  it("productService.ts o'chirilgan", () => {
    expect(existsSync(join(SRC, "services", "productService.ts"))).toBe(false);
  });

  it("firebase-debug.log o'chirilgan", () => {
    expect(existsSync(join(ROOT, "firebase-debug.log"))).toBe(false);
  });

  it("ui/button.tsx o'chirilgan (ishlatilmasdi)", () => {
    expect(existsSync(join(UI_DIR, "button.tsx"))).toBe(false);
  });

  it("ui/sidebar.tsx o'chirilgan (ishlatilmasdi)", () => {
    expect(existsSync(join(UI_DIR, "sidebar.tsx"))).toBe(false);
  });
});

// ─── 2. QOLGAN UI KOMPONENTLAR TO'G'RI ──────────────────────────────────────

describe("QOLGAN UI KOMPONENTLAR — faqat ishlatilganlar bor", () => {
  const remainingUi = readdirSync(UI_DIR).filter((f) => f.endsWith(".tsx"));

  it("ui papkasida faqat 2 ta komponent qolgan", () => {
    expect(remainingUi).toHaveLength(2);
  });

  it("sonner.tsx mavjud (ishlatiladi: __root.tsx)", () => {
    expect(remainingUi).toContain("sonner.tsx");
  });

  it("sheet.tsx mavjud (ishlatiladi: PickupSheet, DeliveryMapSheet)", () => {
    expect(remainingUi).toContain("sheet.tsx");
  });

  it("sonner app kodida import qilingan", () => {
    expect(appCode).toContain("@/components/ui/sonner");
  });

  it("sheet app kodida import qilingan", () => {
    expect(appCode).toContain("@/components/ui/sheet");
  });
});

// ─── 3. MOCKDATA FAQAT SETTINGS EKSPORT QILADI ───────────────────────────────

describe("mockData.ts — faqat settings qolgan", () => {
  const mockData = readFileSync(join(SRC, "data", "mockData.ts"), "utf-8");

  it("settings eksport qilingan", () => {
    expect(mockData).toContain("export const settings");
  });

  it("products array o'chirilgan", () => {
    expect(mockData).not.toContain("export const products");
  });

  it("categories array o'chirilgan", () => {
    expect(mockData).not.toContain("export const categories");
  });

  it("img helper o'chirilgan", () => {
    expect(mockData).not.toContain("const img =");
  });

  it("mockData settings catalogStore da ishlatiladi", () => {
    const catalogStore = readFileSync(join(SRC, "store", "catalogStore.ts"), "utf-8");
    expect(catalogStore).toContain('from "@/data/mockData"');
  });
});

// ─── 4. ISHLATILMAGAN DEPENDENCY'LAR QAYTIB KELMASLIGI ───────────────────────

describe("DEPENDENCY GIGIYENASI — ishlatilmagan paketlar package.json da yo'q", () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf-8"));
  const deps = pkg.dependencies ?? {};

  // Bularning hammasi src/ da grep bilan tekshirilgan — hech qayerda import qilinmaydi.
  const FORBIDDEN_DEPS = [
    "@hookform/resolvers",
    "react-hook-form",
    "cmdk",
    "date-fns",
    "embla-carousel-react",
    "input-otp",
    "react-day-picker",
    "react-resizable-panels",
    "recharts",
    "vaul",
    "@radix-ui/react-accordion",
    "@radix-ui/react-alert-dialog",
    "@radix-ui/react-aspect-ratio",
    "@radix-ui/react-avatar",
    "@radix-ui/react-checkbox",
    "@radix-ui/react-collapsible",
    "@radix-ui/react-context-menu",
    "@radix-ui/react-dropdown-menu",
    "@radix-ui/react-hover-card",
    "@radix-ui/react-label",
    "@radix-ui/react-menubar",
    "@radix-ui/react-navigation-menu",
    "@radix-ui/react-popover",
    "@radix-ui/react-progress",
    "@radix-ui/react-radio-group",
    "@radix-ui/react-scroll-area",
    "@radix-ui/react-select",
    "@radix-ui/react-separator",
    "@radix-ui/react-slider",
    "@radix-ui/react-slot",
    "@radix-ui/react-switch",
    "@radix-ui/react-tabs",
    "@radix-ui/react-toggle",
    "@radix-ui/react-toggle-group",
    "@radix-ui/react-tooltip",
  ];

  it.each(FORBIDDEN_DEPS)("ishlatilmagan paket qayta qo'shilmagan: %s", (dep) => {
    expect(deps[dep]).toBeUndefined();
  });

  it("faqat bitta @radix-ui paketi qolgan (react-dialog)", () => {
    const radix = Object.keys(deps).filter((d) => d.startsWith("@radix-ui/"));
    expect(radix).toEqual(["@radix-ui/react-dialog"]);
  });

  it("haqiqatan ishlatiladigan asosiy paketlar saqlangan", () => {
    for (const dep of [
      "react",
      "react-dom",
      "@radix-ui/react-dialog",
      "sonner",
      "zustand",
      "firebase",
      "zod",
      "lucide-react",
    ]) {
      expect(deps[dep]).toBeDefined();
    }
  });
});

// ─── 5. XAVFSIZLIK ────────────────────────────────────────────────────────────

describe("XAVFSIZLIK — src kodida maxfiy kalitlar yo'q", () => {
  it("Bot token hardcode qilinmagan", () => {
    expect(appCode).not.toContain("8731990332:AAG");
  });

  it("Firebase private key yo'q", () => {
    expect(appCode).not.toContain("-----BEGIN PRIVATE KEY-----");
  });

  it("firebase.ts faqat env variables ishlatadi", () => {
    const firebaseTs = readFileSync(join(SRC, "services", "firebase.ts"), "utf-8");
    expect(firebaseTs).toContain("import.meta.env");
    expect(firebaseTs).not.toContain("AIzaSy");
  });
});
