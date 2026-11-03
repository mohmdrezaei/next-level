import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/features/admin/components/page-header";
import { ProductForm } from "@/features/admin/components/product-form";

export const metadata = { title: "محصول جدید" };

export default function AdminNewProductPage() {
  return (
    <div className="flex flex-col gap-9">
      <AdminPageHeader
        eyebrow="NEW PRODUCT"
        title="افزودن محصول جدید"
        description="اطلاعات قطعه را کامل کنید. پس از ذخیره، محصول بلافاصله در فهرست فروشگاه نمایش داده می‌شود."
      >
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/products">
            <ArrowRight className="size-3.5" />
            بازگشت به فهرست
          </Link>
        </Button>
      </AdminPageHeader>

      <ProductForm product={null} />
    </div>
  );
}
