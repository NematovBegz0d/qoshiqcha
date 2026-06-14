// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { CategoryScroll } from "@/components/CategoryScroll";
import { useSettings } from "@/store/settingsStore";
import type { Category } from "@/lib/types";

function cat(over: Partial<Category> & Pick<Category, "id" | "name">): Category {
  return {
    slug: over.id,
    icon: "🍔",
    order: 0,
    active: true,
    ...over,
  };
}

const categories: Category[] = [
  cat({ id: "c1", name: "Burgerlar", name_ru: "Бургеры", name_en: "Burgers" }),
  cat({ id: "c2", name: "Ichimliklar", name_ru: "Напитки", name_en: "Drinks" }),
];

beforeEach(() => {
  useSettings.setState({ lang: "uz" });
});
afterEach(cleanup);

describe("CategoryScroll", () => {
  it("'barchasi' + har bir kategoriya uchun tugma render qiladi", () => {
    render(<CategoryScroll categories={categories} active={null} onChange={() => {}} />);
    // 1 (seeAll) + 2 kategoriya
    expect(screen.getAllByRole("button")).toHaveLength(3);
  });

  it("kategoriya tanlanganda onChange uning id si bilan chaqiriladi", () => {
    const onChange = vi.fn();
    render(<CategoryScroll categories={categories} active={null} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /Burgerlar/ }));
    expect(onChange).toHaveBeenCalledWith("c1");
  });

  it("'barchasi' tugmasi onChange(null) chaqiradi", () => {
    const onChange = vi.fn();
    render(<CategoryScroll categories={categories} active="c1" onChange={onChange} />);
    // birinchi tugma — seeAll
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("faol kategoriya gradient (tanlangan) uslubini oladi", () => {
    render(<CategoryScroll categories={categories} active="c1" onChange={() => {}} />);
    const burgerBtn = screen.getByRole("button", { name: /Burgerlar/ });
    const drinksBtn = screen.getByRole("button", { name: /Ichimliklar/ });
    expect(burgerBtn.className).toContain("bg-gradient-primary");
    expect(drinksBtn.className).not.toContain("bg-gradient-primary");
  });

  it("til 'ru' bo'lsa ruscha nom ko'rsatiladi", () => {
    useSettings.setState({ lang: "ru" });
    render(<CategoryScroll categories={categories} active={null} onChange={() => {}} />);
    expect(screen.getByRole("button", { name: /Бургеры/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Burgerlar/ })).not.toBeInTheDocument();
  });

  it("til 'en' bo'lsa inglizcha nom ko'rsatiladi", () => {
    useSettings.setState({ lang: "en" });
    render(<CategoryScroll categories={categories} active={null} onChange={() => {}} />);
    expect(screen.getByRole("button", { name: /Drinks/ })).toBeInTheDocument();
  });
});
