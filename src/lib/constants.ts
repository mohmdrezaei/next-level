export const SITE = {
  name: "Next Level",
  latinName: "NEXT LEVEL",
  tagline: "بوتیک پوشاک مردانه",
  shortDescription: "پوشاک مردانه با دوخت ایتالیایی، پارچه‌های منتخب و طراحی مینیمال.",
  description:
    "Next Level یک بوتیک پوشاک مردانه است؛ جایی که پارچه‌های منتخب ایتالیایی و ژاپنی به لباس‌هایی با دوخت دقیق و طراحی مینیمال تبدیل می‌شوند. هر قطعه در تیراژ محدود تولید و پیش از ارسال، مرحله‌به‌مرحله بازرسی می‌شود.",
  phone: "۰۲۱ ۹۱۰۰ ۲۲۳۳",
  phoneRaw: "+982191002233",
  email: "care@nextlevel.ir",
  address: "تهران، خیابان ولیعصر، نبش کوچه ناهید، پلاک ۱۲، طبقه دوم",
  workingHours: "شنبه تا پنجشنبه، ۱۰:۰۰ تا ۲۰:۰۰",
  instagram: "nextlevel.atelier",
} as const;

export type NavLink = { title: string; href: string; description?: string };

export const PRIMARY_NAV: NavLink[] = [
  { title: "فروشگاه", href: "/shop", description: "همه محصولات بوتیک" },
  { title: "ست‌های کامل", href: "/sets", description: "ترکیب‌های آماده و هماهنگ" },
  { title: "درباره ما", href: "/about", description: "داستان بوتیک" },
  { title: "تماس با ما", href: "/contact", description: "پشتیبانی و همکاری" },
];

export const FOOTER_NAV: { title: string; links: NavLink[] }[] = [
  {
    title: "خرید",
    links: [
      { title: "همه محصولات", href: "/shop" },
      { title: "ست‌های کامل", href: "/sets" },
      { title: "جدیدترین‌ها", href: "/shop?sort=newest" },
      { title: "تخفیف‌دارها", href: "/shop?onlyDiscount=1" },
    ],
  },
  {
    title: "حساب من",
    links: [
      { title: "پنل کاربری", href: "/account" },
      { title: "سفارش‌های من", href: "/account/orders" },
      { title: "علاقه‌مندی‌ها", href: "/account/wishlist" },
      { title: "آدرس‌ها", href: "/account/addresses" },
    ],
  },
  {
    title: "راهنما",
    links: [
      { title: "راهنمای سایز", href: "/about#sizing" },
      { title: "شرایط بازگشت کالا", href: "/about#returns" },
      { title: "نحوه ارسال", href: "/about#shipping" },
      { title: "سوالات متداول", href: "/about#faq" },
    ],
  },
];

export const SOCIAL_LINKS = [
  { title: "اینستاگرام", href: "https://instagram.com" },
  { title: "تلگرام", href: "https://telegram.org" },
  { title: "لینکدین", href: "https://linkedin.com" },
  { title: "پینترست", href: "https://pinterest.com" },
];

/** Orders above this amount ship free. */
export const FREE_SHIPPING_THRESHOLD = 5_000_000;

/** VAT applied at checkout (9%). */
export const TAX_RATE = 0.09;

export const SHIPPING_METHODS = [
  {
    id: "standard",
    title: "ارسال استاندارد",
    description: "تحویل ۳ تا ۵ روز کاری در سراسر ایران",
    price: 149_000,
    estimate: "۳ تا ۵ روز کاری",
  },
  {
    id: "express",
    title: "ارسال سریع",
    description: "تحویل ۲۴ ساعته در تهران و کرج",
    price: 349_000,
    estimate: "۲۴ ساعته",
  },
  {
    id: "pickup",
    title: "تحویل حضوری در بوتیک",
    description: "دریافت از بوتیک ولیعصر پس از تأیید آماده‌سازی",
    price: 0,
    estimate: "همان روز",
  },
] as const;

export type ShippingMethodId = (typeof SHIPPING_METHODS)[number]["id"];

export const PAYMENT_METHODS = [
  { id: "gateway", title: "پرداخت اینترنتی", description: "انتقال به درگاه امن بانکی" },
  { id: "wallet", title: "کیف پول Next Level", description: "پرداخت از موجودی کیف پول" },
  { id: "cod", title: "پرداخت در محل", description: "فقط برای تهران و کرج" },
] as const;

export type PaymentMethodId = (typeof PAYMENT_METHODS)[number]["id"];

export const COOKIE_KEYS = {
  cart: "nextlevel.cart",
  wishlist: "nextlevel.wishlist",
  session: "nextlevel.session",
} as const;

export const ADMIN_CREDENTIALS = {
  email: "admin@nextlevel.test",
  password: "nextlevel1234",
} as const;

export const DEMO_CREDENTIALS = {
  phone: "09120000000",
  password: "nextlevel1234",
  name: "آرش مهرآذین",
} as const;
