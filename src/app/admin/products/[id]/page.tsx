import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/features/admin/components/page-header";
import { ProductForm } from "@/features/admin/components/product-form";
import { fetchAdminProduct } from "@/features/admin/actions";
import { CATEGORY_MAP } from "@/features/products/data/catalog";
import { productStock } from "@/features/products/lib/query";
import { formatDate, toPersianDigits } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  const product = await fetchAdminProduct(id);
  return { title: product ? `ویرایش ${product.name}` : "محصول یافت نشد" };
}

export default async function AdminEditProductPage({
  params,
}: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  const product = await fetchAdminProduct(id);
  if (!product) notFound();

  return (
    <div className="flex flex-col gap-9">
      <AdminPageHeader
        eyebrow="EDIT PRODUCT"
        title={product.name}
        description={
          <span className="flex flex-wrap items-center gap-3">
            <span className="tnum text-[0.68rem] text-mute">
              شناسه: {toPersianDigits(product.id)}
            </span>
            <Badge tone="outline">{CATEGORY_MAP[product.category]?.title}</Badge>
            <span className="tnum text-[0.68rem] text-mute">
              موجودی کل: {toPersianDigits(productStock(product))} عدد
            </span>
            <span className="text-[0.68rem] text-mute">
              ثبت‌شده در {formatDate(product.createdAt)}
            </span>
          </span>
        }
      >
        <Button asChild variant="subtle" size="sm">
          <Link href={`/shop/${product.slug}`} target="_blank">
            <ExternalLink className="size-3.5" />
            مشاهده در فروشگاه
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/products">
            <ArrowRight className="size-3.5" />
            بازگشت
          </Link>
        </Button>
      </AdminPageHeader>

      <ProductForm product={product} />
    </div>
  );
}
