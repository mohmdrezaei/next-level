"use client";

import Link from "next/link";
import { LayoutDashboard, LogOut, ShieldCheck, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InitialsAvatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/controls";
import { AccountNavLinks, type AccountNavItem } from "./account-nav";
import { logoutAction } from "@/features/auth/actions";
import { formatNumber, toPersianDigits } from "@/lib/format";
import type { SessionUser } from "@/features/auth/types";

const GOLD_THRESHOLD = 60_000_000;

export function AccountSidebar({
  user,
  totalSpent,
  ordersCount,
  items = [],
}: {
  user: SessionUser;
  totalSpent: number;
  ordersCount: number;
  items?: AccountNavItem[];
}) {
  const progress = Math.min(100, (totalSpent / GOLD_THRESHOLD) * 100);
  const remaining = Math.max(0, GOLD_THRESHOLD - totalSpent);

  return (
    <div className="flex flex-col gap-5">
      <Card className="overflow-hidden">
        <div className="relative flex flex-col gap-4 p-5">
          <span
            aria-hidden
            className="pointer-events-none absolute -top-14 -start-10 size-36 rounded-full bg-[radial-gradient(circle,rgba(200,162,76,0.18),transparent_70%)]"
          />

          <div className="relative flex items-center gap-3">
            <InitialsAvatar name={user.name} accent={user.accent} className="size-12" />
            <div className="flex min-w-0 flex-col gap-1">
              <span className="truncate text-sm font-medium text-ivory">{user.name}</span>
              <span className="truncate text-[0.65rem] text-mute" dir="ltr">
                {user.email}
              </span>
            </div>
          </div>

          <div className="relative flex flex-wrap items-center gap-2">
            <Badge tone="gold" className="gap-1.5">
              <Sparkles className="size-3" />
              باشگاه {user.role === "admin" ? "مدیران" : "Next Level"}
            </Badge>
            <Badge tone="outline">
              <span className="tnum">{toPersianDigits(ordersCount)}</span> سفارش
            </Badge>
            {user.role === "admin" ? (
              <Badge tone="success" className="gap-1.5">
                <ShieldCheck className="size-3" />
                دسترسی مدیریت
              </Badge>
            ) : null}
          </div>

          <div className="relative flex flex-col gap-2 border-t border-line pt-4">
            <div className="flex items-center justify-between text-[0.65rem]">
              <span className="text-mute">تا سطح طلایی</span>
              <span className="tnum text-gold-soft">
                {toPersianDigits(Math.round(progress))}٪
              </span>
            </div>
            <Progress value={progress} />
            <span className="tnum text-[0.62rem] text-mute">
              {remaining > 0
                ? `${formatNumber(remaining)} تومان دیگر تا تخفیف دائمی ۵٪`
                : "شما به سطح طلایی رسیده‌اید."}
            </span>
          </div>
        </div>
      </Card>

      <Card className="p-3">
        {user.role === "admin" ? (
          <div className="mb-3 border-b border-line pb-3">
            <Button asChild variant="gold" size="sm" className="w-full">
              <Link href="/admin" className="flex items-center justify-center gap-2">
                <LayoutDashboard className="size-4" />
                <span>ورود به پنل مدیریت</span>
              </Link>
            </Button>
          </div>
        ) : null}
        <AccountNavLinks />
      </Card>

      {items.length ? (
        <Card className="flex flex-col gap-3 p-5">
          <span className="text-[0.66rem] tracking-[0.18em] text-mute">پیشنهاد ویژه شما</span>
          {items.slice(0, 2).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg border border-line p-3 transition-colors duration-300 hover:border-gold/25"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-md border border-line bg-elevated text-gold">
                <item.icon className="size-4" />
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-xs text-ivory">{item.title}</span>
                <span className="truncate text-[0.62rem] text-mute">{item.description}</span>
              </span>
            </Link>
          ))}
        </Card>
      ) : null}

      <form action={logoutAction}>
        <Button type="submit" variant="subtle" size="md" className="w-full">
          <LogOut className="size-4" />
          خروج از حساب
        </Button>
      </form>
    </div>
  );
}
