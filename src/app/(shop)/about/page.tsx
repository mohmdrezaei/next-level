import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Award, Factory, Ruler, Scissors, Sparkles, Users } from "lucide-react";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/shared/reveal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AnimatedNumber } from "@/components/shared/animated-number";
import { SITE } from "@/lib/constants";
import { catalogueStats } from "@/features/products/lib/live-selectors";
import { toPersianDigits } from "@/lib/format";

export const metadata: Metadata = {
  title: "درباره ما",
  description:
    "داستان آتلیه پوشاک مردانه Next Level: انتخاب پارچه، الگو و برش، کنترل کیفیت، راهنمای سایز و شرایط بازگشت کالا.",
};

const VALUES = [
  {
    icon: Scissors,
    title: "دوخت در آتلیه",
    body: "الگوها روی مانکن واقعی تنظیم می‌شوند و هر مدل پیش از تولید نهایی، سه نسخه آزمایشی دارد.",
  },
  {
    icon: Factory,
    title: "تولید تیراژ محدود",
    body: "از هر مدل حداکثر ۸۰ قطعه تولید می‌شود تا کیفیت کنترل‌پذیر بماند و قطعات کمیاب بمانند.",
  },
  {
    icon: Award,
    title: "کنترل کیفیت سه‌مرحله‌ای",
    body: "بررسی پارچه، بازرسی دوخت و کنترل نهایی؛ هر قطعه با برگه شناسنامه ارسال می‌شود.",
  },
  {
    icon: Users,
    title: "خدمات پس از فروش",
    body: "اصلاح رایگان دوخت و بازگشت ۷ روزه؛ هدف ما همراهی بلندمدت با مشتری است.",
  },
];

const SIZING_ROWS = [
  { size: "S", chest: "۹۲ – ۹۶", waist: "۷۶ – ۸۰", shoulder: "۴۲", sleeve: "۶۲" },
  { size: "M", chest: "۹۶ – ۱۰۰", waist: "۸۰ – ۸۴", shoulder: "۴۴", sleeve: "۶۳" },
  { size: "L", chest: "۱۰۰ – ۱۰۶", waist: "۸۴ – ۹۰", shoulder: "۴۶", sleeve: "۶۴" },
  { size: "XL", chest: "۱۰۶ – ۱۱۲", waist: "۹۰ – ۹۶", shoulder: "۴۸", sleeve: "۶۵" },
  { size: "XXL", chest: "۱۱۲ – ۱۱۸", waist: "۹۶ – ۱۰۲", shoulder: "۵۰", sleeve: "۶۶" },
];

const FAQ = [
  {
    q: "چگونه سایز مناسب خود را انتخاب کنم؟",
    a: "دور سینه و دور کمر خود را با متر پارچه‌ای اندازه بگیرید و با جدول راهنمای سایز مقایسه کنید. اگر بین دو سایز هستید، برای فیت راحت سایز بزرگ‌تر و برای فیت جمع سایز کوچک‌تر را انتخاب کنید.",
  },
  {
    q: "هزینه و زمان ارسال چگونه محاسبه می‌شود؟",
    a: "ارسال استاندارد ۳ تا ۵ روز کاری است و برای سفارش‌های بالای ۵ میلیون تومان رایگان می‌شود. ارسال سریع ۲۴ ساعته فقط برای تهران و کرج فعال است.",
  },
  {
    q: "شرایط بازگشت کالا چیست؟",
    a: "تا ۷ روز پس از دریافت، در صورتی که کالا استفاده نشده و پلمب آن باز نشده باشد، بازگشت پذیرفته می‌شود. هزینه ارسال مرجوعی بر عهده آتلیه است.",
  },
  {
    q: "امکان اصلاح دوخت وجود دارد؟",
    a: "بله. برای قطعات آتلیه، اصلاحات جزئی مانند قد آستین، کمر شلوار و قد شلوار به‌صورت رایگان انجام می‌شود.",
  },
  {
    q: "پرداخت در محل امکان‌پذیر است؟",
    a: "برای شهرهای تهران و کرج بله؛ در سایر شهرها پرداخت آنلاین یا کیف پول Next Level استفاده می‌شود.",
  },
];

export default async function AboutPage() {
  const stats = await catalogueStats();

  return (
    <div>
      {/* Hero */}
      <section className="relative isolate overflow-hidden border-b border-line">
        <img
          src="/art/editorial-fabric.svg"
          alt=""
          aria-hidden
          className="media-invertible absolute inset-0 -z-10 size-full object-cover"
        />
        <span
          aria-hidden
          className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,rgba(11,11,13,0.97),rgba(11,11,13,0.7)_50%,rgba(11,11,13,0.55))]"
        />

        <div className="container-page py-16 lg:py-24">
          <Breadcrumbs items={[{ title: "درباره ما" }]} className="mb-8" />

          <Reveal className="flex max-w-3xl flex-col gap-5">
            <span className="inline-flex w-fit items-center gap-2.5 text-[0.66rem] tracking-[0.28em] text-gold/85">
              <span className="h-px w-7 bg-gold/45" />
              OUR STORY
            </span>
            <h1 className="text-2xl font-semibold leading-relaxed tracking-tight text-ivory sm:text-4xl">
              آتلیه‌ای که با پارچه شروع می‌شود، نه با ترند.
            </h1>
            <p className="text-xs leading-8 text-smoke sm:text-sm">{SITE.description}</p>
          </Reveal>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-line bg-carbon/40">
        <div className="container-page grid grid-cols-2 gap-8 py-12 lg:grid-cols-4">
          {[
            { value: stats.products, label: "قطعه فعال در فروشگاه", suffix: "" },
            { value: stats.categories, label: "دسته‌بندی تخصصی", suffix: "" },
            { value: 12, label: "سال تجربه دوخت", suffix: "" },
            { value: Math.round(stats.reviews / 100) * 100, label: "نظر ثبت‌شده مشتریان", suffix: "+" },
          ].map((stat, index) => (
            <Reveal key={stat.label} delay={index * 0.06} className="flex flex-col gap-2">
              <span className="tnum text-2xl font-semibold text-ivory sm:text-3xl">
                <AnimatedNumber value={stat.value} suffix={stat.suffix} />
              </span>
              <span className="text-[0.68rem] leading-6 text-mute">{stat.label}</span>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="container-page py-20 lg:py-28">
        <SectionHeading
          eyebrow="اصول ما"
          title="چهار تصمیمی که کیفیت را تعیین می‌کند"
          description="هرچه در آتلیه انجام می‌دهیم حول چهار اصل می‌چرخد؛ این اصول سرعت تولید را کاهش می‌دهند اما نتیجه را قابل اعتماد می‌کنند."
          className="mb-12"
        />

        <StaggerGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((value) => (
            <StaggerItem key={value.title}>
              <Card className="group flex h-full flex-col gap-4 p-6 transition-colors duration-500 hover:border-gold/25">
                <span className="grid size-11 place-items-center rounded-full border border-line bg-elevated text-gold transition-transform duration-500 group-hover:scale-105">
                  <value.icon className="size-[18px]" strokeWidth={1.7} />
                </span>
                <h3 className="text-sm font-medium text-ivory">{value.title}</h3>
                <p className="text-xs leading-7 text-mute">{value.body}</p>
              </Card>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </section>

      {/* Sizing */}
      <section id="sizing" className="border-y border-line bg-carbon/40">
        <div className="container-page py-20 lg:py-24">
          <SectionHeading
            eyebrow="راهنمای سایز"
            title="اندازه‌های دقیق، بر حسب سانتی‌متر"
            description="اندازه‌گیری‌ها روی قطعه خوابیده انجام شده است. اگر بین دو سایز هستید، برای فیت راحت سایز بزرگ‌تر را انتخاب کنید."
            className="mb-10"
          />

          <Reveal>
            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full min-w-[36rem] text-start">
                <thead className="border-b border-line bg-surface/60">
                  <tr>
                    <th className="px-4 py-3.5 text-start text-[0.68rem] font-medium text-mute">سایز</th>
                    <th className="px-4 py-3.5 text-start text-[0.68rem] font-medium text-mute">دور سینه</th>
                    <th className="px-4 py-3.5 text-start text-[0.68rem] font-medium text-mute">دور کمر</th>
                    <th className="px-4 py-3.5 text-start text-[0.68rem] font-medium text-mute">سرشانه</th>
                    <th className="px-4 py-3.5 text-start text-[0.68rem] font-medium text-mute">قد آستین</th>
                  </tr>
                </thead>
                <tbody>
                  {SIZING_ROWS.map((row) => (
                    <tr key={row.size} className="border-b border-line/70 last:border-b-0">
                      <td className="px-4 py-3.5 text-xs text-ivory">{row.size}</td>
                      <td className="tnum px-4 py-3.5 text-xs text-smoke">{row.chest}</td>
                      <td className="tnum px-4 py-3.5 text-xs text-smoke">{row.waist}</td>
                      <td className="tnum px-4 py-3.5 text-xs text-smoke">{row.shoulder}</td>
                      <td className="tnum px-4 py-3.5 text-xs text-smoke">{row.sleeve}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 flex items-center gap-2 text-[0.66rem] text-mute">
              <Ruler className="size-3.5 text-gold" />
              سایز کفش بر اساس استاندارد اروپا و سایز اکسسوری به‌صورت تک‌سایز ارائه می‌شود.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Shipping & returns */}
      <section id="shipping" className="container-page py-20 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-2">
          <Reveal className="flex flex-col gap-6">
            <SectionHeading eyebrow="ارسال" title="ارسال و تحویل سفارش" />
            <ul className="flex flex-col gap-4">
              {[
                { title: "ارسال استاندارد", body: "۳ تا ۵ روز کاری در سراسر ایران — ۱۴۹٬۰۰۰ تومان" },
                { title: "ارسال رایگان", body: "برای سفارش‌های بالای ۵ میلیون تومان" },
                { title: "ارسال سریع", body: "۲۴ ساعته برای تهران و کرج — ۳۴۹٬۰۰۰ تومان" },
                { title: "تحویل حضوری", body: "دریافت از بوتیک ولیعصر پس از آماده‌سازی" },
              ].map((item) => (
                <li key={item.title} className="flex gap-4 rounded-xl border border-line bg-surface/40 p-4">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold/70" />
                  <span className="flex flex-col gap-1">
                    <span className="text-xs text-ivory">{item.title}</span>
                    <span className="text-[0.68rem] leading-6 text-mute">{item.body}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal className="flex flex-col gap-6">
            <span id="returns" className="sr-only">
              شرایط بازگشت و مرجوعی
            </span>
            <SectionHeading eyebrow="بازگشت" title="شرایط بازگشت و مرجوعی" />
            <p className="text-xs leading-8 text-smoke">
              اگر قطعه‌ای مطابق انتظار شما نبود، تا ۷ روز پس از دریافت می‌توانید درخواست بازگشت ثبت
              کنید. کالا باید استفاده نشده، پلمب آن باز نشده و برچسب‌ها سالم باشد.
            </p>

            <ol className="flex flex-col gap-4">
              {[
                "ثبت درخواست بازگشت از پنل کاربری در بخش سفارش‌های من",
                "تأیید درخواست توسط کارشناس آتلیه در حداکثر ۲۴ ساعت",
                "هماهنگی پیک برای دریافت کالا (هزینه بر عهده آتلیه)",
                "بازرسی کالا و عودت مبلغ حداکثر تا ۷۲ ساعت پس از تأیید",
              ].map((step, index) => (
                <li key={step} className="flex items-start gap-4">
                  <span className="tnum grid size-8 shrink-0 place-items-center rounded-full border border-line bg-elevated text-[0.68rem] text-gold">
                    {toPersianDigits(index + 1)}
                  </span>
                  <span className="pt-1.5 text-xs leading-6 text-smoke">{step}</span>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-line bg-carbon/40">
        <div className="container-page py-20 lg:py-24">
          <SectionHeading
            eyebrow="سوالات متداول"
            title="پاسخ پرتکرارترین پرسش‌ها"
            align="center"
            className="mb-10"
          />

          <Reveal className="mx-auto max-w-3xl">
            <Accordion type="single" collapsible defaultValue="faq-0">
              {FAQ.map((item, index) => (
                <AccordionItem key={item.q} value={`faq-${index}`}>
                  <AccordionTrigger>{item.q}</AccordionTrigger>
                  <AccordionContent>{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>

          <Reveal delay={0.1} className="mt-12 flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="gold" size="lg">
              <Link href="/shop">
                <Sparkles className="size-4" />
                شروع خرید از آتلیه
              </Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link href="/contact">
                پرسش دیگری دارم
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
