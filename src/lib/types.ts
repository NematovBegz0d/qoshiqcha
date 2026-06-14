export type Category = {
  id: string;
  name: string;
  name_ru?: string;
  name_en?: string;
  slug: string;
  icon: string; // emoji
  order: number;
  active: boolean;
};

export type Variant = { id: string; name: string; price: number };

export type ModifierOption = { id: string; name: string; price: number };
export type Modifier = {
  id: string;
  name: string;
  type: "single" | "multi";
  maxSelect: number;
  required: boolean;
  options: ModifierOption[];
};

export type Product = {
  id: string;
  name: string;
  name_ru?: string;
  name_en?: string;
  slug: string;
  categoryId: string;
  description: string;
  description_ru?: string;
  description_en?: string;
  image: string;
  price: number;
  oldPrice?: number | null;
  weight?: string;
  rating: number;
  reviewsCount: number;
  active: boolean;
  popular?: boolean;
  variants?: Variant[];
  modifiers?: Modifier[];
};

export type CartItem = {
  uid: string;
  productId: string;
  name: string;
  image: string;
  basePrice: number;
  selectedVariant?: Variant;
  selectedModifiers: ModifierOption[];
  quantity: number;
  comment?: string;
};

export type Address = {
  id: string;
  title: string;
  fullAddress: string;
  lat?: number;
  lng?: number;
  house?: string;
  apartment?: string;
  floor?: string;
  entrance?: string;
  courierNote?: string;
  isDefault?: boolean;
};

export type PickupInfo = {
  branchId: string;
  branchName: string;
  pickupTime: string;
};

export type OrderStatus =
  | "new"
  | "accepted"
  | "preparing"
  | "delivering"
  | "completed"
  | "cancelled";

export type Order = {
  id: string;
  orderNumber: string;
  telegramId: number;
  user: { telegramId: number; firstName?: string; username?: string; phone: string };
  items: CartItem[];
  orderType: "delivery" | "pickup";
  address?: Address;
  pickup?: PickupInfo;
  phone: string;
  paymentType: "cash" | "card_courier" | "online";
  itemsTotal: number;
  deliveryPrice: number;
  discount: number;
  totalPrice: number;
  status: OrderStatus;
  statusHistory: { status: OrderStatus; at: number; by?: string | number }[];
  comment?: string;
  createdAt: number;
};

export type Settings = {
  deliveryPrice: number;
  freeDeliveryFrom: number;
  minOrderPrice: number;
  workingHours: { from: string; to: string };
  shopIsOpen: boolean;
};

export type Branch = {
  id: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
  openFrom: string;
  openTo: string;
  lat: number;
  lng: number;
};

export type ContactItem = {
  label: string;
  value: string;
  href: string;
};

export type SocialItem = {
  label: string;
  href: string;
  color: string;
};

export type BusinessContacts = {
  contacts: ContactItem[];
  socials: SocialItem[];
  workingHours: string;
};

export type NotifItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  orderId: string | null;
  orderNumber: string | null;
  status: string | null;
  read: boolean;
  createdAt: number;
};

export type Promotion = {
  id: string;
  title: string;
  title_ru?: string;
  title_en?: string;
  description: string;
  description_ru?: string;
  description_en?: string;
  badge: string;
  color: string;
  image?: string;
  expiresAt: string;
  active: boolean;
  order: number;
};
