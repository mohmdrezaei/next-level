"use client";

import Link from "next/link";
import { ArrowLeft, Layers, Sparkles } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { SplitText } from "@/components/shared/reveal";
import { SITE } from "@/lib/constants";

const STATS = [
  { value: "۲۴٪", label: "پشم و کشمیر ایتالیایی" },
  { value: "۴۸ ساعت", label: "بازرسی و بسته‌بندی هر سفارش" },
  { value: "۱۲ سال", label: "سابقه تخصصی در مد و پوشاک" },
];

export function Hero() {
  const reduce = useReducedMotion();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "16%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "22%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.75], [1, reduce ? 1 : 0]);

  return (
    <section
      ref={containerRef}
      className="relative isolate overflow-hidden border-b border-line"
    >
      {/* Ambient background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 right-[-10%] size-[42rem] animate-aurora rounded-full bg-[radial-gradient(circle,rgba(200,162,76,0.16),transparent_62%)] blur-3xl" />
        <div className="absolute bottom-[-25%] left-[-15%] size-[38rem] animate-aurora rounded-full bg-[radial-gradient(circle,rgba(169,113,59,0.16),transparent_60%)] blur-3xl [animation-delay:-6s]" />
        <div className="grain-layer absolute inset-0 opacity-[0.16]" />
      </div>

      <div className="container-page grid items-center gap-14 pt-16 pb-20 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pt-24 lg:pb-28">
        <motion.div style={{ y: contentY, opacity: contentOpacity } as any} className="flex flex-col gap-8">
          <motion.span
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex w-fit items-center gap-2.5 rounded-full border border-gold/25 bg-gold/[0.07] px-3.5 py-1.5 text-[0.68rem] text-gold-soft"
          >
            <Sparkles className="size-3.5" />
            ست‌های کامل پاییز و زمستان ۱۴۰۵
          </motion.span>

          <h1 className="text-[2.1rem] font-semibold leading-[1.25] tracking-tight text-ivory sm:text-5xl lg:text-[3.4rem]">
            <SplitText text="تن‌خور بی‌نقص،" delay={0.1} />
            <br className="hidden sm:block" />
            <span className="gold-text">
              <SplitText text="برای مردی که" delay={0.28} />
              <br className="hidden sm:block" />
              <SplitText text="جزئیات را می‌بیند." delay={0.42} />
            </span>
          </h1>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-lg text-sm leading-8 text-smoke sm:text-[0.95rem]"
          >
            {SITE.shortDescription} هر قطعه در تیراژ محدود تولید، پیش از ارسال بازرسی و در
            بسته‌بندی اختصاصی بوتیک تحویل داده می‌شود.
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.74, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-wrap items-center gap-3"
          >
            <Button asChild variant="gold" size="lg">
              <Link href="/shop">
                ورود به فروشگاه
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/sets">
                <Layers className="size-3.5" />
                دیدن ست‌های کامل
              </Link>
            </Button>
          </motion.div>

          <motion.dl
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.9 }}
            className="mt-2 grid max-w-lg grid-cols-3 gap-6 border-t border-line pt-7"
          >
            {STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1.5">
                <dt className="text-base font-semibold text-ivory sm:text-lg">{stat.value}</dt>
                <dd className="text-[0.66rem] leading-5 text-mute">{stat.label}</dd>
              </div>
            ))}
          </motion.dl>
        </motion.div>

        {/* Visual */}
        <div className="relative">
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="relative overflow-hidden rounded-2xl border border-ivory/10 shadow-lift">
              <motion.img
                src="/hero.jpg"
                alt="ست‌های کامل پاییز و زمستان Next Level"
                style={{ y: imageY }}
                className="media-natural aspect-4/5 w-full scale-110 object-cover"
              />
              <div className="overlay-scrim pointer-events-none absolute inset-0" />
            </div>

            {/* Floating price/quality card */}
            <motion.div
              initial={reduce ? false : { opacity: 0, x: -22 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="glass absolute -bottom-6 -left-4 flex w-56 flex-col gap-3 rounded-xl p-4 shadow-lift sm:-left-8"
            >
              <span className="text-[0.62rem] tracking-[0.18em] text-gold/85">قطعه شاخص</span>
              <span className="text-xs font-medium leading-6 text-ivory">
                پالتو کشمیر مونته
              </span>
              <div className="flex items-center justify-between">
                <span className="tnum text-[0.72rem] text-smoke">۱۸٬۹۰۰٬۰۰۰ تومان</span>
                <span className="rounded-full bg-success/12 px-2 py-0.5 text-[0.6rem] text-success">
                  موجود
                </span>
              </div>
            </motion.div>

            <motion.div
              initial={reduce ? false : { opacity: 0, y: -18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.85, ease: [0.22, 1, 0.36, 1] }}
              className="glass absolute -top-5 right-4 flex items-center gap-3 rounded-full px-4 py-2.5 shadow-lift sm:right-6"
            >
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ring rounded-full bg-success/70" />
                <span className="relative inline-flex size-2 rounded-full bg-success" />
              </span>
              <span className="text-[0.66rem] text-smoke">ارسال امروز برای سفارش‌های تا ساعت ۱۴</span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
