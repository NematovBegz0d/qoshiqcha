import type { Settings } from "@/lib/types";

export const settings: Settings = {
  deliveryPrice: 15000,
  freeDeliveryFrom: 50000,
  minOrderPrice: 25000,
  workingHours: { from: "09:00", to: "00:00" },
  shopIsOpen: true,
};
