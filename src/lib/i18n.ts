/**
 * i18n — Qoshiqcha Mini App tarjima tizimi
 * Qo'llab-quvvatlanadigan tillar: O'zbek (uz), Ruscha (ru), Inglizcha (en)
 * Ishlatish:
 *   import { t } from "@/lib/i18n";
 *   const { lang } = useSettings();
 *   t(lang, "addToCart")  // → "Savatga qo'shish"
 */

export type Lang = "uz" | "ru" | "en";

export type TranslationKey =
  // Nav
  | "home"
  | "cart"
  | "orders"
  | "profile"
  // Home
  | "fastDelivery"
  | "freeDeliveryFrom"
  | "freeDelivery"
  | "delivery"
  | "pickup"
  | "open"
  | "closed"
  | "workingHours"
  | "deliveryAddress"
  | "selectOnMap"
  | "branch"
  | "selectBranchTime"
  | "seeAll"
  // Cart
  | "myCart"
  | "clearCart"
  | "clearCartConfirm"
  | "products"
  | "deliveryFee"
  | "free"
  | "total"
  | "placeOrder"
  | "cartEmpty"
  | "cartEmptyDesc"
  | "goToMenu"
  | "addMore"
  // Checkout
  | "checkout"
  | "phone"
  | "phonePlaceholder"
  | "address"
  | "addAddress"
  | "selectBranchPickup"
  | "paymentMethod"
  | "cash"
  | "cardCourier"
  | "onlineSoon"
  | "orderNote"
  | "orderNotePlaceholder"
  | "grandTotal"
  | "confirmOrder"
  | "sending"
  | "shopClosed"
  | "shopClosedDesc"
  | "minOrder"
  | "invalidPhone"
  // Orders
  | "myOrders"
  | "noOrders"
  | "noOrdersDesc"
  | "orderNew"
  | "orderAccepted"
  | "orderPreparing"
  | "orderDelivering"
  | "orderCompleted"
  | "orderCancelled"
  | "orderNewHint"
  // Profile
  | "fillProfile"
  | "savedAddresses"
  | "ordersHistory"
  | "promotions"
  | "branches"
  | "contacts"
  | "language"
  | "about"
  | "editProfile"
  | "adminPanel"
  // ProfileForm
  | "firstName"
  | "lastName"
  | "email"
  | "birthDate"
  | "gender"
  | "male"
  | "female"
  | "other"
  | "save"
  | "cancel"
  | "saving"
  // Address
  | "myAddresses"
  | "newAddress"
  | "noAddresses"
  | "detectLocation"
  | "streetAddress"
  | "titleLabel"
  | "house"
  | "apartment"
  | "floor"
  | "entrance"
  | "courierNote"
  | "makeDefault"
  | "saveAddress"
  // Map / DeliveryMapSheet
  | "deliveryMapTitle"
  | "mapHint"
  | "myLocation"
  | "saveAndContinue"
  | "addressLabel"
  | "addressPlaceholder"
  | "nameLabel"
  // Product
  | "size"
  | "addToCart"
  | "reviews"
  | "noReviews"
  | "writeReview"
  | "cancelReview"
  | "yourRating"
  | "reviewPlaceholder"
  | "submitReview"
  | "showMore"
  | "hide"
  | "productNotFound"
  | "soldOut"
  // Pickup
  | "choosePickup"
  | "pickupBranch"
  | "pickupTime"
  | "confirm"
  // Success
  | "orderSuccess"
  | "orderSuccessDesc"
  | "orderNumber"
  | "trackOrder"
  // Common
  | "loading"
  | "error"
  | "retry"
  | "backToHome"
  | "back"
  | "openNow"
  | "closedNow"
  // Search
  | "searchProducts"
  | "searchPlaceholder"
  | "notFound"
  // Language
  | "chooseLanguage"
  // Promotions
  | "noPromotions"
  | "promotionsTitle"
  // Notifications
  | "notifications"
  | "noNotifications"
  // About / Contacts / Branches
  | "aboutTitle"
  | "contactsTitle"
  | "branchesTitle"
  | "workingTime"
  | "callUs"
  | "writeUs"
  // Branches page
  | "callPhone"
  | "getDirections"
  // Contacts page
  | "socialNetworks"
  // Search page
  | "categories"
  // Catalog states (home page)
  | "catalogError"
  | "catalogEmpty"
  | "catalogEmptyDesc"
  // Orders page
  | "loginRequired"
  // Address page
  | "deviceOnly"
  // Notifications page
  | "notificationsDesc"
  | "justNow"
  | "minutesAgo"
  | "hoursAgo"
  | "daysAgo"
  // Root 404 / error
  | "pageNotFound";

type Translations = Record<TranslationKey, string>;

const uz: Translations = {
  // Nav
  home: "Bosh sahifa",
  cart: "Savat",
  orders: "Buyurtmalar",
  profile: "Profil",
  // Home
  fastDelivery: "Tez yetkazish",
  freeDeliveryFrom: "dan yuqori buyurtmalarga",
  freeDelivery: "Bepul yetkazib beramiz",
  delivery: "Yetkazib berish",
  pickup: "Olib ketish",
  open: "Ochiq",
  closed: "Yopiq",
  workingHours: "Ish vaqti",
  deliveryAddress: "Yetkazish manzili",
  selectOnMap: "Manzilni xaritadan tanlang",
  branch: "Filial",
  selectBranchTime: "Filial va vaqtni tanlang",
  seeAll: "Barchasi",
  // Cart
  myCart: "Savat",
  clearCart: "Tozalash",
  clearCartConfirm: "Savatni tozalashni xohlaysizmi?",
  products: "Mahsulotlar",
  deliveryFee: "Yetkazib berish",
  free: "Bepul",
  total: "Jami",
  placeOrder: "Buyurtma berish",
  cartEmpty: "Savat bo'sh",
  cartEmptyDesc: "Mazali taomlardan tanlang va savatga qo'shing.",
  goToMenu: "Menyuga o'tish",
  addMore: "Yana biror nima?",
  // Checkout
  checkout: "Buyurtmani rasmiylashtirish",
  phone: "Telefon raqam",
  phonePlaceholder: "+998 90 123 45 67",
  address: "Manzil",
  addAddress: "+ Manzil qo'shish",
  selectBranchPickup: "Filial va vaqt tanlash",
  paymentMethod: "To'lov turi",
  cash: "Naqd",
  cardCourier: "Karta orqali kuryerga",
  onlineSoon: "Online to'lov (tez orada)",
  orderNote: "Buyurtma izohi",
  orderNotePlaceholder: "Masalan: domofon ishlamaydi",
  grandTotal: "Yakuniy summa",
  confirmOrder: "Buyurtmani tasdiqlash",
  sending: "Yuborilmoqda...",
  shopClosed: "Do'kon yopiq",
  shopClosedDesc: "Hozir ish vaqti emas, keyinroq urinib ko'ring.",
  minOrder: "Minimal buyurtma",
  invalidPhone: "Telefon raqamini to'g'ri kiriting",
  // Orders
  myOrders: "Buyurtmalarim",
  noOrders: "Buyurtmalar yo'q",
  noOrdersDesc: "Birinchi buyurtmangizni bering va bu yerda kuzating.",
  orderNew: "Ko'rib chiqilmoqda",
  orderAccepted: "Qabul qilindi",
  orderPreparing: "Tayyorlanmoqda",
  orderDelivering: "Yetkazilmoqda",
  orderCompleted: "Yakunlandi",
  orderCancelled: "Bekor qilindi",
  orderNewHint: "Operator qabul qilishi kutilmoqda...",
  // Profile
  fillProfile: "Profilni to'ldirish →",
  savedAddresses: "Saqlangan manzillar",
  ordersHistory: "Buyurtmalar tarixi",
  promotions: "Aksiyalar",
  branches: "Filiallar",
  contacts: "Kontaktlar",
  language: "Til",
  about: "Biz haqimizda",
  editProfile: "Tahrirlash",
  adminPanel: "Admin panel",
  // ProfileForm
  firstName: "Ism",
  lastName: "Familiya",
  email: "Email",
  birthDate: "Tug'ilgan kun",
  gender: "Jinsi",
  male: "Erkak",
  female: "Ayol",
  other: "Boshqa",
  save: "Saqlash",
  cancel: "Bekor",
  saving: "Saqlanmoqda...",
  // Address
  myAddresses: "Mening manzillarim",
  newAddress: "Yangi manzil",
  noAddresses: "Hali manzil yo'q",
  detectLocation: "Joylashuvni aniqlash",
  streetAddress: "Manzil (ko'cha, mahalla)",
  titleLabel: "Sarlavha (uy, ish)",
  house: "Uy",
  apartment: "Xonadon",
  floor: "Qavat",
  entrance: "Kirish",
  courierNote: "Kuryerga izoh",
  makeDefault: "Asosiy qilish",
  saveAddress: "Saqlash",
  // Map
  deliveryMapTitle: "Yetkazib berish manzili",
  mapHint: "Xaritadan joyni belgilang yoki manzilni qo'lda kiriting",
  myLocation: "Joylashuvim",
  saveAndContinue: "Saqlash va davom etish",
  addressLabel: "Manzil",
  addressPlaceholder: "Ko'cha, uy raqami...",
  nameLabel: "Nomi",
  // Product
  size: "Hajmi",
  addToCart: "Savatga qo'shish",
  reviews: "Sharhlar",
  noReviews: "Hali sharhlar yo'q. Birinchi bo'ling!",
  writeReview: "Sharh qoldirish",
  cancelReview: "Bekor qilish",
  yourRating: "Bahoyingiz",
  reviewPlaceholder: "Taassurotlaringizni yozing...",
  submitReview: "Yuborish",
  showMore: "Ko'proq ko'rsatish",
  hide: "Yashirish",
  productNotFound: "Mahsulot topilmadi",
  soldOut: "Mavjud emas",
  // Pickup
  choosePickup: "Olib ketish",
  pickupBranch: "Filial",
  pickupTime: "Vaqt",
  confirm: "Tasdiqlash",
  // Success
  orderSuccess: "Buyurtma qabul qilindi! 🎉",
  orderSuccessDesc: "Tez orada siz bilan bog'lanamiz.",
  orderNumber: "Buyurtma raqami",
  trackOrder: "Buyurtmalarni kuzatish",
  // Common
  loading: "Yuklanmoqda...",
  error: "Xatolik yuz berdi",
  retry: "Qayta urinish",
  backToHome: "Bosh sahifa",
  back: "Orqaga",
  openNow: "Hozir ochiq",
  closedNow: "Hozir yopiq",
  // Search
  searchProducts: "Qidirish",
  searchPlaceholder: "Mahsulot nomi...",
  notFound: "Topilmadi",
  // Language
  chooseLanguage: "Tilni tanlang",
  // Promotions
  noPromotions: "Hozircha aksiyalar yo'q",
  promotionsTitle: "Aksiyalar",
  // Notifications
  notifications: "Bildirishnomalar",
  noNotifications: "Bildirishnomalar yo'q",
  // About / Contacts / Branches
  aboutTitle: "Biz haqimizda",
  contactsTitle: "Kontaktlar",
  branchesTitle: "Filiallar",
  workingTime: "Ish vaqti",
  callUs: "Qo'ng'iroq qiling",
  writeUs: "Yozing",
  // Branches page
  callPhone: "Qo'ng'iroq",
  getDirections: "Yo'l ko'rsat",
  // Contacts page
  socialNetworks: "Ijtimoiy tarmoqlar",
  // Search page
  categories: "Kategoriyalar",
  // Catalog states
  catalogError: "Katalog yuklanmadi",
  catalogEmpty: "Mahsulotlar yo'q",
  catalogEmptyDesc: "Menyu hali to'ldirilmagan",
  // Orders page
  loginRequired: "Telegram orqali kiring.",
  // Address page
  deviceOnly: "Manzillar faqat ushbu qurilmada saqlanadi",
  // Notifications page
  notificationsDesc: "Buyurtma holati o'zgarganida shu yerda ko'rinadi",
  justNow: "Hozir",
  minutesAgo: "daqiqa oldin",
  hoursAgo: "soat oldin",
  daysAgo: "kun oldin",
  // Root 404 / error
  pageNotFound: "Sahifa topilmadi",
};

const ru: Translations = {
  // Nav
  home: "Главная",
  cart: "Корзина",
  orders: "Заказы",
  profile: "Профиль",
  // Home
  fastDelivery: "Быстрая доставка",
  freeDeliveryFrom: "от — бесплатная",
  freeDelivery: "Доставим бесплатно",
  delivery: "Доставка",
  pickup: "Самовывоз",
  open: "Открыто",
  closed: "Закрыто",
  workingHours: "Часы работы",
  deliveryAddress: "Адрес доставки",
  selectOnMap: "Выберите адрес на карте",
  branch: "Филиал",
  selectBranchTime: "Выберите филиал и время",
  seeAll: "Все",
  // Cart
  myCart: "Корзина",
  clearCart: "Очистить",
  clearCartConfirm: "Очистить корзину?",
  products: "Продукты",
  deliveryFee: "Доставка",
  free: "Бесплатно",
  total: "Итого",
  placeOrder: "Оформить заказ",
  cartEmpty: "Корзина пуста",
  cartEmptyDesc: "Выберите вкусные блюда и добавьте в корзину.",
  goToMenu: "В меню",
  addMore: "Ещё что-нибудь?",
  // Checkout
  checkout: "Оформление заказа",
  phone: "Номер телефона",
  phonePlaceholder: "+998 90 123 45 67",
  address: "Адрес",
  addAddress: "+ Добавить адрес",
  selectBranchPickup: "Выбрать филиал и время",
  paymentMethod: "Способ оплаты",
  cash: "Наличные",
  cardCourier: "Картой курьеру",
  onlineSoon: "Онлайн оплата (скоро)",
  orderNote: "Комментарий к заказу",
  orderNotePlaceholder: "Например: домофон не работает",
  grandTotal: "Итоговая сумма",
  confirmOrder: "Подтвердить заказ",
  sending: "Отправляем...",
  shopClosed: "Магазин закрыт",
  shopClosedDesc: "Сейчас нерабочее время, попробуйте позже.",
  minOrder: "Минимальный заказ",
  invalidPhone: "Введите корректный номер телефона",
  // Orders
  myOrders: "Мои заказы",
  noOrders: "Заказов нет",
  noOrdersDesc: "Сделайте первый заказ и отслеживайте его здесь.",
  orderNew: "На рассмотрении",
  orderAccepted: "Принят",
  orderPreparing: "Готовится",
  orderDelivering: "Доставляется",
  orderCompleted: "Завершён",
  orderCancelled: "Отменён",
  orderNewHint: "Ожидаем подтверждения оператора...",
  // Profile
  fillProfile: "Заполнить профиль →",
  savedAddresses: "Сохранённые адреса",
  ordersHistory: "История заказов",
  promotions: "Акции",
  branches: "Филиалы",
  contacts: "Контакты",
  language: "Язык",
  about: "О нас",
  editProfile: "Редактировать",
  adminPanel: "Панель админа",
  // ProfileForm
  firstName: "Имя",
  lastName: "Фамилия",
  email: "Email",
  birthDate: "Дата рождения",
  gender: "Пол",
  male: "Мужской",
  female: "Женский",
  other: "Другой",
  save: "Сохранить",
  cancel: "Отмена",
  saving: "Сохраняем...",
  // Address
  myAddresses: "Мои адреса",
  newAddress: "Новый адрес",
  noAddresses: "Нет адресов",
  detectLocation: "Определить местоположение",
  streetAddress: "Адрес (улица, квартал)",
  titleLabel: "Название (дом, работа)",
  house: "Дом",
  apartment: "Квартира",
  floor: "Этаж",
  entrance: "Подъезд",
  courierNote: "Комментарий курьеру",
  makeDefault: "Сделать основным",
  saveAddress: "Сохранить",
  // Map
  deliveryMapTitle: "Адрес доставки",
  mapHint: "Выберите место на карте или введите адрес вручную",
  myLocation: "Моё местоположение",
  saveAndContinue: "Сохранить и продолжить",
  addressLabel: "Адрес",
  addressPlaceholder: "Улица, номер дома...",
  nameLabel: "Название",
  // Product
  size: "Размер",
  addToCart: "В корзину",
  reviews: "Отзывы",
  noReviews: "Отзывов ещё нет. Будьте первым!",
  writeReview: "Оставить отзыв",
  cancelReview: "Отмена",
  yourRating: "Ваша оценка",
  reviewPlaceholder: "Напишите ваши впечатления...",
  submitReview: "Отправить",
  showMore: "Показать больше",
  hide: "Скрыть",
  productNotFound: "Продукт не найден",
  soldOut: "Нет в наличии",
  // Pickup
  choosePickup: "Самовывоз",
  pickupBranch: "Филиал",
  pickupTime: "Время",
  confirm: "Подтвердить",
  // Success
  orderSuccess: "Заказ принят! 🎉",
  orderSuccessDesc: "Скоро свяжемся с вами.",
  orderNumber: "Номер заказа",
  trackOrder: "Отслеживать заказ",
  // Common
  loading: "Загрузка...",
  error: "Произошла ошибка",
  retry: "Повторить",
  backToHome: "На главную",
  back: "Назад",
  openNow: "Сейчас открыто",
  closedNow: "Сейчас закрыто",
  // Search
  searchProducts: "Поиск",
  searchPlaceholder: "Название продукта...",
  notFound: "Не найдено",
  // Language
  chooseLanguage: "Выберите язык",
  // Promotions
  noPromotions: "Акций пока нет",
  promotionsTitle: "Акции",
  // Notifications
  notifications: "Уведомления",
  noNotifications: "Уведомлений нет",
  // About / Contacts / Branches
  aboutTitle: "О нас",
  contactsTitle: "Контакты",
  branchesTitle: "Филиалы",
  workingTime: "Время работы",
  callUs: "Позвоните нам",
  writeUs: "Напишите нам",
  // Branches page
  callPhone: "Позвонить",
  getDirections: "Маршрут",
  // Contacts page
  socialNetworks: "Соцсети",
  // Search page
  categories: "Категории",
  // Catalog states
  catalogError: "Каталог не загружен",
  catalogEmpty: "Товаров нет",
  catalogEmptyDesc: "Меню ещё не заполнено",
  // Orders page
  loginRequired: "Войдите через Telegram.",
  // Address page
  deviceOnly: "Адреса хранятся только на этом устройстве",
  // Notifications page
  notificationsDesc: "Здесь появятся обновления по статусу заказа",
  justNow: "Только что",
  minutesAgo: "мин назад",
  hoursAgo: "ч назад",
  daysAgo: "дн назад",
  // Root 404 / error
  pageNotFound: "Страница не найдена",
};

const en: Translations = {
  // Nav
  home: "Home",
  cart: "Cart",
  orders: "Orders",
  profile: "Profile",
  // Home
  fastDelivery: "Fast delivery",
  freeDeliveryFrom: "from — free",
  freeDelivery: "Free delivery",
  delivery: "Delivery",
  pickup: "Pickup",
  open: "Open",
  closed: "Closed",
  workingHours: "Working hours",
  deliveryAddress: "Delivery address",
  selectOnMap: "Select address on map",
  branch: "Branch",
  selectBranchTime: "Choose branch and time",
  seeAll: "See all",
  // Cart
  myCart: "Cart",
  clearCart: "Clear",
  clearCartConfirm: "Clear the cart?",
  products: "Products",
  deliveryFee: "Delivery",
  free: "Free",
  total: "Total",
  placeOrder: "Place order",
  cartEmpty: "Cart is empty",
  cartEmptyDesc: "Choose your favorite dishes and add them to cart.",
  goToMenu: "Go to menu",
  addMore: "Want something else?",
  // Checkout
  checkout: "Checkout",
  phone: "Phone number",
  phonePlaceholder: "+998 90 123 45 67",
  address: "Address",
  addAddress: "+ Add address",
  selectBranchPickup: "Select branch and time",
  paymentMethod: "Payment method",
  cash: "Cash",
  cardCourier: "Card to courier",
  onlineSoon: "Online payment (coming soon)",
  orderNote: "Order comment",
  orderNotePlaceholder: "E.g.: intercom is broken",
  grandTotal: "Grand total",
  confirmOrder: "Confirm order",
  sending: "Sending...",
  shopClosed: "Shop is closed",
  shopClosedDesc: "Not working hours now, please try later.",
  minOrder: "Minimum order",
  invalidPhone: "Enter a valid phone number",
  // Orders
  myOrders: "My Orders",
  noOrders: "No orders",
  noOrdersDesc: "Place your first order and track it here.",
  orderNew: "Under review",
  orderAccepted: "Accepted",
  orderPreparing: "Preparing",
  orderDelivering: "On the way",
  orderCompleted: "Completed",
  orderCancelled: "Cancelled",
  orderNewHint: "Waiting for operator confirmation...",
  // Profile
  fillProfile: "Fill profile →",
  savedAddresses: "Saved addresses",
  ordersHistory: "Orders history",
  promotions: "Promotions",
  branches: "Branches",
  contacts: "Contacts",
  language: "Language",
  about: "About us",
  editProfile: "Edit",
  adminPanel: "Admin panel",
  // ProfileForm
  firstName: "First name",
  lastName: "Last name",
  email: "Email",
  birthDate: "Birthday",
  gender: "Gender",
  male: "Male",
  female: "Female",
  other: "Other",
  save: "Save",
  cancel: "Cancel",
  saving: "Saving...",
  // Address
  myAddresses: "My addresses",
  newAddress: "New address",
  noAddresses: "No addresses yet",
  detectLocation: "Detect location",
  streetAddress: "Address (street, district)",
  titleLabel: "Label (home, work)",
  house: "House",
  apartment: "Apartment",
  floor: "Floor",
  entrance: "Entrance",
  courierNote: "Courier note",
  makeDefault: "Make default",
  saveAddress: "Save",
  // Map
  deliveryMapTitle: "Delivery address",
  mapHint: "Select a point on the map or enter address manually",
  myLocation: "My location",
  saveAndContinue: "Save and continue",
  addressLabel: "Address",
  addressPlaceholder: "Street, house number...",
  nameLabel: "Label",
  // Product
  size: "Size",
  addToCart: "Add to cart",
  reviews: "Reviews",
  noReviews: "No reviews yet. Be the first!",
  writeReview: "Write review",
  cancelReview: "Cancel",
  yourRating: "Your rating",
  reviewPlaceholder: "Write your impressions...",
  submitReview: "Submit",
  showMore: "Show more",
  hide: "Hide",
  productNotFound: "Product not found",
  soldOut: "Sold out",
  // Pickup
  choosePickup: "Pickup",
  pickupBranch: "Branch",
  pickupTime: "Time",
  confirm: "Confirm",
  // Success
  orderSuccess: "Order placed! 🎉",
  orderSuccessDesc: "We will contact you soon.",
  orderNumber: "Order number",
  trackOrder: "Track order",
  // Common
  loading: "Loading...",
  error: "An error occurred",
  retry: "Retry",
  backToHome: "Home",
  back: "Back",
  openNow: "Open now",
  closedNow: "Closed now",
  // Search
  searchProducts: "Search",
  searchPlaceholder: "Product name...",
  notFound: "Not found",
  // Language
  chooseLanguage: "Choose language",
  // Promotions
  noPromotions: "No promotions yet",
  promotionsTitle: "Promotions",
  // Notifications
  notifications: "Notifications",
  noNotifications: "No notifications",
  // About / Contacts / Branches
  aboutTitle: "About us",
  contactsTitle: "Contacts",
  branchesTitle: "Branches",
  workingTime: "Working hours",
  callUs: "Call us",
  writeUs: "Write to us",
  // Branches page
  callPhone: "Call",
  getDirections: "Directions",
  // Contacts page
  socialNetworks: "Social networks",
  // Search page
  categories: "Categories",
  // Catalog states
  catalogError: "Failed to load catalog",
  catalogEmpty: "No products",
  catalogEmptyDesc: "Menu is not filled yet",
  // Orders page
  loginRequired: "Login via Telegram.",
  // Address page
  deviceOnly: "Addresses are stored on this device only",
  // Notifications page
  notificationsDesc: "Order status updates will appear here",
  justNow: "Just now",
  minutesAgo: "min ago",
  hoursAgo: "h ago",
  daysAgo: "d ago",
  // Root 404 / error
  pageNotFound: "Page not found",
};

const translations: Record<Lang, Translations> = { uz, ru, en };

/** Tarjima funksiyasi */
export function t(lang: Lang, key: TranslationKey): string {
  return translations[lang]?.[key] ?? translations.uz[key] ?? key;
}

/** React hook — t funksiyasini lang bilan bog'lash uchun */
export function useT(lang: Lang) {
  return (key: TranslationKey) => t(lang, key);
}
