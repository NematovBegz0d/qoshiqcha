import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, Search } from "lucide-react";
import { toast } from "sonner";
import { useCatalog, newId } from "@/store/catalogStore";
import { formatUZS } from "@/lib/format";
import { haptic, notify } from "@/lib/telegram";
import type { Product, Variant, Modifier, ModifierOption } from "@/lib/types";
import { FilterChip, IconBtn, Field, Modal } from "./ui";

export function ProductsTab() {
  const products = useCatalog((s) => s.products);
  const categories = useCatalog((s) => s.categories);
  const deleteProduct = useCatalog((s) => s.deleteProduct);
  const toggleActive = useCatalog((s) => s.toggleProductActive);

  const [q, setQ] = useState("");
  const [catFilter, setCatFilter] = useState<string | "all">("all");
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    const t = q.toLowerCase();
    return products
      .filter((p) => (catFilter === "all" ? true : p.categoryId === catFilter))
      .filter(
        (p) =>
          !t ||
          p.name.toLowerCase().includes(t) ||
          (p.name_ru?.toLowerCase().includes(t) ?? false) ||
          (p.name_en?.toLowerCase().includes(t) ?? false),
      );
  }, [products, q, catFilter]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Mahsulot izlash..."
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-card border border-border text-sm outline-none focus:border-primary"
          />
        </div>
        <button
          onClick={() => {
            haptic("medium");
            setCreating(true);
          }}
          className="h-10 px-3 rounded-xl bg-gradient-primary text-primary-foreground shadow-soft text-xs font-bold flex items-center gap-1 active:scale-95"
        >
          <Plus className="w-4 h-4" /> Yangi
        </button>
      </div>

      <div className="no-scrollbar overflow-x-auto -mx-4 px-4">
        <div className="flex gap-2 w-max">
          <FilterChip
            label="Barchasi"
            active={catFilter === "all"}
            onClick={() => setCatFilter("all")}
          />
          {categories.map((c) => (
            <FilterChip
              key={c.id}
              label={`${c.icon} ${c.name}`}
              active={catFilter === c.id}
              onClick={() => setCatFilter(c.id)}
            />
          ))}
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">{filtered.length} ta topildi</p>

      <div className="space-y-2">
        {filtered.map((p) => {
          const cat = categories.find((c) => c.id === p.categoryId);
          return (
            <div
              key={p.id}
              className="p-2.5 rounded-2xl bg-card border border-border shadow-card flex gap-2.5"
            >
              <img
                src={p.image}
                alt={p.name}
                className="w-16 h-16 rounded-xl object-cover bg-muted flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {cat?.icon} {cat?.name} · {p.weight ?? "—"}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      p.active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {p.active ? "Faol" : "Yopiq"}
                  </span>
                </div>
                <div className="mt-1.5 flex items-end justify-between gap-2">
                  <span className="text-sm font-bold text-primary">{formatUZS(p.price)}</span>
                  <div className="flex gap-1">
                    <IconBtn
                      onClick={async () => {
                        try {
                          await toggleActive(p.id);
                        } catch (err) {
                          console.error("[admin] toggleActive xatosi:", err);
                          notify("error");
                        }
                      }}
                      title={p.active ? "Yopish" : "Ochish"}
                    >
                      {p.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </IconBtn>
                    <IconBtn onClick={() => setEditing(p)} title="Tahrirlash">
                      <Pencil className="w-4 h-4" />
                    </IconBtn>
                    <IconBtn
                      destructive
                      onClick={() => {
                        toast.warning(`"${p.name}" o'chirilsinmi?`, {
                          action: {
                            label: "O'chirish",
                            onClick: async () => {
                              try {
                                await deleteProduct(p.id);
                                notify("success");
                              } catch (err) {
                                console.error("[admin] deleteProduct xatosi:", err);
                                toast.error(
                                  err instanceof Error ? err.message : "O'chirib bo'lmadi.",
                                );
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
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-center py-10 text-sm text-muted-foreground">Mahsulot topilmadi</p>
        )}
      </div>

      {(creating || editing) && (
        <ProductFormModal
          product={editing}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
        />
      )}
    </div>
  );
}

function VariantsEditor({
  variants,
  onChange,
}: {
  variants: Variant[];
  onChange: (v: Variant[]) => void;
}) {
  const addVariant = () => {
    if (variants.length >= 20) return;
    onChange([...variants, { id: `v-${Date.now().toString(36)}`, name: "", price: 0 }]);
  };

  const update = (index: number, field: keyof Variant, value: string | number) =>
    onChange(variants.map((v, i) => (i === index ? { ...v, [field]: value } : v)));

  const remove = (index: number) => onChange(variants.filter((_, i) => i !== index));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Variantlar ({variants.length}/20)
        </span>
        <button
          type="button"
          onClick={addVariant}
          disabled={variants.length >= 20}
          className="h-7 px-2.5 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center gap-1 active:scale-95 disabled:opacity-50"
        >
          <Plus className="w-3 h-3" /> Qo'shish
        </button>
      </div>
      {variants.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-3 rounded-xl border border-dashed border-border">
          Variant yo'q — mahsulot bitta narxda sotiladi
        </p>
      ) : (
        <div className="space-y-1.5">
          {variants.map((v, i) => (
            <div key={v.id} className="flex gap-2 items-center p-2 rounded-xl bg-muted/50">
              <div className="flex-1 grid grid-cols-[1fr_90px] gap-1.5">
                <input
                  value={v.name}
                  onChange={(e) => update(i, "name", e.target.value)}
                  placeholder="Variant nomi"
                  className="form-input text-xs h-8"
                />
                <input
                  type="number"
                  value={v.price || ""}
                  onChange={(e) => update(i, "price", Number(e.target.value) || 0)}
                  placeholder="Narxi"
                  className="form-input text-xs h-8"
                />
              </div>
              <button
                type="button"
                onClick={() => remove(i)}
                className="w-8 h-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center active:scale-90 shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ModifiersEditor({
  modifiers,
  onChange,
}: {
  modifiers: Modifier[];
  onChange: (m: Modifier[]) => void;
}) {
  const addModifier = () => {
    if (modifiers.length >= 20) return;
    onChange([
      ...modifiers,
      {
        id: `mod-${Date.now().toString(36)}`,
        name: "",
        type: "multi",
        maxSelect: 1,
        required: false,
        options: [],
      },
    ]);
  };

  const updateMod = (mi: number, patch: Partial<Modifier>) =>
    onChange(modifiers.map((m, i) => (i === mi ? { ...m, ...patch } : m)));

  const removeMod = (mi: number) => onChange(modifiers.filter((_, i) => i !== mi));

  const addOption = (mi: number) => {
    const mod = modifiers[mi];
    if (mod.options.length >= 30) return;
    updateMod(mi, {
      options: [...mod.options, { id: `opt-${Date.now().toString(36)}`, name: "", price: 0 }],
    });
  };

  const updateOption = (
    mi: number,
    oi: number,
    field: keyof ModifierOption,
    value: string | number,
  ) =>
    updateMod(mi, {
      options: modifiers[mi].options.map((o, i) => (i === oi ? { ...o, [field]: value } : o)),
    });

  const removeOption = (mi: number, oi: number) =>
    updateMod(mi, { options: modifiers[mi].options.filter((_, i) => i !== oi) });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Modifierlar ({modifiers.length}/20)
        </span>
        <button
          type="button"
          onClick={addModifier}
          disabled={modifiers.length >= 20}
          className="h-7 px-2.5 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center gap-1 active:scale-95 disabled:opacity-50"
        >
          <Plus className="w-3 h-3" /> Qo'shish
        </button>
      </div>
      {modifiers.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-3 rounded-xl border border-dashed border-border">
          Modifier yo'q
        </p>
      ) : (
        <div className="space-y-3">
          {modifiers.map((mod, mi) => (
            <div key={mod.id} className="p-3 rounded-xl border border-border bg-muted/30 space-y-2">
              <div className="flex gap-2 items-center">
                <input
                  value={mod.name}
                  onChange={(e) => updateMod(mi, { name: e.target.value })}
                  placeholder="Modifier nomi (masalan: Sous)"
                  className="form-input text-xs h-8 flex-1"
                />
                <button
                  type="button"
                  onClick={() => removeMod(mi)}
                  className="w-8 h-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center active:scale-90 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex rounded-lg overflow-hidden border border-border text-xs">
                  <button
                    type="button"
                    onClick={() => updateMod(mi, { type: "single" })}
                    className={`px-2.5 h-7 font-semibold transition-colors ${mod.type === "single" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}
                  >
                    Single
                  </button>
                  <button
                    type="button"
                    onClick={() => updateMod(mi, { type: "multi" })}
                    className={`px-2.5 h-7 font-semibold transition-colors ${mod.type === "multi" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}
                  >
                    Multi
                  </button>
                </div>
                <label className="flex items-center gap-1.5 text-xs">
                  <input
                    type="checkbox"
                    checked={mod.required}
                    onChange={(e) => updateMod(mi, { required: e.target.checked })}
                    className="w-3.5 h-3.5 accent-primary"
                  />
                  Majburiy
                </label>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-muted-foreground">Max:</span>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={mod.maxSelect}
                    onChange={(e) =>
                      updateMod(mi, { maxSelect: Math.max(1, Number(e.target.value) || 1) })
                    }
                    className="form-input text-xs h-7 w-14"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                {mod.options.map((opt, oi) => (
                  <div key={opt.id} className="flex gap-1.5 items-center">
                    <input
                      value={opt.name}
                      onChange={(e) => updateOption(mi, oi, "name", e.target.value)}
                      placeholder="Option nomi"
                      className="form-input text-xs h-7 flex-1"
                    />
                    <input
                      type="number"
                      value={opt.price || ""}
                      onChange={(e) => updateOption(mi, oi, "price", Number(e.target.value) || 0)}
                      placeholder="Narxi"
                      className="form-input text-xs h-7 w-20"
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(mi, oi)}
                      className="w-7 h-7 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center active:scale-90 shrink-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addOption(mi)}
                  disabled={mod.options.length >= 30}
                  className="w-full h-7 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:text-primary hover:border-primary transition-colors disabled:opacity-50"
                >
                  + Option qo'shish
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const LANG_TABS = [
  { key: "uz" as const, label: "UZ", required: true },
  { key: "ru" as const, label: "RU", required: false },
  { key: "en" as const, label: "EN", required: false },
];

function ProductFormModal({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const categories = useCatalog((s) => s.categories);
  const addProduct = useCatalog((s) => s.addProduct);
  const updateProduct = useCatalog((s) => s.updateProduct);

  const [form, setForm] = useState<Product>(
    product ?? {
      id: newId("p"),
      name: "",
      slug: "",
      categoryId: categories[0]?.id ?? "",
      description: "",
      image:
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80",
      price: 0,
      weight: "",
      rating: 5,
      reviewsCount: 0,
      active: true,
    },
  );
  const [langTab, setLangTab] = useState<"uz" | "ru" | "en">("uz");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const set = <K extends keyof Product>(k: K, v: Product[K]) => setForm((f) => ({ ...f, [k]: v }));

  const onSave = async () => {
    if (!form.name.trim()) {
      toast.error("Nomini kiriting");
      return;
    }
    if (form.price <= 0) {
      toast.error("Narxni kiriting");
      return;
    }
    if (!form.categoryId) {
      toast.error("Kategoriyani tanlang");
      return;
    }
    if (!form.image.trim()) {
      toast.error("Rasm URL kiriting");
      return;
    }
    const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, "-").slice(0, 60);
    const payload = { ...form, slug, oldPrice: form.oldPrice ?? null };
    setSaving(true);
    setSaveError(null);
    try {
      if (product) {
        await updateProduct(product.id, payload);
      } else {
        await addProduct(payload);
      }
      notify("success");
      haptic("medium");
      onClose();
    } catch (err) {
      console.error("[admin] product save xatosi:", err);
      notify("error");
      setSaveError(err instanceof Error ? err.message : "Mahsulot saqlanmadi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={product ? "Mahsulotni tahrirlash" : "Yangi mahsulot"} onClose={onClose}>
      <div className="space-y-3">
        {form.image && (
          <img src={form.image} alt="" className="w-full h-40 object-cover rounded-xl bg-muted" />
        )}
        <Field label="Rasm URL">
          <input
            value={form.image}
            onChange={(e) => set("image", e.target.value)}
            className="form-input"
            placeholder="https://..."
          />
        </Field>

        {/* Til tablar */}
        <div className="flex gap-1 p-1 rounded-xl bg-muted">
          {LANG_TABS.map((t) => (
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
          <>
            <Field label="Nomi (UZ) *">
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className="form-input"
              />
            </Field>
            <Field label="Tavsif (UZ)">
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={3}
                className="form-input resize-none"
              />
            </Field>
          </>
        )}
        {langTab === "ru" && (
          <>
            <Field label="Nomi (RU)">
              <input
                value={form.name_ru ?? ""}
                onChange={(e) => set("name_ru", e.target.value || undefined)}
                className="form-input"
                placeholder="Название на русском"
              />
            </Field>
            <Field label="Tavsif (RU)">
              <textarea
                value={form.description_ru ?? ""}
                onChange={(e) => set("description_ru", e.target.value || undefined)}
                rows={3}
                className="form-input resize-none"
                placeholder="Описание на русском"
              />
            </Field>
          </>
        )}
        {langTab === "en" && (
          <>
            <Field label="Nomi (EN)">
              <input
                value={form.name_en ?? ""}
                onChange={(e) => set("name_en", e.target.value || undefined)}
                className="form-input"
                placeholder="Name in English"
              />
            </Field>
            <Field label="Tavsif (EN)">
              <textarea
                value={form.description_en ?? ""}
                onChange={(e) => set("description_en", e.target.value || undefined)}
                rows={3}
                className="form-input resize-none"
                placeholder="Description in English"
              />
            </Field>
          </>
        )}

        <Field label="Kategoriya *">
          <select
            value={form.categoryId}
            onChange={(e) => set("categoryId", e.target.value)}
            className="form-input"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Narxi (UZS) *">
            <input
              type="number"
              value={form.price}
              onChange={(e) => set("price", Number(e.target.value) || 0)}
              className="form-input"
            />
          </Field>
          <Field label="Eski narx">
            <input
              type="number"
              value={form.oldPrice ?? ""}
              onChange={(e) => set("oldPrice", e.target.value ? Number(e.target.value) : null)}
              className="form-input"
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Og'irligi">
            <input
              value={form.weight ?? ""}
              onChange={(e) => set("weight", e.target.value)}
              className="form-input"
              placeholder="500 g"
            />
          </Field>
          <Field label="Boshlang'ich reyting">
            <input
              type="number"
              step="0.1"
              min="0"
              max="5"
              value={form.rating}
              onChange={(e) => set("rating", Number(e.target.value) || 0)}
              className="form-input"
              title="Sharhlar bo'lmasa ko'rsatiladigan reyting (fallback)"
            />
          </Field>
        </div>
        <div className="flex gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => set("active", e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            Faol (sotuvda)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!form.popular}
              onChange={(e) => set("popular", e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            Mashhur
          </label>
        </div>

        {/* Variantlar */}
        <div className="rounded-2xl border border-border p-3 space-y-2">
          <VariantsEditor
            variants={form.variants ?? []}
            onChange={(v) => set("variants", v.length ? v : undefined)}
          />
        </div>

        {/* Modifierlar */}
        <div className="rounded-2xl border border-border p-3 space-y-2">
          <ModifiersEditor
            modifiers={form.modifiers ?? []}
            onChange={(m) => set("modifiers", m.length ? m : undefined)}
          />
        </div>

        {saveError && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
            {saveError}
          </div>
        )}
        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 h-11 rounded-xl bg-secondary text-foreground font-semibold text-sm"
          >
            Bekor
          </button>
          <button
            onClick={onSave}
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
