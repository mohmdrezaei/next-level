import type { ProductSet } from "../types";

/**
 * A "set" is a complete look: three or four pieces from the catalogue that are
 * meant to be worn together. Buying the whole look applies a bundle discount,
 * which is why `discountRate` lives on the set rather than on the products.
 */
export const SETS: ProductSet[] = [
  {
    slug: "weekend-smart",
    title: "ست آخر هفته",
    latinTitle: "Weekend Smart",
    subtitle: "کتانی مینیمال، جین سلوج، پیراهن آکسفورد و یک بافت روی آن",
    description:
      "سبک‌ترین ترکیب آتلیه برای آخر هفته: کتانی چرم موناکو زیر شلوار جین سلوج دیترویت، پیراهن آکسفورد لندن و بافت یقه‌گرد کپنهاگ به‌عنوان لایه رویی. این چهار قطعه پالت رنگی هم‌خانواده‌ای دارند و کنار هم استایلی یکدست می‌سازند.",
    occasion: "آخر هفته",
    season: "پاییز و بهار",
    discountRate: 0.1,
    featured: true,
    accent: "#c8a24c",
    items: [
      { productId: "p-016", role: "کفش" },
      { productId: "p-012", role: "شلوار" },
      { productId: "p-006", role: "پیراهن" },
      { productId: "p-010", role: "بافت" },
    ],
  },
  {
    slug: "city-layering",
    title: "ست لایه‌ای شهری",
    latinTitle: "City Layering",
    subtitle: "ترنچ‌کت اسلو، پلیور مرینو، شلوار ریو و بوت چلسی",
    description:
      "سه لایه‌ای که هوای متغیر شهر را پوشش می‌دهد: پلیور مرینو آلپ به‌عنوان لایه میانی، ترنچ‌کت اسلو روی آن و شلوار پارچه‌ای ریو با بوت چلسی لندنر در پایین. همه قطعات را می‌توان جدا هم پوشید.",
    occasion: "شهری",
    season: "پاییز",
    discountRate: 0.1,
    featured: true,
    accent: "#a9713b",
    items: [
      { productId: "p-003", role: "رویه" },
      { productId: "p-009", role: "بافت" },
      { productId: "p-011", role: "شلوار" },
      { productId: "p-015", role: "بوت" },
    ],
  },
  {
    slug: "office-milano",
    title: "ست اداری میلانو",
    latinTitle: "Office Milano",
    subtitle: "کت‌وشلوار میلانو، پیراهن آکسفورد، کفش و کمربند چرم",
    description:
      "کامل‌ترین ست رسمی آتلیه: کت‌وشلوار دو دکمه میلانو با پیراهن آکسفورد لندن، کفش چرم آکسفورد و کمربند چرم تورن که رنگ چرمش با کفش هماهنگ است. انتخاب اول برای جلسه‌های کاری و مراسم رسمی.",
    occasion: "اداری",
    season: "چهارفصل",
    discountRate: 0.12,
    featured: true,
    accent: "#c8a24c",
    items: [
      { productId: "p-004", role: "کت‌وشلوار" },
      { productId: "p-006", role: "پیراهن" },
      { productId: "p-014", role: "کفش" },
      { productId: "p-018", role: "کمربند" },
    ],
  },
  {
    slug: "winter-next-level",
    title: "ست زمستانی Next Level",
    latinTitle: "Winter Noir",
    subtitle: "پالتو کشمیر مونته، شال زوریخ، شلوار ریو و بوت چلسی",
    description:
      "گرم‌ترین ست فصل با پالتو کشمیر مونته و شال کشمیر زوریخ. شلوار پارچه‌ای ریو زیر پالتو فرم مناسبی می‌دهد و بوت چلسی لندنر در سرما و بارش بهتر از کفش‌های راحتی جواب می‌دهد.",
    occasion: "زمستانی",
    season: "زمستان",
    discountRate: 0.12,
    featured: true,
    accent: "#8f6f1c",
    items: [
      { productId: "p-001", role: "رویه" },
      { productId: "p-020", role: "شال" },
      { productId: "p-011", role: "شلوار" },
      { productId: "p-015", role: "بوت" },
    ],
  },
  {
    slug: "smart-casual",
    title: "ست نیمه‌رسمی",
    latinTitle: "Smart Casual",
    subtitle: "کت تک تورینو، پیراهن کتان، chino و کتانی",
    description:
      "جایی میان رسمی و راحت: کت تک تورینو روی پیراهن کتان کارائیب، شلوار chino کیوتو و کتانی مینیمال موناکو. ترکیبی که در محیط کار مدرن و مهمانی‌های غیررسمی هر دو جا می‌افتد.",
    occasion: "نیمه‌رسمی",
    season: "بهار و تابستان",
    discountRate: 0.08,
    featured: false,
    accent: "#6c9bd1",
    items: [
      { productId: "p-005", role: "کت" },
      { productId: "p-007", role: "پیراهن" },
      { productId: "p-013", role: "شلوار" },
      { productId: "p-016", role: "کفش" },
    ],
  },
  {
    slug: "leather-weekend",
    title: "ست چرم آخر هفته",
    latinTitle: "Leather Weekend",
    subtitle: "کاپشن چرم راونا، جین دیترویت، کتانی و کیف چرم",
    description:
      "ست چرم‌محور آتلیه: کاپشن چرم راونا با جین سلوج دیترویت، کتانی موناکو و کیف چرم کارتر. رنگ چرم کاپشن و کیف هم‌خانواده است و جین تیره تضاد خوبی در پایین ست ایجاد می‌کند.",
    occasion: "آخر هفته",
    season: "پاییز",
    discountRate: 0.1,
    featured: false,
    accent: "#a9713b",
    items: [
      { productId: "p-002", role: "رویه" },
      { productId: "p-012", role: "شلوار" },
      { productId: "p-016", role: "کفش" },
      { productId: "p-017", role: "کیف" },
    ],
  },
  {
    slug: "evening-next-level",
    title: "ست شب Next Level",
    latinTitle: "Evening Noir",
    subtitle: "پیراهن مخمل فلورانس، کت تک، شلوار ریو و کفش آکسفورد",
    description:
      "برای شب‌های خاص: پیراهن مخمل فلورانس با کت تک تورینو، شلوار پارچه‌ای ریو و کفش چرم آکسفورد. بافت مخمل در نور کم عمق پیدا می‌کند و ست را از یک لباس رسمی ساده جدا می‌کند.",
    occasion: "مهمانی شب",
    season: "چهارفصل",
    discountRate: 0.1,
    featured: false,
    accent: "#b06a8a",
    items: [
      { productId: "p-008", role: "پیراهن" },
      { productId: "p-005", role: "کت" },
      { productId: "p-011", role: "شلوار" },
      { productId: "p-014", role: "کفش" },
    ],
  },
  {
    slug: "summer-light",
    title: "ست تابستانی",
    latinTitle: "Summer Light",
    subtitle: "پیراهن کتان، chino روشن و کتانی",
    description:
      "سه قطعه برای گرم‌ترین روزها: پیراهن کتان کارائیب، شلوار chino کیوتو و کتانی مینیمال موناکو. هر سه از پارچه‌های سبک و رنگ‌های روشن انتخاب شده‌اند تا گرما را کمتر حس کنید.",
    occasion: "تابستانی",
    season: "تابستان",
    discountRate: 0.08,
    featured: false,
    accent: "#6c9bd1",
    items: [
      { productId: "p-007", role: "پیراهن" },
      { productId: "p-013", role: "شلوار" },
      { productId: "p-016", role: "کفش" },
    ],
  },
];

export const SET_BY_SLUG = new Map(SETS.map((set) => [set.slug, set]));
