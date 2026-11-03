"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Menu, Plus, Search, Store } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InitialsAvatar } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { logoutAction } from "@/features/auth/actions";
import { AdminMobileNav } from "./admin-sidebar";
import { isNavActive } from "./admin-sidebar";
import { lowStockCount } from "../lib/metrics";
import { toPersianDigits } from "@/lib/format";
import type { SessionUser } from "@/features/auth/types";

const TITLES: { href: string; label: string; exact?: boolean }[] = [
  { href: "/admin", label: "داشبورد", exact: true },
  { href: "/admin/products", label: "محصولات" },
  { href: "/admin/sets", label: "ست‌های کامل" },
  { href: "/admin/orders", label: "سفارش‌ها" },
  { href: "/admin/customers", label: "مشتریان" },
  { href: "/admin/settings", label: "تنظیمات" },
];

export function AdminTopbar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const alerts = lowStockCount();

  const current =
    TITLES.find((item) => isNavActive(pathname, { ...item, icon: Menu }))?.label ?? "پنل مدیریت";

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-ink/85 backdrop-blur-xl">
        <div className="flex h-18 items-center gap-3 px-5 md:px-8 lg:px-10">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="باز کردن منوی پنل"
            className="grid size-10 place-items-center rounded-full border border-line text-smoke transition-colors duration-300 hover:border-ivory/25 hover:text-ivory lg:hidden"
          >
            <Menu className="size-4" />
          </button>

          <div className="flex flex-col leading-tight">
            <span className="text-[0.62rem] tracking-[0.22em] text-mute">پنل مدیریت Next Level</span>
            <span className="text-sm font-medium text-ivory">{current}</span>
          </div>

          <div className="mx-auto hidden w-full max-w-xs lg:block">
            <Input
              startIcon={<Search />}
              placeholder="جست‌وجوی محصول، سفارش یا مشتری…"
              className="h-10 text-xs"
              aria-label="جست‌وجو در پنل"
            />
          </div>

          <div className="ms-auto flex items-center gap-2">
            <Button asChild variant="gold" size="sm" className="hidden sm:inline-flex">
              <Link href="/admin/products/new">
                <Plus className="size-3.5" />
                محصول جدید
              </Link>
            </Button>

            <ThemeToggle />

            <Link
              href="/admin/orders"
              aria-label="هشدارهای موجودی"
              className="relative grid size-10 place-items-center rounded-full border border-line text-smoke transition-colors duration-300 hover:border-ivory/25 hover:text-ivory"
            >
              <Bell className="size-4" />
              {alerts > 0 ? (
                <span className="absolute -top-1 -end-1 grid min-w-5 place-items-center rounded-full bg-danger px-1 text-[0.6rem] font-semibold text-white">
                  {toPersianDigits(alerts)}
                </span>
              ) : null}
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full border border-line ps-1 pe-3 transition-colors duration-300 hover:border-ivory/25"
                  aria-label="حساب مدیر"
                >
                  <InitialsAvatar name={user.name} accent={user.accent} className="size-8" />
                  <span className="hidden flex-col text-start leading-tight sm:flex">
                    <span className="text-[0.68rem] text-ivory">{user.name}</span>
                    <span className="text-[0.6rem] text-mute">مدیر بوتیک</span>
                  </span>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>حساب مدیر</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Link href="/admin/settings">تنظیمات فروشگاه</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/">
                    <Store className="size-4" />
                    مشاهده فروشگاه
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem variant="danger" asChild>
                  <form action={logoutAction} className="w-full">
                    <button type="submit" className="w-full text-start">
                      خروج از حساب
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto border-t border-line/70 px-5 py-2.5 lg:hidden">
          {TITLES.map((item) => {
            const active = isNavActive(pathname, { ...item, icon: Menu });
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? "shrink-0 rounded-full border border-gold/45 bg-gold/12 px-3 py-1.5 text-[0.68rem] text-gold-soft"
                    : "shrink-0 rounded-full border border-line px-3 py-1.5 text-[0.68rem] text-mute"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </header>

      <AdminMobileNav open={mobileOpen} onOpenChange={setMobileOpen} />
    </>
  );
}
