import { seededRandom } from "@/lib/utils";
import type { ProductReview } from "@/features/products/types";

const AUTHORS = [
  "آرش مهرآذین",
  "کامران راد",
  "سهیل نوری",
  "بابک تهرانی",
  "پویا صادقی",
  "نیما فرهادی",
  "رضا کیانی",
  "امیرحسین دلاور",
  "شاهین مرادی",
  "محمد بهرامی",
  "کیوان اسدی",
  "فرید شریفی",
];

const TITLES = [
  "کیفیت فراتر از انتظار",
  "کیفیت و تن‌خور بی‌نقص",
  "ارزش خریدش را دارد",
  "دقیقاً همان‌طور که در تصاویر بود",
  "بعد از دو ماه استفاده، هنوز مثل روز اول",
  "پارچه عالی، سایز کمی بزرگ‌تر",
  "برای استفاده روزمره بی‌نظیر",
];

const BODIES = [
  "پارچه واقعاً سنگین و باکیفیت است. ایستایی و فیت لباس کاملاً دقیق و یکدست است و بعد از چند بار استفاده هیچ تغییری نکرده. بسته‌بندی هم بسیار مرتب بود.",
  "از خریدم راضی‌ام. رنگ دقیقاً مثل تصویر است و فرم لباس بعد از شست‌وشو حفظ شد. پیشنهاد می‌کنم یک سایز بالاتر بگیرید اگر فیت راحت دوست دارید.",
  "قیمت نسبت به کیفیت منصفانه است. جزئیات ریز مثل دکمه‌ها و آستر نشان می‌دهد که روی ساخت این قطعه وقت گذاشته شده.",
  "ارسال سریع و بسته‌بندی شکیل. خود محصول هم دقیقاً همان حسی را می‌دهد که از یک برند بوتیک انتظار دارید.",
  "من معمولاً سایز M می‌پوشم و اینجا هم M اندازه‌ام بود. جنس پارچه خنک است و برای فصل‌های میانی عالی است.",
  "کیفیت چرم و پرداخت لبه‌ها فوق‌العاده است. تنها نکته اینکه کمی سنگین‌تر از حد انتظارم بود، ولی در عوض خیلی محکم به نظر می‌رسد.",
  "بعد از شست‌وشوی طبق دستور روی برچسب، هیچ آبرفت یا تغییر رنگی نداشت. برای من که به این موضوع حساس هستم نکته مهمی بود.",
];

/**
 * Reviews are generated deterministically so server and client renders agree.
 */
export function getProductReviews(productId: string, reviewCount: number): ProductReview[] {
  const total = Math.min(8, Math.max(2, Math.round(reviewCount / 12)));
  return Array.from({ length: total }, (_, index) => {
    const seed = `${productId}-${index}`;
    const pick = (list: string[]) => list[Math.floor(seededRandom(seed + list.length) * list.length)];
    const ratingRoll = seededRandom(seed + "r");
    const rating = ratingRoll > 0.82 ? 4 : ratingRoll > 0.2 ? 5 : 3;
    const daysAgo = Math.floor(seededRandom(seed + "d") * 240) + 3;

    return {
      id: `${productId}-rev-${index + 1}`,
      productId,
      author: pick(AUTHORS),
      rating,
      title: pick(TITLES),
      body: pick(BODIES),
      createdAt: new Date(Date.now() - daysAgo * 86_400_000).toISOString(),
      verified: seededRandom(seed + "v") > 0.25,
      helpful: Math.floor(seededRandom(seed + "h") * 42),
    };
  });
}

export function buildRatingBreakdown(reviews: ProductReview[]): { stars: number; count: number }[] {
  return [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((review) => review.rating === stars).length,
  }));
}
