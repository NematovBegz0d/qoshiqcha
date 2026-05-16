import { useEffect, useState } from "react";
import { User, Phone, Mail, Calendar, Save, X } from "lucide-react";
import { useUser, type UserProfile } from "@/store/userStore";
import { getTelegramUser, haptic, notify } from "@/lib/telegram";
import { useSettings } from "@/store/settingsStore";
import { useT } from "@/lib/i18n";

function formatPhone(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 12);
  if (!d) return "";
  let v = d;
  if (!v.startsWith("998")) v = "998" + v.replace(/^998/, "");
  v = v.slice(0, 12);
  const p = v.slice(3);
  let out = "+998";
  if (p.length) out += " " + p.slice(0, 2);
  if (p.length > 2) out += " " + p.slice(2, 5);
  if (p.length > 5) out += "-" + p.slice(5, 7);
  if (p.length > 7) out += "-" + p.slice(7, 9);
  return out;
}

function emailValid(v: string) {
  return v.includes("@") && v.includes(".") && v.indexOf("@") < v.lastIndexOf(".");
}

export function ProfileForm({
  onClose,
  forceOpen = false,
}: {
  onClose: () => void;
  forceOpen?: boolean;
}) {
  const profile = useUser((s) => s.profile);
  const setProfile = useUser((s) => s.setProfile);
  const lang = useSettings((s) => s.lang);
  const tr = useT(lang);

  const [fullName, setFullName] = useState(
    [profile.firstName, profile.lastName].filter(Boolean).join(" "),
  );
  const [form, setForm] = useState<Omit<UserProfile, "firstName" | "lastName">>({
    phone: profile.phone ?? "",
    email: profile.email ?? "",
    birthDate: profile.birthDate ?? "",
    gender: profile.gender,
    photoUrl: profile.photoUrl,
    telegramId: profile.telegramId,
    username: profile.username,
    profileCompleted: profile.profileCompleted,
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const u = getTelegramUser();
    setFullName((prev) => prev || [u?.first_name, u?.last_name].filter(Boolean).join(" "));
    setForm((f) => ({
      ...f,
      phone: f.phone || "",
      photoUrl: f.photoUrl ?? u?.photo_url,
      telegramId: f.telegramId ?? u?.id,
      username: f.username ?? u?.username,
    }));
  }, []);

  const touch = (key: string) => setTouched((t) => ({ ...t, [key]: true }));

  const phoneDigits = (form.phone ?? "").replace(/\D/g, "");
  const t3 = (ru: string, en: string, uz: string) => (lang === "ru" ? ru : lang === "en" ? en : uz);

  const fullNameLabel = t3("Полное имя", "Full name", "To'liq ism");

  const errors = {
    fullName: !fullName.trim()
      ? t3("Имя обязательно", "Full name required", "To'liq ism majburiy")
      : null,
    phone:
      phoneDigits.length === 0
        ? t3("Телефон обязателен", "Phone required", "Telefon majburiy")
        : phoneDigits.length < 12
          ? t3(
              "Введите полный номер (+998 XX XXX-XX-XX)",
              "Enter full number (+998 XX XXX-XX-XX)",
              "To'liq raqam kiriting (+998 XX XXX-XX-XX)",
            )
          : null,
    email:
      form.email && !emailValid(form.email)
        ? t3("Неверный формат email", "Invalid email format", "Email formati noto'g'ri")
        : null,
  };

  const valid = !errors.fullName && !errors.phone && !errors.email;

  const submit = () => {
    setTouched({ fullName: true, phone: true, email: true });
    if (!valid) {
      notify("error");
      return;
    }
    const parts = fullName.trim().split(/\s+/);
    const firstName = parts[0] ?? "";
    const lastName = parts.slice(1).join(" ");
    setProfile({ ...form, firstName, lastName, profileCompleted: true });
    notify("success");
    haptic("medium");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in">
      <div className="w-full sm:max-w-md bg-background rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-background/95 backdrop-blur px-5 pt-5 pb-3 flex items-center justify-between border-b border-border">
          <div>
            <h2 className="text-lg font-bold">
              {forceOpen ? tr("fillProfile").replace(" →", "") : tr("editProfile")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t3(
                "Нам нужны ваши данные для оформления заказа",
                "We need your details to place an order",
                "Buyurtma berish uchun ma'lumotlaringiz kerak",
              )}
            </p>
          </div>
          {!forceOpen && (
            <button
              onClick={() => {
                haptic("light");
                onClose();
              }}
              className="grid place-items-center w-9 h-9 rounded-full bg-secondary"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="p-5 space-y-4">
          <Field
            label={`${fullNameLabel} *`}
            icon={<User className="w-4 h-4" />}
            value={fullName}
            onChange={setFullName}
            onBlur={() => touch("fullName")}
            placeholder={t3("Иванов Иван", "John Smith", "Karimov Jasur")}
            error={touched.fullName ? errors.fullName : null}
          />
          <Field
            label={`${tr("phone")} *`}
            icon={<Phone className="w-4 h-4" />}
            value={form.phone ?? ""}
            onChange={(v) => setForm({ ...form, phone: formatPhone(v) })}
            onBlur={() => touch("phone")}
            placeholder="+998 90 123-45-67"
            inputMode="tel"
            error={touched.phone ? errors.phone : null}
          />
          <Field
            label={tr("email")}
            icon={<Mail className="w-4 h-4" />}
            value={form.email ?? ""}
            onChange={(v) => setForm({ ...form, email: v })}
            onBlur={() => touch("email")}
            placeholder="email@example.com"
            inputMode="email"
            error={touched.email ? errors.email : null}
          />
          <Field
            label={tr("birthDate")}
            icon={<Calendar className="w-4 h-4" />}
            value={form.birthDate ?? ""}
            onChange={(v) => setForm({ ...form, birthDate: v })}
            type="date"
          />

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">
              {tr("gender")}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["male", "female", "other"] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => {
                    haptic("light");
                    setForm({ ...form, gender: g });
                  }}
                  className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                    form.gender === g
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border text-foreground"
                  }`}
                >
                  {g === "male" ? tr("male") : g === "female" ? tr("female") : tr("other")}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={submit}
            className={`w-full h-12 rounded-full bg-gradient-primary text-primary-foreground font-bold shadow-soft transition-transform flex items-center justify-center gap-2 ${valid ? "active:scale-[0.98]" : "opacity-60"}`}
          >
            <Save className="w-4 h-4" />
            {tr("save")}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  icon,
  value,
  onChange,
  onBlur,
  placeholder,
  type = "text",
  inputMode,
  error,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  type?: string;
  inputMode?: "tel" | "email" | "text";
  error?: string | null;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{label}</label>
      <div
        className={`flex items-center gap-2 px-3 h-12 rounded-xl bg-card border transition-colors focus-within:border-primary ${error ? "border-destructive" : "border-border"}`}
      >
        <span className="text-muted-foreground">{icon}</span>
        <input
          type={type}
          inputMode={inputMode}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-sm"
        />
      </div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
