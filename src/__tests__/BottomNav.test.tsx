// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

let currentPath = "/";
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, params: _params, ...rest }: Record<string, unknown>) => (
    <a href={String(to)} {...rest}>
      {children as React.ReactNode}
    </a>
  ),
  useLocation: () => ({ pathname: currentPath }),
}));

import { BottomNav } from "@/components/BottomNav";
import { useCart } from "@/store/cartStore";
import { useSettings } from "@/store/settingsStore";
import type { CartItem } from "@/lib/types";

function item(qty: number, uid = "p|_"): CartItem {
  return {
    uid,
    productId: "p",
    name: "X",
    image: "i.jpg",
    basePrice: 1000,
    selectedModifiers: [],
    quantity: qty,
  };
}

beforeEach(() => {
  currentPath = "/";
  useCart.setState({ items: [] });
  useSettings.setState({ lang: "uz" });
});
afterEach(cleanup);

describe("BottomNav", () => {
  it("4 ta navigatsiya havolasini render qiladi", () => {
    render(<BottomNav />);
    expect(screen.getAllByRole("link")).toHaveLength(4);
  });

  it("savat bo'sh bo'lsa badge ko'rinmaydi", () => {
    render(<BottomNav />);
    expect(screen.queryByText(/^\d/)).not.toBeInTheDocument();
  });

  it("savatdagi umumiy miqdorni badge'da ko'rsatadi", () => {
    useCart.setState({ items: [item(2, "a"), item(1, "b")] });
    render(<BottomNav />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("99 dan oshsa '99+' ko'rsatadi", () => {
    useCart.setState({ items: [item(150)] });
    render(<BottomNav />);
    expect(screen.getByText("99+")).toBeInTheDocument();
  });
});
