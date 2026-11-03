import { BadgeCheck, Gem, Package, RotateCcw, Truck, Wallet } from "lucide-react";
import { Marquee } from "@/components/shared/marquee";

const ITEMS = [
  { icon: Truck, title: "ارسال رایگان", description: "برای سفارش‌های بالای ۵ میلیون تومان" },
  { icon: RotateCcw, title: "بازگشت ۷ روزه", description: "بدون قید و شرط، با هزینه آتلیه" },
  { icon: BadgeCheck, title: "اصالت پارچه", description: "دارای برگه اصالت و کد پیگیری" },
  { icon: Gem, title: "تیراژ محدود", description: "حداکثر ۸۰ قطعه از هر مدل" },
  { icon: Package, title: "بسته‌بندی آتلیه", description: "جعبه سخت با کاور پارچه‌ای" },
  { icon: Wallet, title: "پرداخت امن", description: "درگاه بانکی و کیف پول Next Level" },
];

export function TrustStrip() {
  return (
    <section className="border-b border-line bg-carbon/40 py-5">
      <Marquee
        speed={52}
        items={ITEMS.map((item) => (
          <div key={item.title} className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full border border-line bg-elevated text-gold">
              <item.icon className="size-4" />
            </span>
            <span className="flex flex-col whitespace-nowrap">
              <span className="text-xs font-medium text-ivory">{item.title}</span>
              <span className="text-[0.65rem] text-mute">{item.description}</span>
            </span>
          </div>
        ))}
      />
    </section>
  );
}
