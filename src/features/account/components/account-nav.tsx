"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, LayoutDashboard, MapPin, Package, Store, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AccountNavItem {
  title: string;
  href: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

/** Single source of truth for the customer panel navigation. */
export const ACCOUNT_NAV_ITEMS: AccountNavItem[] = [
  {
    title: "داشبورد",
    href: "/account",
    description: "نمای کلی حساب و امتیاز باشگاه",
    icon: LayoutDashboard,
  },
  {
    title: "سفارش‌های من",
    href: "/account/orders",
    description: "پیگیری، تاریخچه و فاکتور خریدها",
    icon: Package,
  },
  {
    title: "علاقه‌مندی‌ها",
    href: "/account/wishlist",
    description: "قطعاتی که ذخیره کرده‌اید",
    icon: Heart,
  },
  {
    title: "نشانی‌های من",
    href: "/account/addresses",
    description: "آدرس‌های تحویل سفارش",
    icon: MapPin,
  },
  {
    title: "اطلاعات حساب",
    href: "/account/profile",
    description: "پروفایل، راه تماس و رمز عبور",
    icon: UserRound,
  },
];

export function isAccountNavActive(pathname: string, href: string): boolean {
  if (href === "/account") return pathname === "/account";
  return pathname === href || pathname.startsWith(`${href}/`);
}

interface AccountNavLinksProps {
  variant?: "sidebar" | "chips";
  className?: string;
}

/**
 * Renders the panel links. `sidebar` is the desktop column, `chips` is the
 * horizontal scroll strip used on small screens.
 */
export function AccountNavLinks({ variant = "sidebar", className }: AccountNavLinksProps) {
  const pathname = usePathname();

  if (variant === "chips") {
    return (
      <nav aria-label="ناوبری پنل کاربری" className={cn("mask-fade-x -mx-1 overflow-x-auto px-1", className)}>
        <ul className="flex w-max items-center gap-2">
          {ACCOUNT_NAV_ITEMS.map((item) => {
            const active = isAccountNavActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-xs transition-colors duration-300",
                    active
                      ? "border-gold/45 bg-gold/12 text-gold-soft"
                      : "border-line bg-surface/50 text-smoke hover:border-ivory/25 hover:text-ivory",
                  )}
                >
                  <item.icon className="size-3.5" />
                  {item.title}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }

  return (
    <nav aria-label="ناوبری پنل کاربری" className={className}>
      <ul className="flex flex-col gap-1">
        {ACCOUNT_NAV_ITEMS.map((item) => {
          const active = isAccountNavActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-300",
                  active ? "bg-gold/[0.08]" : "hover:bg-ivory/[0.04]",
                )}
              >
                <span
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-md border transition-colors duration-300",
                    active
                      ? "border-gold/40 bg-gold/12 text-gold-soft"
                      : "border-line bg-elevated text-mute group-hover:text-ivory",
                  )}
                >
                  <item.icon className="size-4" />
                </span>

                <span className="flex min-w-0 flex-col gap-0.5">
                  <span
                    className={cn(
                      "truncate text-xs font-medium transition-colors duration-300",
                      active ? "text-ivory" : "text-smoke group-hover:text-ivory",
                    )}
                  >
                    {item.title}
                  </span>
                  <span className="truncate text-[0.63rem] text-mute">{item.description}</span>
                </span>

                {active ? <span className="ms-auto h-6 w-px shrink-0 bg-gold" /> : null}
              </Link>
            </li>
          );
        })}

        <li className="mt-1 border-t border-line pt-2">
          <Link
            href="/shop"
            className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-smoke transition-colors duration-300 hover:bg-ivory/[0.04] hover:text-ivory"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-md border border-line bg-elevated text-mute transition-colors duration-300 group-hover:text-gold-soft">
              <Store className="size-4" />
            </span>
            <span className="text-xs font-medium">بازگشت به فروشگاه</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
