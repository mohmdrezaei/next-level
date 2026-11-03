import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { SetCard } from "@/features/sets/components/set-card";
import { SetCollage } from "@/features/sets/components/set-collage";
import { SetPurchasePanel } from "@/features/sets/components/set-purchase-panel";
import { getResolvedSet, getResolvedSets } from "@/features/sets/lib/live-sets";
import { setPricing } from "@/features/sets/lib/set-pricing";
import { formatNumber, toPersianDigits } from "@/lib/format";

// The catalogue is editable at runtime, so set pages render on demand.
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: PageProps<"/sets/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const set = await getResolvedSet(slug);

  if (!set) return { title: "ست یافت نشد" };

  return {
    title: set.title,
    description: set.description,
  };
}

export default async function SetPage({ params }: PageProps<"/sets/[slug]">) {
  const { slug } = await params;
  const set = await getResolvedSet(slug);

  if (!set) notFound();

  const pricing = setPricing(set);
  const percent = Math.round(set.discountRate * 100);

  const related = (await getResolvedSets())
    .filter((item) => item.slug !== set.slug)
    .sort((a, b) => {
      const overlap = (candidate: typeof a) =>
        candidate.items.filter((entry) =>
          set.items.some((mine) => mine.product.id === entry.product.id),
        ).length;
      return overlap(b) - overlap(a);
    })
    .slice(0, 3);

  return (
    <div className="pb-20">
      <div className="container-page py-8">
        <Breadcrumbs
          items={[{ title: "ست‌ها", href: "/sets" }, { title: set.title }]}
        />
      </div>

      {/* Hero */}
      <section className="container-page pb-14">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="gold" size="sm">
                <Tag className="size-3" />
                {set.occasion}
              </Badge>
              <Badge tone="neutral" size="sm">
                <CalendarDays className="size-3" />
                {set.season}
              </Badge>
              <Badge tone="ivory" size="sm" className="tnum">
                {toPersianDigits(percent)}٪ تخفیف مجموعه‌ای
              </Badge>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-[0.62rem] tracking-[0.26em] text-mute uppercase">
                {set.latinTitle}
              </span>
              <h1 className="text-2xl font-semibold tracking-tight text-ivory sm:text-3xl lg:text-4xl">
                {set.title}
              </h1>
              <p className="text-sm leading-8 text-smoke">{set.subtitle}</p>
            </div>

            <p className="text-xs leading-8 text-mute">{set.description}</p>

            <div className="flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-line pt-6">
              <span className="flex flex-col gap-1">
                <span className="text-[0.62rem] tracking-wide text-mute">مبلغ ست</span>
                <span className="tnum text-lg font-semibold text-gold-soft">
                  {formatNumber(pricing.total)}
                  <span className="ms-1 text-[0.62rem] font-normal text-mute">تومان</span>
                </span>
              </span>

              <span className="flex flex-col gap-1">
                <span className="text-[0.62rem] tracking-wide text-mute">جمع قطعات</span>
                <span className="tnum text-sm text-mute line-through">
                  {formatNumber(pricing.subtotal)}
                </span>
              </span>

              <span className="flex flex-col gap-1">
                <span className="text-[0.62rem] tracking-wide text-mute">سود شما</span>
                <span className="tnum text-sm text-success">
                  {formatNumber(pricing.discount)} تومان
                </span>
              </span>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline" size="md">
                <Link href="/sets">
                  <ArrowLeft className="size-4" />
                  بقیه ست‌ها
                </Link>
              </Button>
              <Button asChild variant="ghost" size="md">
                <Link href="/shop">دیدن همه قطعات</Link>
              </Button>
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="overflow-hidden rounded-2xl border border-line">
              <SetCollage items={set.items} title={set.title} interactive={false} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Pieces + bundle */}
      <section className="container-page border-t border-line pt-14">
        <SectionHeading
          eyebrow="THE PIECES"
          title="قطعات این ست"
          description="سایز هر قطعه را انتخاب کنید؛ سپس کل ست را یک‌جا به سبد اضافه کنید."
        />

        <div className="mt-10">
          <SetPurchasePanel set={set} />
        </div>
      </section>

      {/* Related */}
      {related.length > 0 ? (
        <section className="container-page border-t border-line pt-16">
          <SectionHeading
            eyebrow="MORE LOOKS"
            title="ست‌های مرتبط"
            description="ترکیب‌هایی که قطعه‌های مشترکی با این ست دارند."
            action={{ label: "همه ست‌ها", href: "/sets" }}
          />

          <StaggerGroup className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <StaggerItem key={item.slug}>
                <SetCard set={item} size="lg" />
              </StaggerItem>
            ))}
          </StaggerGroup>
        </section>
      ) : null}
    </div>
  );
}
