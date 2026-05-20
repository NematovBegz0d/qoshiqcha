import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, Banknote, CreditCard, Wallet, Loader2, ShoppingBag } from "lucide-react";
import { useCart } from "@/store/cartStore";
import { useUser } from "@/store/userStore";
import { useCatalog } from "@/store/catalogStore";
import { useSettings } from "@/store/settingsStore";
import { formatUZS } from "@/lib/format";
import { haptic, notify, tg } from "@/lib/telegram";
import { submitOrderToBackend, saveOrderLocally } from "@/services/orderService";
import { EmptyState } from "@/components/EmptyState";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
});

function CheckoutPage() {
  const navigate = useNavigate();
  const items = useCart((s) => s.items);
  const itemsTotal = useCart((s) => s.itemsTotal());
  const clear = useCart((s) => s.clear);
  const phone = useUser((s) => s.phone);
  const setPhone = useUser((s) => s.setPhone);
  const addresses = useUser((s) => s.addresses);
  const defaultAddressId = useUser((s) => s.defaultAddressId);
  const settings = useCatalog((s) => s.shopSettings);
  const branches = useCatalog((s) => s.branches);
  const currentMode = useSettings((s) => s.mode);
  const pickupBranchId = useSettings((s) => s.pickupBranchId);
  const pickupTime = useSettings((s) => s.pickupTime);
  const lang = useSettings((s) => s.lang);
  const tr = useT(lang);

  const [orderType, setOrderType] = useState<"delivery" | "pickup">(currentMode);
  const [payment, setPayment] = useState<"cash" | "card_courier">("cash");
  const [phoneInput, setPhoneInput] = useState(phone ?? "");
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const address = addresses.find((a) => a.id === defaultAddressId) ?? addresses[0];
  const pickupBranch = branches.find((b) => b.id === pickupBranchId);
  const pickup =
    pickupBranch && pickupTime
      ? {
          branchId: pickupBranch.id,
          branchName: pickupBranch.name,
          pickupTime,
        }
      : undefined;

  // Frontend narxlar faqat UI ko'rsatish uchun — backend Firestore'dan qayta hisoblaydi
  const deliveryPrice =
    orderType === "pickup"
      ? 0
      : itemsTotal >= settings.freeDeliveryFrom
        ? 0
        : settings.deliveryPrice;
  const total = itemsTotal + deliveryPrice;
  const phoneDigits = phoneInput.replace(/\D/g, "");

  if (items.length === 0) {
    return (
      <div className="app-shell px-4 pt-safe">
        <header className="py-3 flex items-center gap-3">
          <button
            onClick={() => navigate({ to: "/cart" })}
            className="grid place-items-center w-10 h-10 rounded-full bg-card border border-border active:scale-95"
            aria-label={tr("back")}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">{tr("checkout")}</h1>
        </header>
        <EmptyState
          icon={<ShoppingBag className="w-9 h-9" />}
          title={tr("cartEmpty")}
          description={tr("cartEmptyDesc")}
          action={
            <Link
              to="/"
              className="mt-2 inline-flex items-center rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft"
            >
              {tr("goToMenu")}
            </Link>
          }
        />
      </div>
    );
  }

  const submit = async () => {
    if (loading) return;
    setError(null);

    // ── Client-side validatsiya ──────────────────────────────────────────────
    if (!settings.shopIsOpen) return setError(tr("shopClosedDesc"));
    if (phoneDigits.length < 9 || phoneDigits.length > 15) {
      return setError(tr("invalidPhone"));
    }
    if (orderType === "delivery" && !address) {
      return setError(
        lang === "ru"
          ? "Введите адрес доставки"
          : lang === "en"
            ? "Enter delivery address"
            : "Yetkazish manzilini kiriting",
      );
    }
    if (orderType === "pickup" && !pickup) {
      return setError(tr("selectBranchTime"));
    }
    if (itemsTotal < settings.minOrderPrice)
      return setError(`${tr("minOrder")}: ${formatUZS(settings.minOrderPrice)}`);

    setPhone(phoneInput.trim());

    // ── initData tekshirish ──────────────────────────────────────────────────
    const initData = tg()?.initData ?? "";
    if (!initData) {
      return setError(
        lang === "ru"
          ? "Откройте приложение в Telegram для заказа."
          : lang === "en"
            ? "Open app in Telegram to order."
            : "Buyurtma berish uchun ilovani Telegram ichida oching.",
      );
    }

    // ── Backend call ─────────────────────────────────────────────────────────
    setLoading(true);
    try {
      // Narxlar (totalPrice, deliveryPrice, itemsTotal) yuborilmaydi —
      // backend ularni Firestore products va settings/global dan o'zi hisoblaydi.
      const payload = {
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          selectedVariant: item.selectedVariant ?? null,
          selectedModifiers: item.selectedModifiers ?? [],
          comment: item.comment ?? "",
        })),
        orderType,
        address:
          orderType === "delivery" && address
            ? {
                fullAddress: address.fullAddress,
                title: address.title ?? "",
                lat: address.lat ?? null,
                lng: address.lng ?? null,
                house: address.house ?? "",
                apartment: address.apartment ?? "",
                floor: address.floor ?? "",
                entrance: address.entrance ?? "",
                courierNote: address.courierNote ?? "",
              }
            : undefined,
        pickup: orderType === "pickup" ? pickup : undefined,
        phone: phoneInput.trim(),
        paymentType: payment,
        comment: comment.trim().slice(0, 500),
      };

      const result = await submitOrderToBackend(initData, payload);

      // Success va tarix ekranlari backend saqlagan haqiqiy orderni ko'rsatadi.
      saveOrderLocally(result.order);

      notify("success");
      haptic("heavy");
      clear();
      navigate({ to: "/order-success", search: { id: result.order.id } });
    } catch (err) {
      haptic("medium");
      setError(err instanceof Error ? err.message : tr("error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell pb-32">
      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-xl pt-safe">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate({ to: "/cart" })}
            className="grid place-items-center w-10 h-10 rounded-full bg-card border border-border active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">{tr("checkout")}</h1>
        </div>
      </header>

      <main className="px-4 pt-2 space-y-4">
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-secondary">
          {(
            [
              { v: "delivery", label: tr("delivery") },
              { v: "pickup", label: tr("pickup") },
            ] as const
          ).map(({ v, label }) => (
            <button
              key={v}
              onClick={() => setOrderType(v)}
              disabled={loading}
              className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                orderType === v ? "bg-card shadow-card" : "text-muted-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <Section title={tr("phone")}>
          <input
            type="tel"
            inputMode="tel"
            placeholder={tr("phonePlaceholder")}
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:border-primary focus:outline-none text-sm disabled:opacity-60"
          />
        </Section>

        {orderType === "delivery" && (
          <Section title={tr("address")}>
            {address ? (
              <Link to="/address" className="block p-3 rounded-xl bg-card border border-border">
                <p className="text-sm font-semibold">{address.title || tr("addressLabel")}</p>
                <p className="text-xs text-muted-foreground">{address.fullAddress}</p>
              </Link>
            ) : (
              <Link
                to="/address"
                className="block p-3 rounded-xl bg-primary-soft text-primary border border-primary/20 text-sm font-semibold text-center"
              >
                {tr("addAddress")}
              </Link>
            )}
          </Section>
        )}

        {orderType === "pickup" && (
          <Section title={tr("choosePickup")}>
            {pickup ? (
              <div className="p-3 rounded-xl bg-card border border-border">
                <p className="text-sm font-semibold">{pickup.branchName}</p>
                <p className="text-xs text-muted-foreground">
                  {tr("pickupTime")}: {pickup.pickupTime}
                </p>
              </div>
            ) : (
              <Link
                to="/"
                className="block p-3 rounded-xl bg-primary-soft text-primary border border-primary/20 text-sm font-semibold text-center"
              >
                {tr("selectBranchPickup")}
              </Link>
            )}
          </Section>
        )}

        <Section title={tr("paymentMethod")}>
          <div className="space-y-2">
            <PayOpt
              label={tr("cash")}
              icon={<Banknote className="w-5 h-5" />}
              active={payment === "cash"}
              onClick={() => setPayment("cash")}
              disabled={loading}
            />
            <PayOpt
              label={tr("cardCourier")}
              icon={<CreditCard className="w-5 h-5" />}
              active={payment === "card_courier"}
              onClick={() => setPayment("card_courier")}
              disabled={loading}
            />
            <PayOpt
              label={tr("onlineSoon")}
              icon={<Wallet className="w-5 h-5" />}
              active={false}
              disabled
            />
          </div>
        </Section>

        <Section title={tr("orderNote")}>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={tr("orderNotePlaceholder")}
            rows={3}
            disabled={loading}
            className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:border-primary focus:outline-none text-sm resize-none disabled:opacity-60"
          />
        </Section>

        {error && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
            {error}
          </div>
        )}
      </main>

      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-card/95 backdrop-blur-xl border-t border-border p-4 pb-2.5 shadow-pop space-y-2"
        style={{ paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))" }}
      >
        <div className="flex justify-between text-sm font-bold">
          <span>{tr("grandTotal")}</span>
          <span className="text-primary">{formatUZS(total)}</span>
        </div>
        <button
          onClick={submit}
          disabled={loading}
          className="w-full h-12 rounded-full bg-gradient-primary text-primary-foreground font-bold shadow-soft active:scale-[0.98] transition-transform disabled:opacity-70 disabled:scale-100 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {tr("sending")}
            </>
          ) : (
            tr("confirmOrder")
          )}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function PayOpt({
  label,
  icon,
  active,
  onClick,
  disabled,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
        active ? "bg-primary-soft border-primary text-primary" : "bg-card border-border"
      } ${disabled ? "opacity-50" : ""}`}
    >
      <div className={active ? "text-primary" : "text-muted-foreground"}>{icon}</div>
      <span className="text-sm font-semibold flex-1 text-left">{label}</span>
      <div
        className={`w-5 h-5 rounded-full border-2 grid place-items-center ${
          active ? "border-primary bg-primary" : "border-border"
        }`}
      >
        {active && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
      </div>
    </button>
  );
}
