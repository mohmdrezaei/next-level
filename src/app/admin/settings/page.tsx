import { AdminPageHeader } from "@/features/admin/components/page-header";
import { SettingsForm } from "@/features/admin/components/settings-form";

export const metadata = { title: "تنظیمات" };

export default function AdminSettingsPage() {
  return (
    <div className="flex flex-col gap-9">
      <AdminPageHeader
        eyebrow="SETTINGS"
        title="تنظیمات فروشگاه"
        description="اطلاعات بوتیک، سیاست ارسال و مالیات، روش‌های پرداخت و پیش‌فرض‌های نمایش محصولات."
      />

      <SettingsForm />
    </div>
  );
}
