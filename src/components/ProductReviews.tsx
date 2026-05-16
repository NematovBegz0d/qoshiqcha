import { useEffect, useMemo, useState } from "react";
import { Star, Loader2, AlertCircle } from "lucide-react";
import { useReviews } from "@/store/reviewsStore";
import { getTelegramUser, haptic, notify } from "@/lib/telegram";
import { useSettings } from "@/store/settingsStore";
import { useT } from "@/lib/i18n";

export function StarRow({
  value,
  onChange,
  size = 16,
  interactive = false,
}: {
  value: number;
  onChange?: (n: number) => void;
  size?: number;
  interactive?: boolean;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(value);
        const star = (
          <Star
            className={filled ? "fill-warning text-warning" : "text-muted-foreground/40"}
            style={{ width: size, height: size }}
          />
        );

        if (!interactive) {
          return <span key={n}>{star}</span>;
        }

        return (
          <button
            key={n}
            type="button"
            onClick={() => {
              haptic("light");
              onChange?.(n);
            }}
            className="p-0.5 active:scale-90 transition-transform"
            aria-label={`${n} yulduz`}
          >
            {star}
          </button>
        );
      })}
    </div>
  );
}

export function ProductReviews({
  productId,
  fallbackRating = 5,
  fallbackCount = 0,
}: {
  productId: string;
  fallbackRating?: number;
  fallbackCount?: number;
}) {
  const allReviews = useReviews((s) => s.reviews);
  const loading = useReviews((s) => s.loading);
  const loadForProduct = useReviews((s) => s.loadForProduct);
  const add = useReviews((s) => s.add);

  const lang = useSettings((s) => s.lang);
  const tr = useT(lang);

  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Component mount bo'lganda Firestore dan yuklaymiz
  useEffect(() => {
    void loadForProduct(productId);
  }, [productId, loadForProduct]);

  const reviews = useMemo(
    () =>
      allReviews.filter((r) => r.productId === productId).sort((a, b) => b.createdAt - a.createdAt),
    [allReviews, productId],
  );

  const stats = useMemo(() => {
    if (!reviews.length)
      return { count: fallbackCount, avg: fallbackCount === 0 ? 5.0 : fallbackRating };
    return {
      count: reviews.length,
      avg: reviews.reduce((s, r) => s + r.rating, 0) / reviews.length,
    };
  }, [reviews, fallbackRating, fallbackCount]);

  const submit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    const u = getTelegramUser();
    const author =
      [u?.first_name, u?.last_name].filter(Boolean).join(" ") || u?.username || "Mehmon";
    try {
      await add({
        productId,
        author,
        authorId: u?.id,
        rating,
        text: text.trim(),
      });
      setText("");
      setRating(5);
      setOpen(false);
      notify("success");
      haptic("medium");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      const isNoTelegram = msg.includes("Telegram ichida oching");
      setSubmitError(
        isNoTelegram
          ? msg
          : lang === "ru"
            ? "Не удалось отправить отзыв. Попробуйте позже."
            : lang === "en"
              ? "Failed to submit review. Try again later."
              : "Sharh yuborilmadi. Keyinroq urinib ko'ring.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{tr("reviews")}</h3>
        <div className="flex items-center gap-2">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : (
            <>
              <StarRow value={stats.avg} />
              <span className="text-xs text-muted-foreground">
                {stats.avg.toFixed(1)} · {stats.count}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Write review toggle */}
      <button
        onClick={() => {
          haptic("light");
          setOpen((o) => !o);
        }}
        className="w-full py-2.5 rounded-xl bg-primary-soft text-primary text-sm font-semibold active:scale-[0.98] transition-transform"
      >
        {open ? tr("cancelReview") : tr("writeReview")}
      </button>

      {/* Review form */}
      {open && (
        <div className="space-y-3 p-4 rounded-2xl border border-border bg-card animate-slide-up">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{tr("yourRating")}</span>
            <StarRow value={rating} onChange={setRating} interactive size={24} />
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={tr("reviewPlaceholder")}
            rows={3}
            maxLength={1000}
            className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none transition-colors"
          />
          {submitError && (
            <div className="flex items-center gap-2 text-xs text-destructive">
              <AlertCircle className="w-3.5 h-3.5" />
              {submitError}
            </div>
          )}
          <button
            onClick={submit}
            disabled={!text.trim() || submitting}
            className="w-full h-11 rounded-full bg-gradient-primary text-primary-foreground font-bold text-sm shadow-soft active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {tr("saving")}
              </>
            ) : (
              tr("submitReview")
            )}
          </button>
        </div>
      )}

      {/* Reviews list */}
      {loading && reviews.length === 0 ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">{tr("noReviews")}</p>
      ) : (
        <div className="space-y-2">
          {reviews.map((r) => (
            <article
              key={r.id}
              className="p-3 rounded-2xl border border-border bg-card space-y-1.5 animate-slide-up"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-soft text-primary grid place-items-center text-xs font-bold shrink-0">
                    {r.author.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold leading-tight">{r.author}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString("uz-UZ", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <StarRow value={r.rating} size={13} />
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed">{r.text}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
