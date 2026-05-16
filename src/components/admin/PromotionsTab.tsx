import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { usePromotions } from "@/store/promotionsStore";
import { adminApi } from "@/services/adminApi";
import { newId } from "@/store/catalogStore";
import { haptic, notify } from "@/lib/telegram";
import type { Promotion } from "@/lib/types";
import { IconBtn, Field, Modal } from "./ui";

const PROMO_COLORS = [
  { label: "🌸 Pushti", value: "from-pink-500 to-rose-500" },
  { label: "🟠 To'q sariq", value: "from-amber-500 to-orange-500" },
  { label: "💜 Binafsha", value: "from-fuchsia-500 to-purple-500" },
  { label: "💚 Yashil", value: "from-green-500 to-emerald-500" },
  { label: "💙 Ko'k", value: "from-blue-500 to-indigo-500" },
  { label: "❤️ Qizil", value: "from-red-500 to-rose-700" },
];

export function PromotionsTab() {
  const { promotions, loading, load } = usePromotions();
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = (p: Promotion) => {
    toast.warning(`"${p.title}" o'chirilsinmi?`, {
      action: {
        label: "O'chirish",
        onClick: async () => {
          try {
            await adminApi.deletePromotion(p.id);
            await load();
            notify("success");
          } catch (err) {
            console.error("[admin] deletePromotion xatosi:", err);
            toast.error(err instanceof Error ? err.message : "O'chirib bo'lmadi.");
          }
        },
      },
      cancel: { label: "Bekor", onClick: () => {} },
    });
  };

  const handleToggle = async (p: Promotion) => {
    try {
      await adminApi.updatePromotion(p.id, { active: !p.active });
      await load();
      haptic("light");
    } catch (err) {
      console.error("[admin] togglePromotion xatosi:", err);
      notify("error");
    }
  };

  if (loading) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Yuklanmoqda...</p>;
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => {
          haptic("medium");
          setCreating(true);
        }}
        className="w-full h-11 rounded-xl bg-gradient-primary text-primary-foreground shadow-soft text-sm font-bold flex items-center justify-center gap-1.5 active:scale-95"
      >
        <Plus className="w-4 h-4" /> Yangi aksiya
      </button>

      <div className="space-y-2">
        {promotions.map((p) => (
          <div key={p.id} className="rounded-2xl overflow-hidden border border-border shadow-card">
            <div
              className={`bg-gradient-to-br ${p.color} text-white px-4 py-3 flex items-center gap-3`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-lg font-extrabold leading-none">{p.badge}</p>
                <p className="text-xs opacity-90 mt-0.5 truncate">{p.title}</p>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 ${
                  p.active ? "text-white" : "opacity-60"
                }`}
              >
                {p.active ? "Faol" : "Yopiq"}
              </span>
            </div>
            <div className="px-3 py-2 bg-card flex items-center justify-between gap-2">
              <p className="text-[11px] text-muted-foreground truncate">
                {p.description} · {p.expiresAt}
              </p>
              <div className="flex gap-1 shrink-0">
                <IconBtn onClick={() => handleToggle(p)} title={p.active ? "Yopish" : "Ochish"}>
                  {p.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </IconBtn>
                <IconBtn onClick={() => setEditing(p)} title="Tahrirlash">
                  <Pencil className="w-4 h-4" />
                </IconBtn>
                <IconBtn destructive onClick={() => handleDelete(p)} title="O'chirish">
                  <Trash2 className="w-4 h-4" />
                </IconBtn>
              </div>
            </div>
          </div>
        ))}
        {promotions.length === 0 && (
          <p className="text-center py-10 text-sm text-muted-foreground">Aksiya yo'q</p>
        )}
      </div>

      {(creating || editing) && (
        <PromotionFormModal
          promotion={editing}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSaved={async () => {
            await load();
            setEditing(null);
            setCreating(false);
          }}
        />
      )}
    </div>
  );
}

function PromotionFormModal({
  promotion,
  onClose,
  onSaved,
}: {
  promotion: Promotion | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState<Promotion>(
    promotion ?? {
      id: newId("promo"),
      title: "",
      description: "",
      badge: "",
      color: "from-pink-500 to-rose-500",
      expiresAt: "Doimiy",
      active: true,
      order: 99,
    },
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const set = <K extends keyof Promotion>(k: K, v: Promotion[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Nomini kiriting");
      return;
    }
    if (!form.badge.trim()) {
      toast.error("Badge kiriting (masalan: 20%, FREE)");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      if (promotion) {
        await adminApi.updatePromotion(promotion.id, form);
      } else {
        await adminApi.createPromotion(form);
      }
      notify("success");
      haptic("medium");
      await onSaved();
    } catch (err) {
      console.error("[admin] promotion save xatosi:", err);
      notify("error");
      setSaveError(err instanceof Error ? err.message : "Aksiya saqlanmadi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={promotion ? "Aksiyani tahrirlash" : "Yangi aksiya"} onClose={onClose}>
      <div className="space-y-3">
        {/* Preview */}
        <div className={`bg-gradient-to-br ${form.color} text-white rounded-xl p-4`}>
          <p className="text-2xl font-extrabold">{form.badge || "20%"}</p>
          <p className="text-sm mt-1 opacity-90">{form.title || "Aksiya nomi"}</p>
        </div>

        <Field label="Nomi (UZ) *">
          <input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            className="form-input"
            placeholder="Yangi mijozlarga -20%"
          />
        </Field>
        <Field label="Nomi (RU)">
          <input
            value={form.title_ru ?? ""}
            onChange={(e) => set("title_ru", e.target.value)}
            className="form-input"
            placeholder="Скидка 20% новым клиентам"
          />
        </Field>
        <Field label="Tavsif (UZ)">
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={2}
            className="form-input resize-none"
          />
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label="Badge *">
            <input
              value={form.badge}
              onChange={(e) => set("badge", e.target.value)}
              className="form-input"
              placeholder="20%, FREE, +1"
            />
          </Field>
          <Field label="Tartib">
            <input
              type="number"
              value={form.order}
              onChange={(e) => set("order", Number(e.target.value) || 0)}
              className="form-input"
            />
          </Field>
        </div>

        <Field label="Rang">
          <select
            value={form.color}
            onChange={(e) => set("color", e.target.value)}
            className="form-input"
          >
            {PROMO_COLORS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Amal qilish muddati">
          <input
            value={form.expiresAt}
            onChange={(e) => set("expiresAt", e.target.value)}
            className="form-input"
            placeholder="31.12.2026 yoki Doimiy"
          />
        </Field>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => set("active", e.target.checked)}
            className="w-4 h-4 accent-primary"
          />
          Faol (foydalanuvchilarga ko'rinadi)
        </label>

        {saveError && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
            {saveError}
          </div>
        )}
        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 h-11 rounded-xl bg-secondary font-semibold text-sm"
          >
            Bekor
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 h-11 rounded-xl bg-gradient-primary text-primary-foreground font-bold text-sm shadow-soft disabled:opacity-70"
          >
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
