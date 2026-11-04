"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Heart, LayoutDashboard, LogOut, Menu, Package, User, UserRound } from "lucide-react";
import { motion, useScroll, useMotionValueEvent } from "motion/react";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutAction } from "@/features/auth/actions";
import { CartButton } from "@/features/cart/components/cart-button";
import { CartDrawer } from "@/features/cart/components/cart-drawer";
import { SearchDialog } from "@/features/search/components/search-dialog";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { MobileNav } from "./mobile-nav";
import { cn } from "@/lib/utils";
import { PRIMARY_NAV, SITE } from "@/lib/constants";
import { CATEGORIES } from "@/features/products/data/catalog";
import type { SessionUser } from "@/features/auth/types";
import type { ResolvedSet } from "@/features/sets/types";
import type { Product } from "@/features/products/types";

export function SiteHeader({
  user,
  featuredSets = [],
  products = [],
}: {
  user: SessionUser | null;
  /** Featured looks, resolved on the server and handed down for the mobile menu. */
  featuredSets?: ResolvedSet[];
  /** Live catalogue, handed down so the search palette searches real data. */
  products?: Product[];
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 24);
  });

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 transition-colors duration-500",
          scrolled
            ? "border-b border-line bg-ink/85 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent",
        )}
      >
        <div className="container-page flex h-18 items-center gap-4">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="باز کردن منو"
            className="grid size-10 place-items-center rounded-full border border-line text-smoke transition-colors duration-300 hover:border-ivory/25 hover:text-ivory lg:hidden"
          >
            <Menu className="size-4" />
          </button>

          <Logo />

          {/* Desktop navigation */}
          <nav className="mx-auto hidden items-center gap-1 lg:flex">
            <NavLink href="/shop" active={pathname === "/shop"}>
              فروشگاه
            </NavLink>
            <NavLink href="/sets" active={pathname.startsWith("/sets")}>
              ست‌های کامل
            </NavLink>
            <NavLink href="/about" active={pathname === "/about"}>
              درباره ما
            </NavLink>
            <NavLink href="/contact" active={pathname === "/contact"}>
              تماس با ما
            </NavLink>
          </nav>

          <div className="ms-auto flex items-center gap-2 lg:ms-0">
            <ThemeToggle />

            <SearchDialog products={products} />

            <Link
              href="/account/wishlist"
              aria-label="علاقه‌مندی‌ها"
              className="hidden size-10 place-items-center rounded-full border border-line text-smoke transition-colors duration-300 hover:border-ivory/25 hover:text-ivory sm:grid"
            >
              <Heart className="size-4" />
            </Link>

            <CartButton />

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label={user.role === "admin" ? "منوی مدیریت و حساب کاربری" : "منوی حساب کاربری"}
                    className="group hidden items-center gap-2 rounded-full border border-line py-1 pe-3.5 ps-1 transition-colors duration-300 hover:border-ivory/25 sm:inline-flex"
                  >
                    <span
                      className="grid size-8 place-items-center rounded-full text-[0.7rem] font-semibold"
                      style={{
                        background: `linear-gradient(140deg, ${user.accent}33, ${user.accent}0f)`,
                        color: user.accent,
                      }}
                    >
                      {user.name.slice(0, 1)}
                    </span>
                    <span className="flex flex-col text-start leading-tight">
                      <span className="text-[0.68rem] text-ivory">{user.name}</span>
                      <span className="text-[0.6rem] text-mute">
                        {user.role === "admin" ? "مدیر بوتیک" : "حساب من"}
                      </span>
                    </span>
                    <ChevronDown className="size-3 text-mute transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="text-xs font-medium text-ivory">{user.name}</p>
                    <p className="text-[0.65rem] text-mute">
                      {user.role === "admin"
                        ? "مدیر بوتیک Next Level"
                        : user.email || user.phone || "کاربر بوتیک"}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  {user.role === "admin" ? (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center gap-2.5">
                          <LayoutDashboard className="size-4 text-gold" />
                          <span className="font-medium text-ivory">پنل مدیریت</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/account" className="flex items-center gap-2.5">
                          <UserRound className="size-4 text-smoke" />
                          <span>پنل کاربری</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/account/orders" className="flex items-center gap-2.5">
                          <Package className="size-4 text-smoke" />
                          <span>سفارش‌های من</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/account" className="flex items-center gap-2.5">
                          <UserRound className="size-4 text-gold" />
                          <span className="font-medium text-ivory">پنل کاربری</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/account/orders" className="flex items-center gap-2.5">
                          <Package className="size-4 text-smoke" />
                          <span>سفارش‌های من</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/account/wishlist" className="flex items-center gap-2.5">
                          <Heart className="size-4 text-smoke" />
                          <span>علاقه‌مندی‌ها</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="danger" asChild>
                    <form action={logoutAction} className="w-full">
                      <button type="submit" className="flex w-full items-center gap-2.5 text-start">
                        <LogOut className="size-4" />
                        <span>خروج از حساب</span>
                      </button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
                <Link href="/login">
                  <User className="size-3.5" />
                  ورود / ثبت‌نام
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Category rail */}
        <div className="hidden border-t border-line/60 lg:block">
          <div className="container-page flex h-11 items-center gap-6 overflow-x-auto">
            {CATEGORIES.map((category) => (
              <Link
                key={category.slug}
                href={`/shop?category=${category.slug}`}
                className="whitespace-nowrap text-[0.72rem] text-mute transition-colors duration-300 hover:text-gold-soft"
              >
                {category.title}
              </Link>
            ))}
            <span className="ms-auto inline-flex items-center gap-2 whitespace-nowrap text-[0.68rem] text-mute">
              <Sparkle />
              {SITE.workingHours}
            </span>
          </div>
        </div>

        <motion.div
          className="h-px origin-center bg-[linear-gradient(90deg,transparent,rgba(200,162,76,0.4),transparent)]"
          animate={{ opacity: scrolled ? 1 : 0 }}
          transition={{ duration: 0.4 }}
        />
      </header>

      <MobileNav
        open={mobileOpen}
        onOpenChange={setMobileOpen}
        user={user}
        categories={CATEGORIES}
        sets={featuredSets}
      />
      <CartDrawer />
    </>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "relative rounded-full px-4 py-2 text-sm transition-colors duration-300",
        active ? "text-ivory" : "text-smoke hover:text-ivory",
      )}
    >
      {children}
      {active ? (
        <motion.span
          layoutId="nav-active"
          className="absolute inset-x-3 -bottom-0.5 h-px bg-gold"
          transition={{ type: "spring", stiffness: 420, damping: 32 }}
        />
      ) : null}
    </Link>
  );
}

function Sparkle() {
  return (
    <span className="relative flex size-1.5">
      <span className="absolute inline-flex size-full animate-ring rounded-full bg-gold/60" />
      <span className="relative inline-flex size-1.5 rounded-full bg-gold" />
    </span>
  );
}


