import type { Category, CategorySlug, Product, ProductBadge, ProductColor } from "../types";

/* -------------------------------------------------------------------------- */
/*  Categories                                                                */
/* -------------------------------------------------------------------------- */

export const CATEGORIES: Category[] = [
  {
    slug: "outerwear",
    title: "رویه و پالتو",
    latinTitle: "Outerwear",
    description: "پالتو، ترنچ و کاپشن‌هایی با پارچه‌های ضخیم ایتالیایی برای روزهای سرد.",
  },
  {
    slug: "suits",
    title: "کت و شلوار",
    latinTitle: "Tailoring",
    description: "کت و شلوارهای دوخته‌شده با ساختار نیمه‌آستر و الگوی اروپایی.",
  },
  {
    slug: "shirts",
    title: "پیراهن",
    latinTitle: "Shirting",
    description: "پیراهن‌های آکسفورد، کتان و مخمل با یقه‌های دست‌دوز.",
  },
  {
    slug: "knitwear",
    title: "بافت و پلیور",
    latinTitle: "Knitwear",
    description: "بافت‌های مرینوس و کشمیر با بافت یکدست و بدون پرزدهی.",
  },
  {
    slug: "trousers",
    title: "شلوار",
    latinTitle: "Trousers",
    description: "شلوار پارچه‌ای، جین سلوج و chino با فیت‌های متنوع.",
  },
  {
    slug: "footwear",
    title: "کفش",
    latinTitle: "Footwear",
    description: "کفش‌های چرم دست‌دوز با زیره طبیعی و رویه تمام‌چرم.",
  },
  {
    slug: "accessories",
    title: "اکسسوری",
    latinTitle: "Accessories",
    description: "کیف، کمربند، شال و ساعت‌هایی که استایل را کامل می‌کنند.",
  },
];

export const CATEGORY_MAP: Record<CategorySlug, Category> = CATEGORIES.reduce(
  (acc, category) => ({ ...acc, [category.slug]: category }),
  {} as Record<CategorySlug, Category>,
);

/* -------------------------------------------------------------------------- */
/*  Derivations                                                               */
/* -------------------------------------------------------------------------- */

const CARE_BY_CATEGORY: Record<CategorySlug, string[]> = {
  outerwear: [
    "خشک‌شویی تخصصی توصیه می‌شود",
    "از تماس مستقیم با عطر و مواد شیمیایی پرهیز کنید",
    "پیش از نگهداری، در آویز چوبی و در کاور قرار دهید",
  ],
  suits: [
    "خشک‌شویی با دمای پایین",
    "بین دو بار پوشیدن، حداقل ۲۴ ساعت استراحت دهید",
    "برای براق‌شدن پارچه، اتو را با پارچه واسط استفاده کنید",
  ],
  shirts: [
    "شست‌وشو با آب سرد و دمای ۳۰ درجه",
    "اتوکردن از سمت پشت پارچه",
    "سفیدکننده کلردار ممنوع است",
  ],
  knitwear: [
    "شست‌وشوی دستی با شامپو ملایم",
    "هرگز آویز نکنید؛ روی سطح تخت خشک کنید",
    "برای نگهداری، تا کرده و در کاور قرار دهید",
  ],
  trousers: [
    "شست‌وشو با آب سرد و چرخه ملایم",
    "اتو در دمای متوسط از سمت پشت",
    "از خشک‌کن صنعتی پرهیز کنید",
  ],
  footwear: [
    "پس از هر بار پوشیدن با برس نرم تمیز کنید",
    "هر ۱۰ روز یک‌بار واکس بزنید",
    "در هوای بارانی از اسپری محافظ استفاده کنید",
  ],
  accessories: [
    "دور از رطوبت و نور مستقیم نگه دارید",
    "برای چرم، کرم مرطوب‌کننده استفاده کنید",
    "در کاور پارچه‌ای نگهداری شود",
  ],
};

const SIZE_SETS: Record<CategorySlug, string[]> = {
  outerwear: ["S", "M", "L", "XL", "XXL"],
  suits: ["S", "M", "L", "XL", "XXL"],
  shirts: ["S", "M", "L", "XL", "XXL"],
  knitwear: ["S", "M", "L", "XL", "XXL"],
  trousers: ["S", "M", "L", "XL", "XXL"],
  footwear: ["40", "41", "42", "43", "44", "45"],
  accessories: ["ONE"],
};

const BADGE_LABELS: Record<ProductBadge, string> = {
  new: "جدید",
  limited: "تیراژ محدود",
  bestseller: "پرفروش",
  sale: "تخفیف",
};

export const badgeLabel = (badge: ProductBadge) => BADGE_LABELS[badge];

/* -------------------------------------------------------------------------- */
/*  Seed                                                                      */
/* -------------------------------------------------------------------------- */

interface Seed {
  id: string;
  slug: string;
  name: string;
  latinName: string;
  category: CategorySlug;
  price: number;
  compareAtPrice?: number;
  short: string;
  story: string;
  materials: string[];
  highlights: string[];
  colors: [name: string, hex: string][];
  outOfStock?: string[];
  rating: number;
  reviews: number;
  badges?: ProductBadge[];
  createdAt: string;
  featured?: boolean;
}

const SEEDS: Seed[] = [
  {
    id: "p-001",
    slug: "monte-cashmere-coat",
    name: "پالتو کشمیر مونته",
    latinName: "Monte Cashmere Coat",
    category: "outerwear",
    price: 18_900_000,
    compareAtPrice: 23_500_000,
    short: "پالتو کشمیر بلند با یقه انگلیسی و ساختار نیمه‌آستر.",
    story:
      "«مونته» از کشمیر شانه‌زده مغولستان بافته شده؛ الیافی با طول بلند که سطحی مات و درخششی آرام به پارچه می‌دهد. الگوی بلند و کشیده آن با شانه‌های نرم، خط بدنه را کشیده‌تر نشان می‌دهد.",
    materials: ["۸۰٪ کشمیر، ۲۰٪ پشم مرینو", "آستر ویسکوز ایتالیایی", "دکمه شاخ طبیعی"],
    highlights: ["دوخت ۱۰ بخیه در هر اینچ", "جیب داخلی دوتیکه", "شیار پشتی برای آزادی حرکت"],
    colors: [["زغالی", "#2b2b31"], ["شتری", "#a9855c"], ["سرمه‌ای", "#232a3c"]],
    rating: 4.9,
    reviews: 128,
    badges: ["bestseller"],
    createdAt: "2026-08-14",
    featured: true,
  },
  {
    id: "p-002",
    slug: "ravenna-leather-jacket",
    name: "کاپشن چرم راونا",
    latinName: "Ravenna Leather Jacket",
    category: "outerwear",
    price: 24_500_000,
    short: "کاپشن چرم گوسفندی با رویه دباغی گیاهی.",
    story:
      "چرم «راونا» با روش دباغی گیاهی آماده شده و به همین دلیل بافتی نرم و رنگی عمیق دارد. زیپ‌های برنجی و آستر ساتن، آن را برای پوشیدن در سه فصل مناسب می‌کند.",
    materials: ["۱۰۰٪ چرم گوسفند دباغی گیاهی", "زیپ برنجی YKK", "آستر ساتن کاپرو"],
    highlights: ["دباغی گیاهی بدون کروم", "دوخت مضاعف در نقاط فشار", "فیت ریلکس"],
    colors: [["مشکی", "#141418"], ["قهوه‌ای تیره", "#3d2b21"]],
    outOfStock: ["S"],
    rating: 4.8,
    reviews: 76,
    badges: ["limited", "new"],
    createdAt: "2026-09-02",
    featured: true,
  },
  {
    id: "p-003",
    slug: "oslo-trench-coat",
    name: "ترنچ‌کت اسلو",
    latinName: "Oslo Trench Coat",
    category: "outerwear",
    price: 15_200_000,
    short: "ترنچ‌کت پنبه‌ای ضدآب با کمربند و یقه دوتیکه.",
    story:
      "پارچه گاباردین پنبه‌ای با پوشش ضدآب، «اسلو» را برای باران‌های سبک ایده‌آل کرده است. یقه دوتیکه و کمربند پارچه‌ای، سیلوئت کلاسیک ترنچ را حفظ می‌کند.",
    materials: ["۱۰۰٪ پنبه گاباردین ضدآب", "دکمه صدفی", "بند کمر پارچه‌ای"],
    highlights: ["مقاومت آبی ۵۰۰۰ میلی‌متر", "درزهای سیل‌شده", "جیب‌های دکمه‌دار"],
    colors: [["کرم", "#cbbfa6"], ["زیتونی", "#4a4a37"], ["مشکی", "#1a1a1e"]],
    rating: 4.7,
    reviews: 54,
    createdAt: "2026-07-28",
  },
  {
    id: "p-004",
    slug: "milano-two-button-suit",
    name: "کت‌وشلوار دو دکمه میلانو",
    latinName: "Milano Two-Button Suit",
    category: "suits",
    price: 32_000_000,
    compareAtPrice: 38_500_000,
    short: "کت‌وشلوار پشمی با الگوی اروپایی و ساختار نیمه‌آستر.",
    story:
      "«میلانو» روی الگویی با شانه باریک و کمر جمع‌شده دوخته شده تا خط بدن را بدون فشار نشان دهد. پارچه پشم خالص چهار فصل است و در طول روز فرم خود را حفظ می‌کند.",
    materials: ["۱۰۰٪ پشم خالص Super 120s", "آستر بمبرگ", "فوم نرم شانه"],
    highlights: ["نیمه‌آستر برای تنفس بهتر", "دو چاک پشتی", "شلوار با بند تنظیم جانبی"],
    colors: [["سرمه‌ای", "#1f2740"], ["خاکستری دودی", "#4c4c53"], ["مشکی", "#111114"]],
    rating: 4.9,
    reviews: 92,
    badges: ["bestseller"],
    createdAt: "2026-06-19",
    featured: true,
  },
  {
    id: "p-005",
    slug: "torino-blazer",
    name: "کت تک تورینو",
    latinName: "Torino Blazer",
    category: "suits",
    price: 19_400_000,
    short: "کت تک کتان با آستر کامل و جیب‌های فلپ.",
    story:
      "کت «تورینو» از کتان ایرلندی دوخته شده و به‌خاطر بافت بازش، در هوای گرم راحت است. ساختار سبک آن اجازه می‌دهد به‌تنهایی یا روی پیراهن پوشیده شود.",
    materials: ["۱۰۰٪ کتان ایرلندی", "آستر ویسکوز", "دکمه خامه‌ای"],
    highlights: ["جیب فلپ دوتیکه", "چاک مرکزی", "قابل ست با شلوار کتان"],
    colors: [["سنگ", "#8d8578"], ["سرمه‌ای", "#262d43"]],
    rating: 4.6,
    reviews: 41,
    createdAt: "2026-08-05",
  },
  {
    id: "p-006",
    slug: "london-oxford-shirt",
    name: "پیراهن آکسفورد لندن",
    latinName: "London Oxford Shirt",
    category: "shirts",
    price: 4_850_000,
    short: "پیراهن آکسفورد با یقه دکمه‌دار و بافت درشت.",
    story:
      "بافت آکسفورد درشت، این پیراهن را کمی رسمی‌تر از یک تی‌شرت و راحت‌تر از یک پیراهن اداری می‌کند. یقه دکمه‌دار، فرم خود را در طول روز حفظ می‌کند.",
    materials: ["۱۰۰٪ پنبه آکسفورد", "دوخت مادگی ۱۸ بخیه", "دکمه صدفی"],
    highlights: ["برش نیمه‌فیت", "سرآستین دو دکمه‌ای", "ضدچروک ملایم"],
    colors: [["آبی روشن", "#9db6d4"], ["سفید", "#f2efe9"], ["صورتی", "#e3c3c0"]],
    rating: 4.8,
    reviews: 214,
    badges: ["bestseller"],
    createdAt: "2026-05-11",
    featured: true,
  },
  {
    id: "p-007",
    slug: "caribbean-linen-shirt",
    name: "پیراهن کتان کارائیب",
    latinName: "Caribbean Linen Shirt",
    category: "shirts",
    price: 5_600_000,
    short: "پیراهن کتان با یقه باز و برش راحت تابستانی.",
    story:
      "کتان شسته‌شده اروپایی، بافتی خنک و کمی نامنظم دارد که همان جذابیت طبیعی کتان است. برش راحت آن برای روزهای گرم طراحی شده.",
    materials: ["۱۰۰٪ کتان شسته", "دکمه صدفی", "درز فرانسوی"],
    highlights: ["قابلیت عبور هوا", "بدون آستر", "قابل شست‌وشو در ماشین"],
    colors: [["سفید", "#f4f1eb"], ["آبی نفتی", "#2c4557"], ["کاراملی", "#b48a5f"]],
    outOfStock: ["XXL"],
    rating: 4.7,
    reviews: 97,
    createdAt: "2026-07-02",
  },
  {
    id: "p-008",
    slug: "firenze-velvet-shirt",
    name: "پیراهن مخمل فلورانس",
    latinName: "Firenze Velvet Shirt",
    category: "shirts",
    price: 7_200_000,
    short: "پیراهن مخمل شب با درخشش کنترل‌شده.",
    story:
      "مخمل پنبه‌ای با پرزبندی کوتاه، درخششی ملایم دارد که آن را برای مهمانی‌های شب مناسب می‌کند. یقه ایتالیایی و سرآستین بسته، ظاهری جمع‌وجور می‌سازد.",
    materials: ["۹۵٪ پنبه، ۵٪ الاستان", "مخمل پرزبندی کوتاه", "دکمه مخفی"],
    highlights: ["دکمه سینه مخفی", "مناسب استایل شب", "حفظ رنگ بالا"],
    colors: [["سرمه‌ای", "#1b2338"], ["سبز جنگلی", "#1f3428"], ["زرشکی", "#5a1f26"]],
    rating: 4.5,
    reviews: 38,
    badges: ["new"],
    createdAt: "2026-09-10",
  },
  {
    id: "p-009",
    slug: "alpe-merino-sweater",
    name: "پلیور مرینو آلپ",
    latinName: "Alpe Merino Sweater",
    category: "knitwear",
    price: 8_900_000,
    compareAtPrice: 10_400_000,
    short: "پلیور مرینوس ۱۴ میکرون با یقه گرد.",
    story:
      "الیاف مرینوس ۱۴ میکرون، ظرافتی نزدیک به کشمیر دارند اما مقاوم‌ترند. «آلپ» با بافت یکدست و سرآستین کشباف، بدون پرزدهی مکرر باقی می‌ماند.",
    materials: ["۱۰۰٪ پشم مرینوس ۱۴ میکرون", "بافت فول‌گارمنت", "کشباف ریب"],
    highlights: ["ضدخارش", "تنظیم دمای طبیعی", "بدون درز شانه"],
    colors: [["شتری", "#b79470"], ["خاکستری", "#6d6d72"], ["زغالی", "#2a2a30"]],
    rating: 4.9,
    reviews: 156,
    badges: ["bestseller"],
    createdAt: "2026-08-21",
    featured: true,
  },
  {
    id: "p-010",
    slug: "copenhagen-crewneck",
    name: "بافت یقه‌گرد کپنهاگ",
    latinName: "Copenhagen Crewneck",
    category: "knitwear",
    price: 6_400_000,
    short: "بافت درشت با یقه گرد و شانه افتاده.",
    story:
      "بافت درشت و شانه افتاده، «کپنهاگ» را به یک انتخاب راحت برای آخر هفته تبدیل می‌کند. پشم ضخیم آن گرما را نگه می‌دارد بدون اینکه سنگین شود.",
    materials: ["۸۰٪ پشم، ۲۰٪ نایلون", "بافت چانکی", "لبه ریب دوتیکه"],
    highlights: ["شانه افتاده", "وزن سبک", "قابل ست با جین"],
    colors: [["کرم", "#ddd3c0"], ["سبز خزه‌ای", "#3f4a38"], ["قهوه‌ای", "#4a382c"]],
    rating: 4.6,
    reviews: 63,
    createdAt: "2026-08-30",
  },
  {
    id: "p-011",
    slug: "rio-pleated-trousers",
    name: "شلوار پارچه‌ای ریو",
    latinName: "Rio Pleated Trousers",
    category: "trousers",
    price: 5_900_000,
    short: "شلوار پارچه‌ای با پیلی و فیت مستقیم.",
    story:
      "پیلی جلو، حجمی کنترل‌شده در ناحیه ران ایجاد می‌کند و حرکت را راحت‌تر می‌سازد. پارچه پشمی سبک، فرم شلوار را در طول روز حفظ می‌کند.",
    materials: ["۷۰٪ پشم، ۳۰٪ پلی‌استر", "کمر بندکشی‌شده", "جیب پشت دکمه‌دار"],
    highlights: ["پیلی جلو", "فیت مستقیم", "مناسب استایل رسمی و نیمه‌رسمی"],
    colors: [["خاکستری", "#5b5b60"], ["سرمه‌ای", "#232b42"], ["مشکی", "#141417"]],
    rating: 4.7,
    reviews: 88,
    createdAt: "2026-06-27",
  },
  {
    id: "p-012",
    slug: "detroit-selvedge-jeans",
    name: "شلوار جین سلوج دیترویت",
    latinName: "Detroit Selvedge Jeans",
    category: "trousers",
    price: 4_600_000,
    short: "جین سلوج ۱۴ اونس با رنگ‌رفت طبیعی.",
    story:
      "جین‌های سلوج روی ماشین‌های بافندگی قدیمی بافته می‌شوند و لبه آن‌ها در درز بیرونی دیده می‌شود. در طول زمان، رنگ‌رفت طبیعی و منحصر‌به‌فردی پیدا می‌کنند.",
    materials: ["۱۰۰٪ پنبه سلوج ۱۴ اونس", "دوخت زنجیره‌ای", "پرچم مسی"],
    highlights: ["لبه سلوج قابل مشاهده", "رنگ‌رفت طبیعی", "دوخت زنجیره‌ای کمر"],
    colors: [["آبی نیلی", "#33465e"], ["مشکی شسته", "#2b2b2e"]],
    outOfStock: ["XL"],
    rating: 4.8,
    reviews: 173,
    badges: ["bestseller"],
    createdAt: "2026-04-18",
  },
  {
    id: "p-013",
    slug: "kyoto-chino",
    name: "شلوار chino کیوتو",
    latinName: "Kyoto Chino",
    category: "trousers",
    price: 4_200_000,
    short: "شلوار chino پنبه‌ای با فیت باریک.",
    story:
      "پنبه دوپلی‌شده، سطحی صاف و مقاوم به چروک دارد. برش باریک «کیوتو» آن را برای استایل روزمره و نیمه‌رسمی مناسب می‌کند.",
    materials: ["۹۸٪ پنبه، ۲٪ الاستان", "جیب شیب‌دار", "کمر دکمه‌دار"],
    highlights: ["کشسانی ملایم", "پنج جیب", "قابل شست‌وشو در ماشین"],
    colors: [["خاکی", "#a79272"], ["سبز زیتونی", "#4d5241"], ["سرمه‌ای", "#252c40"]],
    rating: 4.5,
    reviews: 122,
    createdAt: "2026-05-30",
  },
  {
    id: "p-014",
    slug: "oxford-leather-shoes",
    name: "کفش چرم آکسفورد",
    latinName: "Oxford Leather Shoes",
    category: "footwear",
    price: 11_800_000,
    short: "کفش آکسفورد چرم دست‌دوز با زیره چرمی.",
    story:
      "این کفش با روش دوخت گودیر ساخته شده؛ یعنی زیره قابل تعویض است و عمر کفش چند برابر می‌شود. چرم رویه در طول زمان فرم و درخشش بهتری می‌گیرد.",
    materials: ["چرم طبیعی گاوی", "زیره چرمی با دوخت گودیر", "کفی چرمی"],
    highlights: ["دوخت گودیر دست‌دوز", "زیره قابل تعویض", "قالب باریک انگلیسی"],
    colors: [["مشکی", "#141416"], ["قهوه‌ای", "#4a3323"]],
    rating: 4.9,
    reviews: 141,
    badges: ["limited"],
    createdAt: "2026-07-15",
    featured: true,
  },
  {
    id: "p-015",
    slug: "chelsea-boots",
    name: "بوت چلسی لندنر",
    latinName: "Chelsea Boots",
    category: "footwear",
    price: 13_500_000,
    short: "بوت چلسی با کش جانبی و زیره لاستیکی.",
    story:
      "«لندنر» ترکیبی از بوت چلسی کلاسیک و زیره لاستیکی مقاوم است. کش جانبی نرم، پوشیدن و درآوردن را بدون زیپ ساده می‌کند.",
    materials: ["چرم جیر طبیعی", "کش جانبی ایتالیایی", "زیره لاستیکی ضدلغزش"],
    highlights: ["کش آزاد جانبی", "زیره ضدلغزش", "مناسب چهار فصل"],
    colors: [["قهوه‌ای", "#42301f"], ["خاکستری", "#4a4a4d"]],
    rating: 4.7,
    reviews: 69,
    createdAt: "2026-09-06",
    badges: ["new"],
  },
  {
    id: "p-016",
    slug: "monaco-sneakers",
    name: "کتانی مینیمال موناکو",
    latinName: "Monaco Sneakers",
    category: "footwear",
    price: 7_900_000,
    compareAtPrice: 9_200_000,
    short: "کتانی چرم مینیمال با زیره لاستیکی طبیعی.",
    story:
      "طراحی ساده و بدون لوگو، «موناکو» را به کتانی‌ای تبدیل می‌کند که با هر استایلی ست می‌شود. زیره لاستیکی طبیعی، بالشتک نرمی دارد.",
    materials: ["چرم طبیعی ناپا", "زیره لاستیکی طبیعی", "آستر پارچه‌ای"],
    highlights: ["بدون لوگوی بیرونی", "کفی طبی نرم", "وزن سبک"],
    colors: [["سفید", "#eae7e1"], ["مشکی", "#1b1b1e"], ["خاکستری", "#8a8a8e"]],
    rating: 4.6,
    reviews: 188,
    createdAt: "2026-08-09",
  },
  {
    id: "p-017",
    slug: "carter-leather-bag",
    name: "کیف چرم کارتر",
    latinName: "Carter Leather Bag",
    category: "accessories",
    price: 9_300_000,
    short: "کیف چرم دستی با جیب لپ‌تاپ.",
    story:
      "«کارتر» برای رفت‌وآمد روزانه طراحی شده؛ جیب مخصوص لپ‌تاپ ۱۵ اینچ و بخش‌های جداگانه، نظم را حفظ می‌کند. چرم دباغی‌شده در طول زمان پتینه می‌گیرد.",
    materials: ["چرم طبیعی دباغی گیاهی", "آستر پارچه‌ای ضدآب", "بند قابل جدا شدن"],
    highlights: ["جیب لپ‌تاپ ۱۵ اینچ", "پتینه طبیعی", "دسته مشکی چرمی"],
    colors: [["قهوه‌ای", "#49301f"], ["مشکی", "#16161a"]],
    rating: 4.8,
    reviews: 74,
    badges: ["bestseller"],
    createdAt: "2026-07-21",
  },
  {
    id: "p-018",
    slug: "thorn-leather-belt",
    name: "کمربند چرم تورن",
    latinName: "Thorn Leather Belt",
    category: "accessories",
    price: 3_400_000,
    short: "کمربند چرم تمام‌دانه با سگک برنجی.",
    story:
      "چرم تمام‌دانه (Full-grain) قوی‌ترین بخش پوست است و در طول سال‌ها فرم خود را از دست نمی‌دهد. سگک برنجی بدون آبکاری، رنگ طبیعی خود را حفظ می‌کند.",
    materials: ["چرم تمام‌دانه ۳.۵ میلی‌متر", "سگک برنجی", "دوخت دستی لبه"],
    highlights: ["برش تمام‌دانه", "سگک قابل تعویض", "دوخت لبه دستی"],
    colors: [["قهوه‌ای", "#3e2a1a"], ["مشکی", "#131316"]],
    rating: 4.7,
    reviews: 105,
    createdAt: "2026-06-08",
  },
  {
    id: "p-019",
    slug: "eclipse-watch",
    name: "ساعت اکلیپس",
    latinName: "Eclipse Watch",
    category: "accessories",
    price: 21_000_000,
    short: "ساعت مکانیکی خودکار با بند چرمی.",
    story:
      "موتور خودکار «اکلیپس» با حرکت مچ شارژ می‌شود و ۴۲ ساعت ذخیره انرژی دارد. صفحه مینیمال با شاخص‌های برنزی، خوانایی را در نور کم حفظ می‌کند.",
    materials: ["موتور خودکار ژاپنی", "شیشه سافایر ضدخش", "بند چرم ایتالیایی"],
    highlights: ["۴۲ ساعت ذخیره انرژی", "مقاومت آب ۵ اتمسفر", "شیشه سافایر"],
    colors: [["نقره‌ای", "#b9bcc1"], ["مشکی", "#1c1c20"]],
    rating: 4.9,
    reviews: 47,
    badges: ["limited"],
    createdAt: "2026-09-14",
    featured: true,
  },
  {
    id: "p-020",
    slug: "zurich-cashmere-scarf",
    name: "شال کشمیر زوریخ",
    latinName: "Zurich Cashmere Scarf",
    category: "accessories",
    price: 4_100_000,
    short: "شال کشمیر با لبه ریشه‌دار.",
    story:
      "کشمیر نرم با بافت سبک، گرما را بدون حجم اضافه حفظ می‌کند. لبه ریشه‌دار دست‌بافت، ظاهری سنتی به آن داده است.",
    materials: ["۱۰۰٪ کشمیر", "لبه ریشه‌دار دست‌بافت", "رنگ‌ثابت گیاهی"],
    highlights: ["وزن سبک", "گرمای بالا", "قابل استفاده زیر پالتو"],
    colors: [["شتری", "#c0a37e"], ["خاکستری", "#77777c"], ["زغالی", "#2c2c31"]],
    rating: 4.8,
    reviews: 132,
    createdAt: "2026-08-25",
  },
];

/* -------------------------------------------------------------------------- */
/*  Build                                                                     */
/* -------------------------------------------------------------------------- */

function toProduct(seed: Seed): Product {
  const sizes = SIZE_SETS[seed.category];
  const outOfStock = new Set(seed.outOfStock ?? []);

  const colors: ProductColor[] = seed.colors.map(([name, hex]) => ({
    name,
    hex,
    accent: hex,
  }));

  const variants = sizes.map((size, index) => ({
    size,
    stock: outOfStock.has(size) ? 0 : 4 + ((seed.id.charCodeAt(3) + index * 7) % 22),
  }));

  return {
    id: seed.id,
    slug: seed.slug,
    name: seed.name,
    latinName: seed.latinName,
    category: seed.category,
    price: seed.price,
    compareAtPrice: seed.compareAtPrice ?? null,
    shortDescription: seed.short,
    description: `${seed.short} ${seed.story}`,
    story: seed.story,
    materials: seed.materials,
    care: CARE_BY_CATEGORY[seed.category],
    highlights: seed.highlights,
    colors,
    variants,
    images: [1, 2, 3].map((index) => ({
      src: `/products/${seed.slug}-${index}.svg`,
      alt: `${seed.name} — نمای ${index}`,
    })),
    rating: seed.rating,
    reviewCount: seed.reviews,
    badges: seed.badges ?? [],
    tags: [seed.category, seed.latinName.toLowerCase().split(" ")[0], ...seed.colors.map(([, hex]) => hex)],
    createdAt: seed.createdAt,
    featured: seed.featured ?? false,
  };
}

export const PRODUCTS: Product[] = SEEDS.map(toProduct);

export const PRODUCT_BY_SLUG = new Map(PRODUCTS.map((product) => [product.slug, product]));
export const PRODUCT_BY_ID = new Map(PRODUCTS.map((product) => [product.id, product]));

export const PRICE_BOUNDS = {
  min: Math.min(...PRODUCTS.map((product) => product.price)),
  max: Math.max(...PRODUCTS.map((product) => product.price)),
};

/** Every distinct size across the catalogue, ordered sensibly. */
export const ALL_SIZES = ["S", "M", "L", "XL", "XXL", "40", "41", "42", "43", "44", "45", "ONE"];

/** Every distinct colour across the catalogue. */
export const ALL_COLORS = Array.from(
  new Map(PRODUCTS.flatMap((product) => product.colors).map((color) => [color.name, color])).values(),
);
