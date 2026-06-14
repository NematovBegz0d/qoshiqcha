import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useCatalog } from "@/store/catalogStore";
import { haptic, notify } from "@/lib/telegram";
import type { BusinessContacts, ContactItem, SocialItem } from "@/lib/types";
import { Field } from "./ui";

export function ContactsTab() {
  const businessContacts = useCatalog((s) => s.businessContacts);
  const updateBusinessContacts = useCatalog((s) => s.updateBusinessContacts);

  const [contacts, setContacts] = useState<ContactItem[]>(businessContacts.contacts);
  const [socials, setSocials] = useState<SocialItem[]>(businessContacts.socials);
  const [workingHours, setWorkingHours] = useState(businessContacts.workingHours);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateContact = (i: number, patch: Partial<ContactItem>) =>
    setContacts((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));

  const addContact = () => setContacts((prev) => [...prev, { label: "", value: "", href: "" }]);

  const removeContact = (i: number) => setContacts((prev) => prev.filter((_, idx) => idx !== i));

  const updateSocial = (i: number, patch: Partial<SocialItem>) =>
    setSocials((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  const addSocial = () =>
    setSocials((prev) => [...prev, { label: "", href: "", color: "bg-sky-500" }]);

  const removeSocial = (i: number) => setSocials((prev) => prev.filter((_, idx) => idx !== i));

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const patch: Partial<BusinessContacts> = { contacts, socials, workingHours };
      await updateBusinessContacts(patch);
      notify("success");
      haptic("medium");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Saqlanmadi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Kontaktlar */}
      <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
        <h3 className="text-sm font-bold">Kontaktlar</h3>
        {contacts.map((c, i) => (
          <div key={i} className="space-y-2 pb-3 border-b border-border last:border-0 last:pb-0">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-semibold">#{i + 1}</span>
              <button onClick={() => removeContact(i)} className="text-destructive">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <Field label="Nomi">
              <input
                value={c.label}
                onChange={(e) => updateContact(i, { label: e.target.value })}
                placeholder="Call-markaz"
                className="form-input"
              />
            </Field>
            <Field label="Qiymat">
              <input
                value={c.value}
                onChange={(e) => updateContact(i, { value: e.target.value })}
                placeholder="+998 71 200 00 00"
                className="form-input"
              />
            </Field>
            <Field label="Havola (href)">
              <input
                value={c.href}
                onChange={(e) => updateContact(i, { href: e.target.value })}
                placeholder="tel:+998712000000"
                className="form-input"
              />
            </Field>
          </div>
        ))}
        <button
          onClick={addContact}
          className="w-full h-9 rounded-xl border border-dashed border-border text-xs font-semibold flex items-center justify-center gap-1.5 text-muted-foreground"
        >
          <Plus className="w-3.5 h-3.5" /> Kontakt qo'shish
        </button>
      </div>

      {/* Ijtimoiy tarmoqlar */}
      <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
        <h3 className="text-sm font-bold">Ijtimoiy tarmoqlar</h3>
        {socials.map((s, i) => (
          <div key={i} className="space-y-2 pb-3 border-b border-border last:border-0 last:pb-0">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-semibold">#{i + 1}</span>
              <button onClick={() => removeSocial(i)} className="text-destructive">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <Field label="Nomi (Telegram, Instagram…)">
              <input
                value={s.label}
                onChange={(e) => updateSocial(i, { label: e.target.value })}
                placeholder="Telegram"
                className="form-input"
              />
            </Field>
            <Field label="URL havolasi">
              <input
                value={s.href}
                onChange={(e) => updateSocial(i, { href: e.target.value })}
                placeholder="https://t.me/..."
                className="form-input"
              />
            </Field>
            <Field label="Rang (Tailwind class)">
              <input
                value={s.color}
                onChange={(e) => updateSocial(i, { color: e.target.value })}
                placeholder="bg-sky-500"
                className="form-input"
              />
            </Field>
          </div>
        ))}
        <button
          onClick={addSocial}
          className="w-full h-9 rounded-xl border border-dashed border-border text-xs font-semibold flex items-center justify-center gap-1.5 text-muted-foreground"
        >
          <Plus className="w-3.5 h-3.5" /> Ijtimoiy tarmoq qo'shish
        </button>
      </div>

      {/* Ish vaqti */}
      <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
        <h3 className="text-sm font-bold">Ish vaqti matni</h3>
        <Field label="Ko'rsatiladigan matn">
          <input
            value={workingHours}
            onChange={(e) => setWorkingHours(e.target.value)}
            placeholder="Har kuni: 09:00 — 00:00"
            className="form-input"
          />
        </Field>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
          {error}
        </div>
      )}

      <button
        onClick={save}
        disabled={saving}
        className="w-full h-12 rounded-xl bg-gradient-primary text-primary-foreground font-bold text-sm shadow-soft disabled:opacity-70"
      >
        {saving ? "Saqlanmoqda..." : "Barcha o'zgarishlarni saqlash"}
      </button>
    </div>
  );
}
