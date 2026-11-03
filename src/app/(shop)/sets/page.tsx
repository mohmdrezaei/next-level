import type { Metadata } from "next";
import { Layers } from "lucide-react";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { SetCard } from "@/features/sets/components/set-card";
import { getResolvedSets } from "@/features/sets/lib/live-sets";
import { toPersianDigits } from "@/lib/format";

export const metadata: Metadata = {
  title: "ست‌های کامل",
  description:
    "ست‌های آماده آتلیه Next Level: ترکیب هماهنگ کتانی، شلوار، پیراهن و لایه رویی با تخفیف مجموعه‌ای.",
};

export default async function SetsPage() {
  const sets = await getResolvedSets();
  const featured = sets.filter((set) => set.featured);
  const rest = sets.filter((set) => !set.featured);

  return (
    <div className="pb-20">
      {/* Hero */}
      <section className="relative isolate overflow-hidden border-b border-line">
        <span
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_75%_-20%,rgba(200,162,76,0.16),transparent_60%)]"
        />
        <span aria-hidden className="grain-layer absolute inset-0 -z-10 opacity-[0.12]" />

        <div className="container-page py-14 lg:py-20">
          <Breadcrumbs items={[{ title: "ست‌ها" }]} className="mb-8" />

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <Reveal className="flex max-w-2xl flex-col gap-4">
              <span className="inline-flex items-center gap-2.5 text-[0.66rem] tracking-[0.28em] text-gold/85">
                <span className="h-px w-7 bg-gold/45" />
                CURATED SETS
              </span>
              <h1 className="text-2xl font-semibold tracking-tight text-ivory sm:text-3xl lg:text-4xl">
                ست‌های کامل Next Level
              </h1>
              <p className="text-xs leading-7 text-smoke sm:text-sm sm:leading-8">
                هر ست سه یا چهار قطعه از آتلیه است که رنگ، جنس و فرم‌شان با هم هماهنگ شده‌اند.
                می‌توانید کل ست را یک‌جا با تخفیف مجموعه‌ای بخرید یا قطعات را جداگانه انتخاب کنید.
              </p>
            </Reveal>

            <Reveal delay={0.1} className="flex items-center gap-6">
              <span className="flex items-center gap-2.5 text-xs text-smoke">
                <Layers className="size-4 text-gold" />
                {toPersianDigits(sets.length)} ست آماده
              </span>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="container-page pt-14 lg:pt-20">
        <SectionHeading
          eyebrow="FEATURED"
          title="ست‌های منتخب این فصل"
          description="پرطرفدارترین ترکیب‌های آتلیه در فصل جاری."
        />

        <StaggerGroup className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {featured.map((set) => (
            <StaggerItem key={set.slug}>
              <SetCard set={set} />
            </StaggerItem>
          ))}
        </StaggerGroup>
      </section>

      {/* Everything else */}
      <section className="container-page pt-20">
        <SectionHeading
          eyebrow="ALL SETS"
          title="همه ست‌ها"
          description="بر پایه موقعیت و فصل مرتب شده‌اند."
        />

        <StaggerGroup className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((set) => (
            <StaggerItem key={set.slug}>
              <SetCard set={set} size="lg" />
            </StaggerItem>
          ))}
        </StaggerGroup>
      </section>
    </div>
  );
}
