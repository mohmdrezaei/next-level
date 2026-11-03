import { AdminPageHeader } from "@/features/admin/components/page-header";
import { SetForm } from "@/features/admin/components/set-form";
import { fetchAdminProducts } from "@/features/admin/actions";

export const metadata = { title: "ست جدید" };

export default async function NewSetPage() {
  const products = await fetchAdminProducts();

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        eyebrow="NEW SET"
        title="ساخت ست جدید"
        description="قطعات هماهنگ را انتخاب کنید، نقش هر قطعه را بنویسید و درصد تخفیف مجموعه‌ای را تعیین کنید."
      />

      <SetForm set={null} products={products} />
    </div>
  );
}
