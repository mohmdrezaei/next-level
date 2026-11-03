import Link from "next/link";
import { ExternalLink, Layers, Percent, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AdminPageHeader } from "@/features/admin/components/page-header";
import { SetsTable } from "@/features/admin/components/sets-table";
import { fetchAdminProducts, fetchAdminSets } from "@/features/admin/actions";
import { formatCompactPrice, formatNumber, toPersianDigits } from "@/lib/format";
import { resolveSet, setPricing } from "@/features/sets/lib/set-helpers";

export const metadata = { title: "ست‌های کامل" };

export default async function AdminSetsPage() {
  const [sets, products] = await Promise.all([fetchAdminSets(), fetchAdminProducts()]);

  const rows = sets.map((set) => ({
    set,
    pricing: setPricing(resolveSet(set, products)),
  }));

  const totalSavings = rows.reduce((sum, row) => sum + row.pricing.discount, 0);
  const avgDiscount =
    rows.length > 0 ? rows.reduce((sum, row) => sum + row.set.discountRate, 0) / rows.length : 0;
  const biggest = [...rows].sort((a, b) => b.pricing.discount - a.pricing.discount)[0];

  const stats = [
    { label: "تعداد ست‌ها", value: toPersianDigits(rows.length), hint: "ست‌های فعال", icon: Layers },
    {
      label: "میانگین تخفیف",
      value: `${toPersianDigits(Math.round(avgDiscount * 100))}٪`,
      hint: "تخفیف مجموعه‌ای",
      icon: Percent,
    },
    {
      label: "بیشترین سود مشتری",
      value: `${formatCompactPrice(biggest?.pricing.discount ?? 0)} تومان`,
      hint: biggest?.set.title ?? "—",
      icon: TrendingDown,
    },
  ];

  return (
    <div className="flex flex-col gap-9">
      <AdminPageHeader
        eyebrow="SETS"
        title="ست‌های کامل"
        description="ست بسازید، ویرایش کنید یا حذف کنید. هر ست دو قطعه یا بیشتر دارد و با تخفیف مجموعه‌ای عرضه می‌شود."
      >
        <Button asChild variant="outline" size="sm">
          <Link href="/sets" target="_blank">
            <ExternalLink className="size-3.5" />
            مشاهده در سایت
          </Link>
        </Button>
      </AdminPageHeader>

      <div className="grid gap-5 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-start justify-between gap-4 p-5">
              <div className="flex flex-col gap-1.5">
                <span className="text-[0.68rem] text-mute">{stat.label}</span>
                <span className="tnum text-lg font-semibold text-ivory">{stat.value}</span>
                <span className="text-[0.62rem] text-mute">{stat.hint}</span>
              </div>
              <span className="grid size-9 place-items-center rounded-lg border border-gold/20 bg-gold/[0.08] text-gold">
                <stat.icon className="size-4" />
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="tnum -mt-4 text-[0.68rem] text-mute">
        مجموع سود مشتری در همه ست‌ها: {formatNumber(totalSavings)} تومان
      </p>

      <SetsTable sets={sets} products={products} />
    </div>
  );
}
