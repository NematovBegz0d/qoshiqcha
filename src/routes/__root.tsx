import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect } from "react";

import appCss from "../styles.css?url";
import { initTelegram, tg } from "@/lib/telegram";
import { useCatalog } from "@/store/catalogStore";
import { usePromotions } from "@/store/promotionsStore";
import { useSettings } from "@/store/settingsStore";
import { useT } from "@/lib/i18n";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  const lang = useSettings((s) => s.lang);
  const tr = useT(lang);
  return (
    <div className="app-shell flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-7xl font-bold text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold">{tr("pageNotFound")}</h2>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft"
        >
          {tr("backToHome")}
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  const lang = useSettings((s) => s.lang);
  const tr = useT(lang);
  return (
    <div className="app-shell flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-xl font-semibold">{tr("error")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-6 inline-flex items-center rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft"
        >
          {tr("retry")}
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content:
          "width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1, user-scalable=no",
      },
      { title: "Qoshiqcha fast food — Telegram Mini App" },
      { name: "description", content: "Tez va mazali yetkazib berish — Qoshiqcha fast food" },
      { name: "theme-color", content: "#ffffff" },
      { property: "og:title", content: "Qoshiqcha fast food" },
      { property: "og:description", content: "Tez va mazali yetkazib berish" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap",
      },
    ],
    scripts: [{ src: "https://telegram.org/js/telegram-web-app.js" }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const theme = useSettings((s) => s.theme);

  useEffect(() => {
    initTelegram();
    void useCatalog.getState().loadFromFirestore();
    void usePromotions.getState().load();
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    const isDark = theme === "dark" || (theme === "system" && tg()?.colorScheme === "dark");
    html.classList.toggle("dark", isDark);
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (meta) meta.content = isDark ? "#281828" : "#ffffff";
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}
