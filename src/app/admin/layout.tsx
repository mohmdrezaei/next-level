import type { Metadata } from "next";
import { AdminSidebar } from "@/features/admin/components/admin-sidebar";
import { AdminTopbar } from "@/features/admin/components/admin-topbar";
import { requireAdmin } from "@/features/auth/server/session";

export const metadata: Metadata = {
  title: { default: "پنل مدیریت", template: "%s | پنل مدیریت Next Level" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();

  return (
    <div className="min-h-dvh bg-ink">
      <AdminSidebar />

      <div className="flex min-h-dvh flex-col lg:ms-72">
        <AdminTopbar user={user} />
        <main className="flex-1 px-5 py-8 md:px-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
