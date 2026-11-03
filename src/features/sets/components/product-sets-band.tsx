import Link from "next/link";
import { ArrowLeft, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SetCollage } from "./set-collage";
import { getSetsContainingProduct } from "../lib/live-sets";
import { setPricing, setRoles } from "../lib/set-pricing";
import { formatNumber, toPersianDigits } from "@/lib/format";

/** Cross-sell band: the looks this product is part of. */
export async function ProductSetsBand({ productId }: { productId: string }) {
  const sets = await getSetsContainingProduct(productId, 2);
  if (sets.length === 0) return null;

  return (
    <section className="mt-16 rounded-2xl border border-line bg-surface/50 p-6 sm:p-7">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="inline-flex items-center gap-2.5 text-[0.62rem] tracking-[0.26em] text-gold/85">
            <span className="h-px w-6 bg-gold/45" />
            COMPLETE THE LOOK
          </span>
          <h2 className="text-sm font-semibold tracking-tight text-ivory">
            این قطعه در ست‌های زیر به کار رفته است
          </h2>
        </div>

        <Button asChild variant="ghost" size="sm">
          <Link href="/sets">
            همه ست‌ها
            <ArrowLeft className="size-3.5" />
          </Link>
        </Button>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {sets.map((set) => {
          const pricing = setPricing(set);
          const percent = Math.round(set.discountRate * 100);

          return (
            <Link
              key={set.slug}
              href={`/sets/${set.slug}`}
              className="group flex gap-4 rounded-xl border border-line p-3 transition-colors duration-300 hover:border-gold/30"
            >
              <span className="w-24 shrink-0 overflow-hidden rounded-lg border border-line">
                <SetCollage items={set.items} title={set.title} interactive={false} />
              </span>

              <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="flex items-center gap-2">
                  <Layers className="size-3 text-mute" />
                  <span className="truncate text-xs font-medium text-ivory transition-colors duration-300 group-hover:text-gold-soft">
                    {set.title}
                  </span>
                </span>

                <span className="truncate text-[0.62rem] text-mute">{setRoles(set)}</span>

                <span className="mt-auto flex flex-wrap items-center gap-2">
                  <span className="tnum text-[0.7rem] font-medium text-gold-soft">
                    {formatNumber(pricing.total)}
                    <span className="ms-1 text-[0.58rem] font-normal text-mute">تومان</span>
                  </span>
                  <Badge tone="success" size="sm" className="tnum">
                    {toPersianDigits(percent)}٪
                  </Badge>
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
