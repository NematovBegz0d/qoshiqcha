import {
  Phone,
  Mail,
  Send,
  Instagram,
  Facebook,
  MessageCircle,
  Users,
  Truck,
  Award,
  Heart,
} from "lucide-react";
import type { Branch, BusinessContacts } from "@/lib/types";

// ── Default fallbacks (used when Firestore data not yet loaded) ───────────────

export const defaultBusinessContacts: BusinessContacts = {
  contacts: [
    { label: "Call-markaz", value: "+998 71 200 00 00", href: "tel:+998712000000" },
    { label: "Qo'llab-quvvatlash", value: "+998 90 123 45 67", href: "tel:+998901234567" },
    { label: "Email", value: "info@qoshiqcha.uz", href: "mailto:info@qoshiqcha.uz" },
  ],
  socials: [
    { label: "Telegram", href: "https://t.me/qoshiqchafood", color: "bg-sky-500" },
    {
      label: "Instagram",
      href: "https://instagram.com/qoshiqchafood",
      color: "bg-gradient-to-br from-fuchsia-500 to-orange-500",
    },
    { label: "Facebook", href: "https://facebook.com/qoshiqchafood", color: "bg-blue-600" },
  ],
  workingHours: "Har kuni: 09:00 — 00:00",
};

export const defaultBranches: Branch[] = [
  {
    id: "main",
    name: "Markaziy filial",
    address: "Buxoro sh., Eski shahar, 1-uy",
    phone: "+998 71 200 00 00",
    hours: "09:00 - 00:00",
    openFrom: "09:00",
    openTo: "24:00",
    lat: 39.7747,
    lng: 64.4286,
  },
];

// ── Icon helpers for contacts page (icon derived from href, not stored in DB) ─

export function getContactIcon(href: string) {
  if (href.startsWith("tel:")) return Phone;
  if (href.startsWith("mailto:")) return Mail;
  return MessageCircle;
}

export function getSocialIcon(label: string) {
  const l = label.toLowerCase();
  if (l === "telegram") return Send;
  if (l === "instagram") return Instagram;
  if (l === "facebook") return Facebook;
  return MessageCircle;
}

// ── Static about page data ───────────────────────────────────────────────────

export const aboutStats = [
  { icon: Users, value: "50K+", label: "Mijozlar" },
  { icon: Truck, value: "200K+", label: "Buyurtmalar" },
  { icon: Award, value: "5+", label: "Yillik tajriba" },
  { icon: Heart, value: "4.9", label: "Reyting" },
];

export const aboutTexts = {
  name: "Qoshiqcha fast food",
  tagline:
    "Tez, mazali va sifatli yetkazib berish xizmati. Biz har bir buyurtmani sevgi tayyorlaymiz.",
  mission:
    "Har bir mijozimizga sifatli, tez va qulay xizmat ko'rsatish — bizning asosiy maqsadimiz.",
  quality:
    "Faqat yangi mahsulotlar, tekshirilgan ta'minotchilar va sertifikatlangan ishlab chiqarish.",
  delivery: "30-45 daqiqa ichida buyurtmangizni issiq holda yetkazib beramiz.",
  version: "1.0.0",
  year: "2026",
};
