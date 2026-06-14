// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { EmptyState, SkeletonCard } from "@/components/EmptyState";

afterEach(cleanup);

describe("EmptyState", () => {
  it("title har doim ko'rsatiladi", () => {
    render(<EmptyState title="Savat bo'sh" />);
    expect(screen.getByRole("heading", { name: "Savat bo'sh" })).toBeInTheDocument();
  });

  it("description berilsa ko'rsatiladi, berilmasa yo'q", () => {
    const { rerender } = render(<EmptyState title="T" description="Mahsulot qo'shing" />);
    expect(screen.getByText("Mahsulot qo'shing")).toBeInTheDocument();

    rerender(<EmptyState title="T" />);
    expect(screen.queryByText("Mahsulot qo'shing")).not.toBeInTheDocument();
  });

  it("icon va action node'lari render qilinadi", () => {
    render(
      <EmptyState
        title="T"
        icon={<span data-testid="icon">★</span>}
        action={<button>Menyuga o'tish</button>}
      />,
    );
    expect(screen.getByTestId("icon")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Menyuga o'tish" })).toBeInTheDocument();
  });

  it("icon berilmasa icon konteyner chiqmaydi", () => {
    render(<EmptyState title="T" />);
    expect(screen.queryByTestId("icon")).not.toBeInTheDocument();
  });
});

describe("SkeletonCard", () => {
  it("animate-pulse skelet bloklarini render qiladi", () => {
    const { container } = render(<SkeletonCard />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });
});
