import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageSquare, Phone } from "lucide-react";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { ContactForm } from "@/features/contact/components/contact-form";
import { Card } from "@/components/ui/card";
import { SITE, SOCIAL_LINKS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "تماس با ما",
  description:
    "راه‌های تماس با بوتیک Next Level: تلفن، ایمیل، نشانی بوتیک و فرم پیام آنلاین برای پشتیبانی و مشاوره خرید.",
};

const CHANNELS = [
  {
    icon: Phone,
    title: "تلفن بوتیک",
    value: SITE.phone,
    hint: SITE.workingHours,
    href: `tel:${SITE.phoneRaw}`,
  },
  {
    icon: Mail,
    title: "ایمیل پشتیبانی",
    value: SITE.email,
    hint: "پاسخ حداکثر تا ۴ ساعت کاری",
    href: `mailto:${SITE.email}`,
    latin: true,
  },
  {
    icon: MapPin,
    title: "نشانی بوتیک",
    value: SITE.address,
    hint: "امکان پرو حضوری و اصلاح دوخت",
  },
  {
    icon: Clock,
    title: "ساعات کاری",
    value: SITE.workingHours,
    hint: "جمعه‌ها تعطیل — پاسخگویی آنلاین فعال",
  },
];

export default function ContactPage() {
  return (
    <div className="container-page py-10 lg:py-14">
      <Breadcrumbs items={[{ title: "تماس با ما" }]} className="mb-8" />

      <header className="mb-12 flex flex-col gap-4 border-b border-line pb-8">
        <span className="inline-flex items-center gap-2.5 text-[0.68rem] tracking-[0.28em] text-gold/85">
          <span className="h-px w-7 bg-gold/45" />
          CONTACT
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-ivory sm:text-3xl">
          تماس با بوتیک
        </h1>
        <p className="max-w-2xl text-xs leading-7 text-smoke sm:text-sm">
          برای مشاوره سایز، پیگیری سفارش، درخواست مرجوعی یا همکاری در فروش عمده، از راه‌های زیر با ما
          در ارتباط باشید.
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:gap-14">
        <div className="flex flex-col gap-5">
          {CHANNELS.map((channel, index) => (
            <Reveal key={channel.title} delay={index * 0.06}>
              <Card className="group flex gap-4 p-5 transition-colors duration-500 hover:border-gold/25">
                <span className="grid size-11 shrink-0 place-items-center rounded-full border border-line bg-elevated text-gold transition-transform duration-500 group-hover:scale-105">
                  <channel.icon className="size-[18px]" strokeWidth={1.7} />
                </span>
                <span className="flex flex-col gap-1.5">
                  <span className="text-[0.68rem] tracking-wide text-mute">{channel.title}</span>
                  {channel.href ? (
                    <a
                      href={channel.href}
                      dir={channel.latin ? "ltr" : undefined}
                      className="text-xs leading-6 text-ivory transition-colors duration-300 hover:text-gold-soft"
                    >
                      {channel.value}
                    </a>
                  ) : (
                    <span className="text-xs leading-6 text-ivory">{channel.value}</span>
                  )}
                  <span className="text-[0.64rem] leading-5 text-mute">{channel.hint}</span>
                </span>
              </Card>
            </Reveal>
          ))}

          <Reveal delay={0.3}>
            <Card className="flex flex-col gap-4 p-5">
              <span className="flex items-center gap-2.5 text-[0.68rem] tracking-[0.18em] text-mute">
                <MessageSquare className="size-3.5 text-gold" />
                شبکه‌های اجتماعی
              </span>
              <div className="flex flex-wrap gap-2.5">
                {SOCIAL_LINKS.map((social) => (
                  <a
                    key={social.title}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-line px-3.5 py-1.5 text-[0.68rem] text-smoke transition-colors duration-300 hover:border-gold/40 hover:text-gold-soft"
                  >
                    {social.title}
                  </a>
                ))}
              </div>
              <p className="text-[0.64rem] leading-6 text-mute">
                پیام‌های مستقیم اینستاگرام در ساعات کاری بررسی می‌شوند؛ برای پیگیری سفارش، ارسال کد
                سفارش باعث تسریع پاسخ می‌شود.
              </p>
            </Card>
          </Reveal>
        </div>

        <div className="flex flex-col gap-8">
          <ContactForm />

          <Reveal>
            <div className="relative overflow-hidden rounded-2xl border border-line">
              <img
                src="/art/editorial-tailor.svg"
                alt="بوتیک Next Level"
                loading="lazy"
                className="media-invertible h-64 w-full object-cover sm:h-80"
              />
              <span className="overlay-scrim absolute inset-0" />
              <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-6">
                <span className="text-[0.62rem] tracking-[0.2em] text-gold/85">BOUTIQUE</span>
                <span className="text-sm text-ivory">بوتیک ولیعصر — تهران</span>
                <span className="text-[0.66rem] text-smoke">
                  برای پرو حضوری، پیش از مراجعه وقت خود را رزرو کنید.
                </span>
              </div>
            </div>
          </Reveal>

          <SectionHeading
            eyebrow="همکاری"
            title="فروش عمده و همکاری برندها"
            description="اگر به‌عنوان فروشگاه، هتل یا شرکت به خرید عمده علاقه‌مند هستید، از طریق فرم بالا با موضوع «همکاری و فروش عمده» پیام بگذارید تا شرایط اختصاصی برای شما ارسال شود."
          />
        </div>
      </div>
    </div>
  );
}
