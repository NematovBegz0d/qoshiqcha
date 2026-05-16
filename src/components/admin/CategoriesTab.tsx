import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCatalog, newId } from "@/store/catalogStore";
import { haptic, notify } from "@/lib/telegram";
import type { Category } from "@/lib/types";
import { IconBtn, Field, Modal } from "./ui";

export function CategoriesTab() {
  const categories = useCatalog((s) => s.categories);
  const products = useCatalog((s) => s.products);
  const addCategory = useCatalog((s) => s.addCategory);
  const updateCategory = useCatalog((s) => s.updateCategory);
  const deleteCategory = useCatalog((s) => s.deleteCategory);

  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-3">
      <button
        onClick={() => {
          haptic("medium");
          setCreating(true);
        }}
        className="w-full h-11 rounded-xl bg-gradient-primary text-primary-foreground shadow-soft text-sm font-bold flex items-center justify-center gap-1.5 active:scale-95"
      >
        <Plus className="w-4 h-4" /> Yangi kategoriya
      </button>

      <div className="space-y-2">
        {categories.map((c) => {
          const count = products.filter((p) => p.categoryId === c.id).length;
          return (
            <div
              key={c.id}
              className="p-3 rounded-2xl bg-card border border-border shadow-card flex items-center gap-3"
            >
              <div className="w-12 h-12 grid place-items-center rounded-xl bg-secondary text-2xl">
                {c.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{c.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {count} ta mahsulot · #{c.order} · {c.active ? "faol" : "yopiq"}
                </p>
              </div>
              <IconBtn onClick={() => setEditing(c)} title="Tahrirlash">
                <Pencil className="w-4 h-4" />
              </IconBtn>
              <IconBtn
                destructive
                onClick={() => {
                  toast.warning(`"${c.name}" va uning ${count} ta mahsuloti o'chirilsinmi?`, {
                    action: {
                      label: "O'chirish",
                      onClick: async () => {
                        try {
                          await deleteCategory(c.id);
                          notify("success");
                        } catch (err) {
                          console.error("[admin] deleteCategory xatosi:", err);
                          toast.error(err instanceof Error ? err.message : "O'chirib bo'lmadi.");
                        }
                      },
                    },
                    cancel: { label: "Bekor", onClick: () => {} },
                  });
                }}
                title="O'chirish"
              >
                <Trash2 className="w-4 h-4" />
              </IconBtn>
            </div>
          );
        })}
      </div>

      {(creating || editing) && (
        <CategoryFormModal
          category={editing}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSave={async (c) => {
            try {
              if (editing) await updateCategory(editing.id, c);
              else await addCategory({ ...c, id: newId("cat") });
              notify("success");
              setEditing(null);
              setCreating(false);
            } catch (err) {
              console.error("[admin] category save xatosi:", err);
              notify("error");
              throw err;
            }
          }}
        />
      )}
    </div>
  );
}

const CAT_LANG_TABS = [
  { key: "uz" as const, label: "UZ", required: true },
  { key: "ru" as const, label: "RU", required: false },
  { key: "en" as const, label: "EN", required: false },
];

function CategoryFormModal({
  category,
  onClose,
  onSave,
}: {
  category: Category | null;
  onClose: () => void;
  onSave: (c: Category) => void | Promise<void>;
}) {
  const [form, setForm] = useState<Category>(
    category ?? { id: "", name: "", slug: "", icon: "🍽️", order: 99, active: true },
  );
  const [langTab, setLangTab] = useState<"uz" | "ru" | "en">("uz");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const set = <K extends keyof Category>(k: K, v: Category[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Nomini kiriting");
      return;
    }
    if (!form.icon.trim()) {
      toast.error("Ikonkani kiriting");
      return;
    }
    const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, "-");
    setSaving(true);
    setSaveError(null);
    try {
      await onSave({ ...form, slug });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Kategoriya saqlanmadi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={category ? "Kategoriyani tahrirlash" : "Yangi kategoriya"} onClose={onClose}>
      <div className="space-y-3">
        {/* Til tablar */}
        <div className="flex gap-1 p-1 rounded-xl bg-muted">
          {CAT_LANG_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setLangTab(t.key)}
              className={`flex-1 h-8 rounded-lg text-xs font-bold transition-colors ${
                langTab === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              {t.label}
              {t.required && <span className="text-destructive ml-0.5">*</span>}
            </button>
          ))}
        </div>

        {langTab === "uz" && (
          <div className="grid grid-cols-[80px_1fr] gap-2">
            <Field label="Ikon">
              <input
                value={form.icon}
                onChange={(e) => set("icon", e.target.value)}
                className="form-input text-center text-xl"
                maxLength={4}
              />
            </Field>
            <Field label="Nomi (UZ) *">
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className="form-input"
              />
            </Field>
          </div>
        )}
        {langTab === "ru" && (
          <Field label="Nomi (RU)">
            <input
              value={form.name_ru ?? ""}
              onChange={(e) => set("name_ru", e.target.value || undefined)}
              className="form-input"
              placeholder="Название на русском"
            />
          </Field>
        )}
        {langTab === "en" && (
          <Field label="Nomi (EN)">
            <input
              value={form.name_en ?? ""}
              onChange={(e) => set("name_en", e.target.value || undefined)}
              className="form-input"
              placeholder="Name in English"
            />
          </Field>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Field label="Slug">
            <input
              value={form.slug}
              onChange={(e) => set("slug", e.target.value)}
              className="form-input"
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
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => set("active", e.target.checked)}
            className="w-4 h-4 accent-primary"
          />
          Faol
        </label>
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
        {saveError && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
            {saveError}
          </div>
        )}
      </div>
    </Modal>
  );
}
