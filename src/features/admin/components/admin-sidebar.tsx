"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  Layers,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingBag,
  Store,
  Users,
} from "lucide-react";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Logo } from "@/components/shared/logo";
import { logoutAction } from "@/features/auth/actions";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
}

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "پیشخوان",
    items: [{ href: "/admin", label: "داشبورد", icon: LayoutDashboard, exact: true }],
  },
  {
    label: "فروشگاه",
    items: [
      { href: "/admin/products", label: "محصولات", icon: Package },
      { href: "/admin/sets", label: "ست‌های کامل", icon: Layers },
      { href: "/admin/orders", label: "سفارش‌ها", icon: ShoppingBag },
      { href: "/admin/customers", label: "مشتریان", icon: Users },
    ],
  },
  {
    label: "سیستم",
    items: [{ href: "/admin/settings", label: "تنظیمات", icon: Settings }],
  },
];

export function isNavActive(pathname: string, item: NavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-7">
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="flex flex-col gap-2">
          <span className="px-3 text-[0.6rem] tracking-[0.22em] text-mute">{group.label}</span>

          <ul className="flex flex-col gap-1">
            {group.items.map((item) => {
              const active = isNavActive(pathname, item);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg border px-3 py-2.5 text-xs transition-colors duration-300",
                      active
                        ? "border-gold/20 bg-gold/12 text-gold-soft"
                        : "border-transparent text-smoke hover:border-line hover:bg-ivory/[0.04] hover:text-ivory",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4 shrink-0 transition-colors duration-300",
                        active ? "text-gold" : "text-mute group-hover:text-ivory",
                      )}
                      strokeWidth={1.7}
                    />
                    <span className="font-medium">{item.label}</span>
                    {active ? (
                      <span className="absolute inset-y-2 -end-px w-0.5 rounded-full bg-gold" />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AdminSidebar() {
  return (
    <aside className="fixed inset-y-0 start-0 z-40 hidden w-72 flex-col border-e border-line bg-carbon/85 backdrop-blur-xl lg:flex">
      <div className="flex h-18 shrink-0 items-center gap-3 border-b border-line px-6">
        <Logo compact href="/" />
        <span className="ms-auto rounded-full border border-gold/25 bg-gold/10 px-2.5 py-1 text-[0.6rem] text-gold-soft">
          پنل مدیریت
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <AdminNav />
      </div>

      <div className="flex shrink-0 flex-col gap-1 border-t border-line px-4 py-4">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs text-mute transition-colors duration-300 hover:bg-ivory/[0.04] hover:text-ivory"
        >
          <Store className="size-4" strokeWidth={1.7} />
          مشاهده فروشگاه
          <ArrowUpRight className="ms-auto size-3.5" />
        </Link>

        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs text-mute transition-colors duration-300 hover:bg-danger/10 hover:text-danger"
          >
            <LogOut className="size-4" strokeWidth={1.7} />
            خروج از حساب
          </button>
        </form>
      </div>
    </aside>
  );
}

export function AdminMobileNav({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" width="sm" hideTitle aria-label="منوی پنل مدیریت">
        <SheetHeader>
          <Logo compact href="/" />
          <SheetTitle className="sr-only">منوی پنل مدیریت</SheetTitle>
        </SheetHeader>

        <SheetBody>
          <AdminNav onNavigate={() => onOpenChange(false)} />
        </SheetBody>

        <div className="shrink-0 border-t border-line px-5 py-4">
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg border border-line px-3 py-3 text-xs text-smoke transition-colors duration-300 hover:border-danger/40 hover:text-danger"
            >
              <LogOut className="size-4" strokeWidth={1.7} />
              خروج از حساب
            </button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
