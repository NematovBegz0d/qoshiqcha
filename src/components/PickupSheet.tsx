import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Clock, MapPin, Check } from "lucide-react";
import { generateTimeSlots } from "@/data/branches";
import { useCatalog } from "@/store/catalogStore";
import { useSettings } from "@/store/settingsStore";
import { haptic, notify } from "@/lib/telegram";
import { useT } from "@/lib/i18n";

export function PickupSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const branches = useCatalog((s) => s.branches);
  const savedBranch = useSettings((s) => s.pickupBranchId);
  const savedTime = useSettings((s) => s.pickupTime);
  const setPickup = useSettings((s) => s.setPickup);
  const lang = useSettings((s) => s.lang);
  const tr = useT(lang);

  const [branchId, setBranchId] = useState<string>(savedBranch ?? branches[0]?.id ?? "");
  const branch = useMemo(
    () => branches.find((b) => b.id === branchId) ?? branches[0],
    [branchId, branches],
  );
  const slots = useMemo(() => generateTimeSlots(branch), [branch]);
  const [time, setTime] = useState<string>(savedTime ?? slots[0] ?? "");

  useEffect(() => {
    setTime((prev) => (slots.includes(prev) ? prev : (slots[0] ?? "")));
  }, [branchId]); // eslint-disable-line react-hooks/exhaustive-deps

  const confirm = () => {
    if (!time) return;
    setPickup(branchId, time);
    haptic("medium");
    notify("success");
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl p-0 max-h-[88vh] overflow-y-auto border-0"
      >
        <SheetHeader className="px-5 pt-5 pb-2 text-left">
          <SheetTitle className="text-xl font-bold">{tr("choosePickup")}</SheetTitle>
          <p className="text-sm text-muted-foreground">
            {lang === "ru"
              ? "Выберите филиал и время"
              : lang === "en"
                ? "Choose branch and time"
                : "Filial va olish vaqtini tanlang"}
          </p>
        </SheetHeader>

        <div className="px-5 pb-6 space-y-5">
          <section className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-primary" /> {tr("pickupBranch")}
            </h3>
            <div className="space-y-2">
              {branches.map((b) => {
                const active = branchId === b.id;
                return (
                  <button
                    key={b.id}
                    onClick={() => {
                      setBranchId(b.id);
                      haptic("light");
                    }}
                    className={`w-full flex items-start gap-3 p-3 rounded-2xl border text-left transition-all ${
                      active ? "bg-primary-soft border-primary" : "bg-card border-border"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{b.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{b.address}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {tr("workingTime")}: {b.hours}
                      </p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full grid place-items-center shrink-0 ${
                        active ? "bg-primary text-primary-foreground" : "border border-border"
                      }`}
                    >
                      {active && <Check className="w-3 h-3" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary" /> {tr("pickupTime")}
            </h3>
            {slots.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {lang === "ru"
                  ? "На сегодня нет свободного времени"
                  : lang === "en"
                    ? "No available time today"
                    : "Bugun uchun vaqt mavjud emas"}
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {slots.map((s) => {
                  const active = time === s;
                  return (
                    <button
                      key={s}
                      onClick={() => {
                        setTime(s);
                        haptic("light");
                      }}
                      className={`h-10 rounded-xl text-sm font-semibold transition-all ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-foreground"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <button
            onClick={confirm}
            disabled={!time}
            className="w-full h-12 rounded-full bg-gradient-primary text-primary-foreground font-bold shadow-soft active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {tr("confirm")}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
