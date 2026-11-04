import Link from "next/link";
import { ArrowLeft, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/shared/reveal";
import { SITE } from "@/lib/constants";

export function CtaBand() {
  return (
    <section className="container-page py-20 lg:py-28">
      <Reveal>
        <div className="relative isolate overflow-hidden rounded-2xl border border-gold/20 px-6 py-14 text-center sm:px-12">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[linear-gradient(120deg,rgba(169,113,59,0.18),rgba(11,11,13,0.4)_42%,rgba(200,162,76,0.16))]"
          />
          <div aria-hidden className="grain-layer absolute inset-0 -z-10 opacity-[0.18]" />

          <span className="inline-flex items-center gap-2.5 rounded-full border border-gold/25 bg-ink/40 px-3.5 py-1.5 text-[0.65rem] tracking-[0.16em] text-gold-soft backdrop-blur-md">
            <Store className="size-3.5" />
            بوتیک حضوری ولیعصر
          </span>

          <h2 className="mx-auto mt-6 max-w-2xl text-2xl font-semibold leading-relaxed tracking-tight text-ivory sm:text-3xl">
            خرید حضوری و آنلاین با ضمانت بازگشت
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-xs leading-7 text-smoke sm:text-sm">
            می‌توانید برای مشاهده و خرید کالاها به بوتیک مراجعه کنید یا به‌صورت آنلاین با اطمینان سفارش دهید.
            تمامی سفارش‌ها با ضمانت اصالت، تعویض سریع سایز و بازگشت ۷ روزه ارسال می‌شوند.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="gold" size="lg">
              <Link href="/contact">
                اطلاعات تماس و آدرس بوتیک
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <a href={`tel:${SITE.phoneRaw}`}>
                تماس با بوتیک
                <span className="tnum text-xs text-mute">{SITE.phone}</span>
              </a>
            </Button>
          </div>

          <p className="mt-6 text-[0.66rem] text-mute">{SITE.address}</p>
        </div>
      </Reveal>
    </section>
  );
}
