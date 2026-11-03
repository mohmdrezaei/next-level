import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import { StaggerGroup, StaggerItem } from "@/components/shared/reveal";
import { CATEGORIES } from "@/features/products/data/catalog";
import { toPersianDigits } from "@/lib/format";

export function CategoryGrid({ counts }: { counts: Record<string, number> }) {
  return (
    <section className="container-page py-20 lg:py-28">
      <SectionHeading
        eyebrow="دسته‌بندی‌ها"
        title="از کجا شروع کنیم؟"
        description="اگر به‌دنبال قطعه‌ای مشخص هستید، از دسته‌بندی شروع کنید. هر دسته شامل قطعاتی است که در یک رده پارچه و کاربرد مشترک‌اند."
        className="mb-12"
      />

      <StaggerGroup className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {CATEGORIES.map((category, index) => (
          <StaggerItem
            key={category.slug}
            className={index === 0 ? "lg:col-span-2 lg:row-span-2" : ""}
          >
            <Link
              href={`/shop?category=${category.slug}`}
              className="group relative flex h-full min-h-40 flex-col justify-between overflow-hidden rounded-xl border border-line p-5 transition-colors duration-500 hover:border-ivory/20 lg:min-h-44"
            >
              <img
                src={`/art/category-${category.slug}.svg`}
                alt=""
                aria-hidden
                loading="lazy"
                className="media-invertible absolute inset-0 size-full object-cover opacity-80 transition-all duration-[1100ms] ease-[var(--ease-silk)] group-hover:scale-105 group-hover:opacity-100"
              />
              <span className="overlay-scrim absolute inset-0" />

              <div className="relative flex items-start justify-between gap-3">
                <span className="text-[0.6rem] tracking-[0.2em] text-mute">
                  {category.latinTitle}
                </span>
                <span className="tnum rounded-full border border-ivory/12 bg-ink/45 px-2 py-0.5 text-[0.6rem] text-smoke backdrop-blur-md">
                  {toPersianDigits(counts[category.slug] ?? 0)}
                </span>
              </div>

              <div className="relative flex flex-col gap-2">
                <h3 className="text-sm font-medium text-ivory sm:text-base">{category.title}</h3>
                <p className="line-clamp-2 hidden text-[0.68rem] leading-5 text-mute sm:block">
                  {category.description}
                </p>
                <span className="inline-flex items-center gap-1.5 text-[0.68rem] text-gold opacity-0 transition-all duration-300 group-hover:opacity-100">
                  مشاهده
                  <ArrowLeft className="size-3.5" />
                </span>
              </div>
            </Link>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </section>
  );
}
