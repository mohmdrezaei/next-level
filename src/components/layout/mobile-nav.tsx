"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Heart, LayoutDashboard, LogIn, Phone, UserRound } from "lucide-react";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { logoutAction } from "@/features/auth/actions";
import { cn } from "@/lib/utils";
import { PRIMARY_NAV, SITE, SOCIAL_LINKS } from "@/lib/constants";
import type { Category } from "@/features/products/types";
import type { ResolvedSet } from "@/features/sets/types";
import type { SessionUser } from "@/features/auth/types";

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: SessionUser | null;
  categories: Category[];
  sets: ResolvedSet[];
}

export function MobileNav({ open, onOpenChange, user, categories, sets }: MobileNavProps) {
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" width="sm" hideTitle aria-label="منوی موبایل">
        <SheetHeader>
          <Logo compact href={null} />
          <SheetTitle className="sr-only">منوی سایت</SheetTitle>
        </SheetHeader>

        <SheetBody className="flex flex-col gap-6">
          <nav className="flex flex-col">
            {PRIMARY_NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between border-b border-line py-4 text-sm transition-colors duration-300",
                    active ? "text-gold-soft" : "text-ivory hover:text-gold-soft",
                  )}
                >
                  <span className="flex flex-col gap-1">
                    {item.title}
                    {item.description ? (
                      <span className="text-[0.68rem] text-mute">{item.description}</span>
                    ) : null}
                  </span>
                  <ArrowLeft className="size-4 text-mute" />
                </Link>
              );
            })}
          </nav>

          <Accordion type="single" collapsible className="border-t border-line">
            <AccordionItem value="categories">
              <AccordionTrigger>دسته‌بندی‌ها</AccordionTrigger>
              <AccordionContent className="pe-0">
                <div className="flex flex-col gap-1">
                  {categories.map((category) => (
                    <Link
                      key={category.slug}
                      href={`/shop?category=${category.slug}`}
                      className="rounded-md px-2 py-2.5 text-xs text-smoke transition-colors duration-300 hover:bg-ivory/[0.05] hover:text-ivory"
                    >
                      {category.title}
                    </Link>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="sets">
              <AccordionTrigger>ست‌های کامل</AccordionTrigger>
              <AccordionContent className="pe-0">
                <div className="flex flex-col gap-1">
                  {sets.map((set) => (
                    <Link
                      key={set.slug}
                      href={`/sets/${set.slug}`}
                      className="flex items-center justify-between rounded-md px-2 py-2.5 text-xs text-smoke transition-colors duration-300 hover:bg-ivory/[0.05] hover:text-ivory"
                    >
                      {set.title}
                      <span className="text-[0.62rem] text-mute">{set.occasion}</span>
                    </Link>
                  ))}
                  <Link
                    href="/sets"
                    className="rounded-md px-2 py-2.5 text-xs text-gold transition-colors duration-300 hover:bg-gold/[0.08]"
                  >
                    همه ست‌ها
                  </Link>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex flex-col gap-3">
            <span className="text-[0.68rem] tracking-wide text-mute">حساب کاربری</span>

            {user ? (
              <div className="flex flex-col gap-2">
                <Link
                  href={user.role === "admin" ? "/admin" : "/account"}
                  className="flex items-center gap-3 rounded-lg border border-line p-3.5 transition-colors duration-300 hover:border-ivory/25"
                >
                  <span
                    className="grid size-9 place-items-center rounded-full text-xs font-semibold"
                    style={{
                      background: `linear-gradient(140deg, ${user.accent}33, ${user.accent}0f)`,
                      color: user.accent,
                    }}
                  >
                    {user.name.slice(0, 1)}
                  </span>
                  <span className="flex flex-col">
                    <span className="text-xs text-ivory">{user.name}</span>
                    <span className="text-[0.65rem] text-mute">
                      {user.role === "admin" ? "ورود به پنل مدیریت" : "ورود به پنل کاربری"}
                    </span>
                  </span>
                  {user.role === "admin" ? (
                    <LayoutDashboard className="ms-auto size-4 text-mute" />
                  ) : (
                    <UserRound className="ms-auto size-4 text-mute" />
                  )}
                </Link>

                <form action={logoutAction}>
                  <Button type="submit" variant="ghost" size="sm" className="w-full justify-start">
                    خروج از حساب
                  </Button>
                </form>
              </div>
            ) : (
              <Button asChild variant="gold" size="md" className="w-full">
                <Link href="/login">
                  <LogIn className="size-4" />
                  ورود یا ثبت‌نام
                </Link>
              </Button>
            )}
           </div>

           <div className="flex flex-col gap-2">
             <span className="text-[0.68rem] tracking-wide text-mute">ظاهر</span>
             <ThemeToggle variant="labelled" />
           </div>
         </SheetBody>

        <SheetFooter className="flex flex-col gap-3">
          <a
            href={`tel:${SITE.phoneRaw}`}
            className="flex items-center gap-2.5 text-xs text-smoke transition-colors duration-300 hover:text-ivory"
          >
            <Phone className="size-3.5 text-gold" />
            <span className="tnum">{SITE.phone}</span>
          </a>

          <div className="flex flex-wrap gap-3">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.title}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                className="text-[0.68rem] text-mute transition-colors duration-300 hover:text-gold-soft"
              >
                {social.title}
              </a>
            ))}
          </div>

          <Link
            href="/account/wishlist"
            className="flex items-center gap-2 text-xs text-smoke transition-colors duration-300 hover:text-ivory"
          >
            <Heart className="size-3.5 text-gold" />
            علاقه‌مندی‌های من
          </Link>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
