// Biznes ma'lumotlari — quyidagi qiymatlarni mijoz o'z ma'lumotlariga moslashtiradi
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

export const businessContacts = [
  { icon: Phone, label: "Call-markaz", value: "+998 71 200 00 00", href: "tel:+998712000000" },
  {
    icon: MessageCircle,
    label: "Qo'llab-quvvatlash",
    value: "+998 90 123 45 67",
    href: "tel:+998901234567",
  },
  { icon: Mail, label: "Email", value: "info@qoshiqcha.uz", href: "mailto:info@qoshiqcha.uz" },
];

export const businessSocials = [
  { icon: Send, label: "Telegram", href: "https://t.me/qoshiqchafood", color: "bg-sky-500" },
  {
    icon: Instagram,
    label: "Instagram",
    href: "https://instagram.com/qoshiqchafood",
    color: "bg-gradient-to-br from-fuchsia-500 to-orange-500",
  },
  {
    icon: Facebook,
    label: "Facebook",
    href: "https://facebook.com/qoshiqchafood",
    color: "bg-blue-600",
  },
];

export const businessWorkingHours = "Har kuni: 09:00 — 00:00";

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
