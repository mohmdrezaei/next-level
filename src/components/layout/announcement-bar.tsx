import { Sparkles, Truck, RefreshCcw, ShieldCheck } from "lucide-react";
import { Marquee } from "@/components/shared/marquee";
import { toPersianDigits } from "@/lib/format";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/constants";

const ITEMS = [
  { icon: Truck, text: `ارسال رایگان برای سفارش‌های بالای ${toPersianDigits(FREE_SHIPPING_THRESHOLD / 1_000_000)} میلیون تومان` },
  { icon: RefreshCcw, text: "۷ روز ضمانت بازگشت کالا بدون قید و شرط" },
  { icon: ShieldCheck, text: "پرداخت امن و بازرسی کیفی پیش از ارسال" },
  { icon: Sparkles, text: "ست‌های کامل پاییز و زمستان ۱۴۰۵ منتشر شد" },
];

export function AnnouncementBar() {
  return (
    <div className="relative border-b border-line bg-carbon/80 text-[0.7rem] text-smoke">
      <Marquee
        speed={44}
        items={ITEMS.map((item) => (
          <span key={item.text} className="inline-flex items-center gap-2.5 whitespace-nowrap">
            <item.icon className="size-3.5 text-gold" />
            {item.text}
            <span className="mx-2 size-1 rounded-full bg-line" />
          </span>
        ))}
      />
    </div>
  );
}
