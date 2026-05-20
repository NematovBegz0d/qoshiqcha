import { describe, it, expect } from "vitest";
import {
  getNextOrderStatuses,
  getOrderStatusLabel,
  orderStatusFlow,
  orderStatusLabels,
  orderStatusTransitions,
} from "@/lib/orderStatus";
import type { OrderStatus } from "@/lib/types";

describe("orderStatusFlow", () => {
  it("to'g'ri tartibda 6 status bor", () => {
    expect(orderStatusFlow).toEqual([
      "new",
      "accepted",
      "preparing",
      "delivering",
      "completed",
      "cancelled",
    ]);
  });
});

describe("orderStatusLabels", () => {
  it("barcha statuslar uchun o'zbek tilida label bor", () => {
    const statuses: OrderStatus[] = [
      "new",
      "accepted",
      "preparing",
      "delivering",
      "completed",
      "cancelled",
    ];
    statuses.forEach((s) => {
      expect(orderStatusLabels[s]).toBeTruthy();
    });
  });

  it("label matnlari to'g'ri", () => {
    expect(orderStatusLabels.new).toBe("Yangi");
    expect(orderStatusLabels.accepted).toBe("Qabul");
    expect(orderStatusLabels.cancelled).toBe("Bekor");
    expect(orderStatusLabels.completed).toBe("Yakunlangan");
  });
});

describe("getNextOrderStatuses", () => {
  it("'new' dan 'accepted' yoki 'cancelled' ga o'tadi", () => {
    expect(getNextOrderStatuses("new")).toEqual(["accepted", "cancelled"]);
  });

  it("'accepted' dan 'preparing' yoki 'cancelled' ga o'tadi", () => {
    expect(getNextOrderStatuses("accepted")).toEqual(["preparing", "cancelled"]);
  });

  it("'preparing' dan 'delivering' yoki 'cancelled' ga o'tadi", () => {
    expect(getNextOrderStatuses("preparing")).toEqual(["delivering", "cancelled"]);
  });

  it("'delivering' dan faqat 'completed' ga o'tadi", () => {
    expect(getNextOrderStatuses("delivering")).toEqual(["completed"]);
  });

  it("'completed' dan boshqa statusga o'tib bo'lmaydi", () => {
    expect(getNextOrderStatuses("completed")).toEqual([]);
  });

  it("'cancelled' dan boshqa statusga o'tib bo'lmaydi", () => {
    expect(getNextOrderStatuses("cancelled")).toEqual([]);
  });

  it("orderStatusTransitions bilan mos keladi", () => {
    const statuses: OrderStatus[] = [
      "new",
      "accepted",
      "preparing",
      "delivering",
      "completed",
      "cancelled",
    ];
    statuses.forEach((s) => {
      expect(getNextOrderStatuses(s)).toEqual(orderStatusTransitions[s]);
    });
  });
});

describe("getOrderStatusLabel", () => {
  it("delivery uchun odatiy labelni qaytaradi", () => {
    expect(getOrderStatusLabel("delivering", "delivery")).toBe("Yetkazilmoqda");
    expect(getOrderStatusLabel("completed", "delivery")).toBe("Yakunlangan");
  });

  it("pickup uchun 'delivering' => 'Tayyor'", () => {
    expect(getOrderStatusLabel("delivering", "pickup")).toBe("Tayyor");
  });

  it("pickup uchun 'completed' => 'Topshirildi'", () => {
    expect(getOrderStatusLabel("completed", "pickup")).toBe("Topshirildi");
  });

  it("pickup uchun boshqa statuslarda odatiy label qaytadi", () => {
    expect(getOrderStatusLabel("new", "pickup")).toBe("Yangi");
    expect(getOrderStatusLabel("accepted", "pickup")).toBe("Qabul");
    expect(getOrderStatusLabel("cancelled", "pickup")).toBe("Bekor");
  });

  it("orderType ko'rsatilmasa odatiy label qaytadi", () => {
    expect(getOrderStatusLabel("preparing")).toBe("Tayyorlanmoqda");
  });
});
