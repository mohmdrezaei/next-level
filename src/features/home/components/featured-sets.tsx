import { SectionHeading } from "@/components/shared/section-heading";
import { StaggerGroup, StaggerItem } from "@/components/shared/reveal";
import { SetCard } from "@/features/sets/components/set-card";
import type { ResolvedSet } from "@/features/sets/types";

export function FeaturedSets({ sets }: { sets: ResolvedSet[] }) {
  if (!sets.length) return null;

  return (
    <section className="container-page py-20 lg:py-28">
      <SectionHeading
        eyebrow="CURATED SETS"
        title="ست‌های کامل، آمادهٔ پوشیدن"
        description="قطعاتی که رنگ، جنس و فرم‌شان با هم هماهنگ است — از کتانی و شلوار تا پیراهن و لایه رویی. خرید کل ست با تخفیف مجموعه‌ای همراه است."
        action={{ label: "همه ست‌ها", href: "/sets" }}
      />

      <StaggerGroup className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {sets.map((set) => (
          <StaggerItem key={set.slug}>
            <SetCard set={set} />
          </StaggerItem>
        ))}
      </StaggerGroup>
    </section>
  );
}
