import { useState } from "react";
import { Plus, Pencil, Trash2, MapPin } from "lucide-react";
import { useCatalog, newId } from "@/store/catalogStore";
import { haptic, notify } from "@/lib/telegram";
import type { Branch } from "@/lib/types";
import { Field } from "./ui";

const EMPTY: Omit<Branch, "id"> = {
  name: "",
  address: "",
  phone: "",
  hours: "",
  openFrom: "09:00",
  openTo: "23:00",
  lat: 39.7747,
  lng: 64.4286,
};

export function BranchesTab() {
  const branches = useCatalog((s) => s.branches);
  const addBranch = useCatalog((s) => s.addBranch);
  const updateBranch = useCatalog((s) => s.updateBranch);
  const deleteBranch = useCatalog((s) => s.deleteBranch);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState<Omit<Branch, "id">>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const startEdit = (b: Branch) => {
    const { id, ...rest } = b;
    setForm(rest);
    setEditingId(id);
    setShowNew(false);
    setError(null);
  };

  const startNew = () => {
    setForm(EMPTY);
    setShowNew(true);
    setEditingId(null);
    setError(null);
  };

  const cancel = () => {
    setEditingId(null);
    setShowNew(false);
    setError(null);
  };

  const save = async () => {
    if (!form.name.trim() || !form.address.trim()) {
      setError("Nomi va manzil kiritilishi shart");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await updateBranch(editingId, form);
      } else {
        await addBranch({ id: newId("branch"), ...form });
        setShowNew(false);
      }
      setEditingId(null);
      notify("success");
      haptic("medium");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Saqlanmadi");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string, name: string) => {
    if (!confirm(`"${name}" filialini o'chirasizmi?`)) return;
    try {
      await deleteBranch(id);
      haptic("medium");
    } catch (err) {
      alert(err instanceof Error ? err.message : "O'chirilmadi");
    }
  };

  return (
    <div className="space-y-3">
      <button
        onClick={startNew}
        className="w-full h-11 rounded-xl border-2 border-dashed border-border text-sm font-semibold flex items-center justify-center gap-2 text-muted-foreground active:bg-secondary"
      >
        <Plus className="w-4 h-4" /> Yangi filial qo'shish
      </button>

      {showNew && (
        <BranchForm
          form={form}
          set={set}
          saving={saving}
          error={error}
          onSave={save}
          onCancel={cancel}
          title="Yangi filial"
        />
      )}

      {branches.map((b) => (
        <div key={b.id} className="rounded-2xl bg-card border border-border overflow-hidden">
          {editingId === b.id ? (
            <div className="p-4">
              <BranchForm
                form={form}
                set={set}
                saving={saving}
                error={error}
                onSave={save}
                onCancel={cancel}
                title={`Tahrirlash: ${b.name}`}
              />
            </div>
          ) : (
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="grid place-items-center w-9 h-9 rounded-xl bg-primary-soft text-primary shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{b.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{b.address}</p>
                  <p className="text-xs text-muted-foreground">{b.phone} · {b.hours}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => startEdit(b)}
                  className="flex-1 h-9 rounded-xl bg-secondary text-sm font-semibold flex items-center justify-center gap-1.5"
                >
                  <Pencil className="w-3.5 h-3.5" /> Tahrirlash
                </button>
                <button
                  onClick={() => remove(b.id, b.name)}
                  className="h-9 px-3 rounded-xl bg-destructive/10 text-destructive text-sm font-semibold flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function BranchForm({
  form,
  set,
  saving,
  error,
  onSave,
  onCancel,
  title,
}: {
  form: Omit<Branch, "id">;
  set: <K extends keyof Omit<Branch, "id">>(k: K, v: Omit<Branch, "id">[K]) => void;
  saving: boolean;
  error: string | null;
  onSave: () => void;
  onCancel: () => void;
  title: string;
}) {
  return (
    <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
      <p className="text-sm font-bold">{title}</p>

      <Field label="Filial nomi *">
        <input
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Markaziy filial"
          className="form-input"
        />
      </Field>
      <Field label="Manzil *">
        <input
          value={form.address}
          onChange={(e) => set("address", e.target.value)}
          placeholder="Buxoro sh., Ko'cha, 1-uy"
          className="form-input"
        />
      </Field>
      <Field label="Telefon">
        <input
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
          placeholder="+998 90 000 00 00"
          className="form-input"
        />
      </Field>
      <Field label="Ish vaqti (ko'rsatish uchun)">
        <input
          value={form.hours}
          onChange={(e) => set("hours", e.target.value)}
          placeholder="09:00 - 23:00"
          className="form-input"
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Ochilish">
          <input type="time" value={form.openFrom} onChange={(e) => set("openFrom", e.target.value)} className="form-input" />
        </Field>
        <Field label="Yopilish">
          <input type="time" value={form.openTo} onChange={(e) => set("openTo", e.target.value)} className="form-input" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Kenglik (lat)">
          <input
            type="number"
            step="0.0001"
            value={form.lat}
            onChange={(e) => set("lat", parseFloat(e.target.value) || 0)}
            className="form-input"
          />
        </Field>
        <Field label="Uzunlik (lng)">
          <input
            type="number"
            step="0.0001"
            value={form.lng}
            onChange={(e) => set("lng", parseFloat(e.target.value) || 0)}
            className="form-input"
          />
        </Field>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 h-10 rounded-xl bg-secondary text-sm font-semibold"
        >
          Bekor
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="flex-1 h-10 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-bold disabled:opacity-70"
        >
          {saving ? "Saqlanmoqda..." : "Saqlash"}
        </button>
      </div>
    </div>
  );
}
