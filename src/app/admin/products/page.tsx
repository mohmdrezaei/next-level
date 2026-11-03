import Link from "next/link";
import { PackagePlus, Sparkles, TriangleAlert, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/features/admin/components/page-header";
import { ProductsTable } from "@/features/admin/components/products-table";
import { fetchAdminProducts } from "@/features/admin/actions";
import { productStock } from "@/features/products/lib/query";
import { formatCompactPrice, formatNumber, toPersianDigits } from "@/lib/format";

export const metadata = { title: "محصولات" };

export default async function AdminProductsPage() {
  const products = await fetchAdminProducts();

  const inventoryValue = products.reduce((sum, product) => sum + product.price * productStock(product), 0);
  const outOfStock = products.filter((product) => productStock(product) === 0).length;
  const discounted = products.filter(
    (product) => product.compareAtPrice && product.compareAtPrice > product.price,
  ).length;

  const stats = [
    {
      label: "تعداد محصولات",
      value: formatNumber(products.length),
      hint: "قطعه فعال در فروشگاه",
      icon: Sparkles,
    },
    {
      label: "ارزش موجودی",
      value: `${formatCompactPrice(inventoryValue)} تومان`,
      hint: "بر پایه قیمت فروش",
      icon: Wallet,
    },
    {
      label: "ناموجود",
      value: toPersianDigits(outOfStock),
      hint: "نیازمند شارژ موجودی",
      icon: TriangleAlert,
    },
    {
      label: "دارای تخفیف",
      value: toPersianDigits(discounted),
      hint: "قیمت پیش از تخفیف ثبت شده",
      icon: PackagePlus,
    },
  ];

  return (
    <div className="flex flex-col gap-9">
      <AdminPageHeader
        eyebrow="CATALOGUE"
        title="مدیریت محصولات"
        description="جست‌وجو، فیلتر، ویرایش و مدیریت موجودی قطعات آتلیه. تغییرات بلافاصله در فروشگاه اعمال می‌شود."
      >
        <Button asChild variant="gold" size="sm">
          <Link href="/admin/products/new">
            <PackagePlus className="size-3.5" />
            محصول جدید
          </Link>
        </Button>
      </AdminPageHeader>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="flex items-start gap-4 p-5">
            <span className="grid size-11 shrink-0 place-items-center rounded-full border border-line bg-elevated text-gold">
              <stat.icon className="size-[18px]" strokeWidth={1.7} />
            </span>
            <span className="flex flex-col gap-1">
              <span className="text-[0.68rem] tracking-wide text-mute">{stat.label}</span>
              <span className="tnum text-base font-semibold text-ivory">{stat.value}</span>
              <span className="text-[0.62rem] text-mute">{stat.hint}</span>
            </span>
          </Card>
        ))}
      </section>

      <ProductsTable products={products} />
    </div>
  );
}
