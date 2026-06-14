// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// TanStack Router'ni mock qilamiz — to'liq router provider'siz unit test.
const navigateMock = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  // Link `to`/`params` proplarini DOM <a> ga o'tkazmaymiz.
  Link: ({ children, to: _to, params: _params, ...rest }: Record<string, unknown>) => (
    <a {...rest}>{children as React.ReactNode}</a>
  ),
  useNavigate: () => navigateMock,
}));

import { ProductCard } from "@/components/ProductCard";
import { useCart } from "@/store/cartStore";
import { useSettings } from "@/store/settingsStore";
import type { Product } from "@/lib/types";

function product(over: Partial<Product> & Pick<Product, "id" | "name">): Product {
  return {
    slug: over.id,
    categoryId: "c1",
    description: "",
    image: "img.jpg",
    price: 30000,
    rating: 4.5,
    reviewsCount: 0,
    active: true,
    ...over,
  };
}

beforeEach(() => {
  useCart.setState({ items: [] });
  useSettings.setState({ lang: "uz" });
  navigateMock.mockClear();
});
afterEach(cleanup);

describe("ProductCard", () => {
  it("oldPrice bo'lsa chegirma foizi to'g'ri hisoblanadi", () => {
    render(
      <ProductCard product={product({ id: "p1", name: "Burger", price: 8000, oldPrice: 10000 })} />,
    );
    // (1 - 8000/10000) * 100 = 20%
    expect(screen.getByText("-20%")).toBeInTheDocument();
  });

  it("faol bo'lmagan mahsulotda add tugmasi o'chirilgan (disabled)", () => {
    render(<ProductCard product={product({ id: "p1", name: "Burger", active: false })} />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("oddiy mahsulot (variant/modifier yo'q) — bosilganda savatga qo'shiladi", () => {
    render(<ProductCard product={product({ id: "p1", name: "Burger" })} />);
    fireEvent.click(screen.getByRole("button"));
    const items = useCart.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].productId).toBe("p1");
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("variantli mahsulot — bosilganda savat o'rniga detal sahifaga o'tadi", () => {
    render(
      <ProductCard
        product={product({
          id: "p1",
          name: "Burger",
          variants: [{ id: "v1", name: "Katta", price: 40000 }],
        })}
      />,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(navigateMock).toHaveBeenCalledWith({ to: "/product/$id", params: { id: "p1" } });
    expect(useCart.getState().items).toHaveLength(0);
  });

  it("faol bo'lmagan mahsulot bosilsa hech narsa qilmaydi", () => {
    render(<ProductCard product={product({ id: "p1", name: "Burger", active: false })} />);
    fireEvent.click(screen.getByRole("button"));
    expect(useCart.getState().items).toHaveLength(0);
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
