import { Quote } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import { StaggerGroup, StaggerItem } from "@/components/shared/reveal";
import { RatingStars } from "@/components/shared/rating-stars";
import { InitialsAvatar } from "@/components/ui/avatar";

const TESTIMONIALS = [
  {
    name: "کامران راد",
    city: "کرج",
    rating: 5,
    quote:
      "سه سال است از Next Level خرید می‌کنم. تنها برندی است که سایزبندی‌اش ثابت مانده و پارچه بعد از ده‌ها بار پوشیدن تغییری نمی‌دهد.",
  },
  {
    name: "سهیل نوری",
    city: "اصفهان",
    rating: 5,
    quote:
      "پالتو کشمیر مونته را برای زمستان گرفتم؛ سبک‌تر از چیزی بود که فکر می‌کردم اما گرمای واقعی دارد. بسته‌بندی هم بی‌نظیر بود.",
  },
  {
    name: "بابک تهرانی",
    city: "تهران",
    rating: 4,
    quote:
      "پشتیبانی خیلی دقیق راهنمایی کرد که چه سایزی مناسبم است. لباس دقیقاً همان‌طور که توصیف کردند رسید.",
  },
  {
    name: "نیما فرهادی",
    city: "شیراز",
    rating: 5,
    quote:
      "کت‌وشلوار میلانو را برای جشن عروسی گرفتم. ایستایی شیک شانه‌ها و ساختار نیمه‌آستر کت واقعاً تفاوت کیفیت را نشان می‌دهد.",
  },
];

export function Testimonials() {
  return (
    <section className="border-y border-line bg-carbon/40">
      <div className="container-page py-20 lg:py-28">
        <SectionHeading
          eyebrow="تجربه مشتریان"
          title="آنچه درباره ما می‌گویند"
          description="بیش از ۹۰٪ مشتریان Next Level برای بار دوم خرید می‌کنند. این بخش بر اساس بازخوردهای ثبت‌شده در سایت نوشته شده است."
          align="center"
          className="mb-12"
        />

        <StaggerGroup className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {TESTIMONIALS.map((item) => (
            <StaggerItem key={item.name}>
              <figure className="flex h-full flex-col gap-5 rounded-xl border border-line bg-surface/60 p-5 shadow-soft transition-colors duration-500 hover:border-gold/25">
                <Quote className="size-5 text-gold/60" />

                <blockquote className="flex-1 text-xs leading-7 text-smoke">
                  {item.quote}
                </blockquote>

                <RatingStars rating={item.rating} showValue={false} />

                <figcaption className="flex items-center gap-3 border-t border-line pt-4">
                  <InitialsAvatar name={item.name} accent="#c8a24c" className="size-9" />
                  <span className="flex flex-col">
                    <span className="text-xs text-ivory">{item.name}</span>
                    <span className="text-[0.65rem] text-mute">{item.city}</span>
                  </span>
                </figcaption>
              </figure>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
