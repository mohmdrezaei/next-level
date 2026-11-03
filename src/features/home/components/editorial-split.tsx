import Link from "next/link";
import { ArrowLeft, Ruler, Scissors, Sparkles } from "lucide-react";
import { Reveal } from "@/components/shared/reveal";
import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "@/components/shared/animated-number";

const PILLARS = [
  {
    icon: Scissors,
    title: "الگو و برش",
    body: "هر مدل روی مانکن واقعی تنظیم می‌شود؛ حداقل سه نسخه آزمایشی پیش از تولید نهایی دوخته می‌شود.",
  },
  {
    icon: Ruler,
    title: "پارچه منتخب",
    body: "پارچه‌ها از کارخانه‌های ایتالیا، ژاپن و ترکیه تأمین می‌شوند و پیش از برش، تست رنگ‌ثباتی می‌شوند.",
  },
  {
    icon: Sparkles,
    title: "پرداخت نهایی",
    body: "دکمه‌ها، آستر و درزها به‌صورت دستی کنترل و قطعات نهایی در تیراژ محدود عرضه می‌شوند.",
  },
];

export function EditorialSplit() {
  return (
    <section className="border-y border-line bg-carbon/40">
      <div className="container-page grid items-center gap-14 py-20 lg:grid-cols-2 lg:gap-20 lg:py-28">
        <Reveal className="relative">
          <div className="relative overflow-hidden rounded-2xl border border-ivory/10">
            <img
              src="https://images.unsplash.com/photo-1598808503746-f34c53b9323e?auto=format&fit=crop&w=1200&q=85"
              alt="آتلیه دوخت Next Level"
              loading="lazy"
              className="media-natural aspect-4/5 w-full object-cover"
            />
            <div className="overlay-scrim pointer-events-none absolute inset-0" />
          </div>

          <div className="glass absolute -bottom-6 right-6 flex items-center gap-5 rounded-xl px-5 py-4 shadow-lift">
            <div className="flex flex-col">
              <AnimatedNumber value={12} className="text-xl font-semibold text-ivory" />
              <span className="text-[0.62rem] text-mute">سال تجربه دوخت</span>
            </div>
            <span className="h-9 w-px bg-line" />
            <div className="flex flex-col">
              <span className="text-xl font-semibold text-ivory">
                <AnimatedNumber value={80} />
                <span className="text-sm">٪</span>
              </span>
              <span className="text-[0.62rem] text-mute">قطعات دوخت دستی</span>
            </div>
          </div>
        </Reveal>

        <div className="flex flex-col gap-8">
          <Reveal>
            <span className="inline-flex items-center gap-2.5 text-[0.68rem] tracking-[0.28em] text-gold/85">
              <span className="h-px w-7 bg-gold/45" />
              فلسفه آتلیه
            </span>
          </Reveal>

          <Reveal delay={0.06}>
            <h2 className="text-2xl font-semibold leading-relaxed tracking-tight text-ivory sm:text-3xl">
              ما لباس نمی‌فروشیم؛
              <span className="gold-text"> قطعه‌ای می‌سازیم که سال‌ها بماند.</span>
            </h2>
          </Reveal>

          <Reveal delay={0.12}>
            <p className="max-w-xl text-sm leading-8 text-smoke">
              در Next Level، سرعت تولید را فدای کیفیت نمی‌کنیم. هر قطعه از انتخاب پارچه تا آخرین بخیه،
              مسیر مشخصی را طی می‌کند و در پایان با نام خیاط و شماره سریال ثبت می‌شود. اگر جزئیاتی
              مطابق استاندارد آتلیه نباشد، همان قطعه کنار گذاشته می‌شود.
            </p>
          </Reveal>

          <div className="flex flex-col gap-5">
            {PILLARS.map((pillar, index) => (
              <Reveal key={pillar.title} delay={0.16 + index * 0.07}>
                <div className="group flex gap-4 rounded-xl border border-line bg-surface/60 p-4 shadow-soft transition-colors duration-500 hover:border-gold/25">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full border border-line bg-elevated text-gold transition-transform duration-500 group-hover:scale-105">
                    <pillar.icon className="size-4" />
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <h3 className="text-sm font-medium text-ivory">{pillar.title}</h3>
                    <p className="text-xs leading-6 text-mute">{pillar.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.4}>
            <Button asChild variant="outline" size="md">
              <Link href="/about">
                داستان کامل Next Level
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
