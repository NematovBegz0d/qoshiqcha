import { useState } from "react";
import { useCatalog } from "@/store/catalogStore";
import { haptic, notify } from "@/lib/telegram";
import type { Settings } from "@/lib/types";
import { Field } from "./ui";

export function SettingsTab() {
  const shopSettings = useCatalog((s) => s.shopSettings);
  const update = useCatalog((s) => s.updateShopSettings);
  const reloadCatalog = useCatalog((s) => s.loadFromFirestore);
  const [form, setForm] = useState<Settings>(shopSettings);
  const [saving, setSaving] = useState(false);
  const [reloading, setReloading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-3">
      <div className="p-4 rounded-2xl bg-card border border-border shadow-card space-y-3">
        <h3 className="text-sm font-bold">Do'kon</h3>
        <label className="flex items-center justify-between">
          <span className="text-sm">Do'kon ochiq</span>
          <input
            type="checkbox"
            checked={form.shopIsOpen}
            onChange={(e) => set("shopIsOpen", e.target.checked)}
            className="w-5 h-5 accent-primary"
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Ish boshlash">
            <input
              type="time"
              value={form.workingHours.from}
              onChange={(e) => set("workingHours", { ...form.workingHours, from: e.target.value })}
              className="form-input"
            />
          </Field>
          <Field label="Ish tugash">
            <input
              type="time"
              value={form.workingHours.to}
              onChange={(e) => set("workingHours", { ...form.workingHours, to: e.target.value })}
              className="form-input"
            />
          </Field>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-card border border-border shadow-card space-y-3">
        <h3 className="text-sm font-bold">Yetkazib berish</h3>
        <Field label="Yetkazib berish narxi (UZS)">
          <input
            type="number"
            value={form.deliveryPrice}
            onChange={(e) => set("deliveryPrice", Number(e.target.value) || 0)}
            className="form-input"
          />
        </Field>
        <Field label="Bepul yetkazib berish (dan)">
          <input
            type="number"
            value={form.freeDeliveryFrom}
            onChange={(e) => set("freeDeliveryFrom", Number(e.target.value) || 0)}
            className="form-input"
          />
        </Field>
        <Field label="Minimal buyurtma (UZS)">
          <input
            type="number"
            value={form.minOrderPrice}
            onChange={(e) => set("minOrderPrice", Number(e.target.value) || 0)}
            className="form-input"
          />
        </Field>
      </div>

      {saveError && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
          {saveError}
        </div>
      )}

      <button
        onClick={async () => {
          setSaving(true);
          setSaveError(null);
          try {
            await update({
              deliveryPrice: form.deliveryPrice,
              freeDeliveryFrom: form.freeDeliveryFrom,
              minOrderPrice: form.minOrderPrice,
              workingHours: form.workingHours,
              shopIsOpen: form.shopIsOpen,
            });
            notify("success");
            haptic("medium");
          } catch (err) {
            console.error("[SettingsTab] Firestore write xatosi:", err);
            setSaveError("Saqlanmadi. Internetni yoki Firebase sozlamalarini tekshiring.");
          } finally {
            setSaving(false);
          }
        }}
        disabled={saving}
        className="w-full h-12 rounded-xl bg-gradient-primary text-primary-foreground font-bold text-sm shadow-soft disabled:opacity-70"
      >
        {saving ? "Saqlanmoqda..." : "Sozlamalarni saqlash"}
      </button>

      <button
        onClick={async () => {
          setReloading(true);
          setSaveError(null);
          try {
            await reloadCatalog();
            setForm(useCatalog.getState().shopSettings);
            notify("success");
          } catch (err) {
            console.error("[SettingsTab] catalog reload xatosi:", err);
            setSaveError("Ma'lumotlar qayta yuklanmadi. Internetni tekshiring.");
          } finally {
            setReloading(false);
          }
        }}
        disabled={reloading}
        className="w-full h-11 rounded-xl bg-secondary text-foreground font-semibold text-sm disabled:opacity-70"
      >
        {reloading ? "Yuklanmoqda..." : "Ma'lumotlarni qayta yuklash"}
      </button>
    </div>
  );
}
