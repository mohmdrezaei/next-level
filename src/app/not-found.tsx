import Link from "next/link";
import { ArrowLeft, Compass, Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/features/products/data/catalog";

export default function NotFound() {
  return (
    <div className="relative isolate flex min-h-dvh items-center justify-center overflow-hidden px-6 py-20">
      <span
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_-10%,rgba(200,162,76,0.14),transparent_58%)]"
      />
      <span aria-hidden className="grain-layer absolute inset-0 -z-10 opacity-[0.14]" />

      <div className="flex max-w-xl flex-col items-center gap-7 text-center">
        <span className="grid size-16 place-items-center rounded-full border border-gold/25 bg-gold/[0.07] text-gold">
          <Compass className="size-7" />
        </span>

        <div className="flex flex-col gap-3">
          <span className="tnum text-[0.7rem] tracking-[0.3em] text-gold/85">۴۰۴</span>
          <h1 className="text-2xl font-semibold tracking-tight text-ivory sm:text-3xl">
            این صفحه در آتلیه پیدا نشد
          </h1>
          <p className="text-xs leading-7 text-smoke">
            ممکن است نشانی تغییر کرده باشد یا قطعه‌ای که دنبالش بودید از فروشگاه خارج شده باشد.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild variant="gold" size="lg">
            <Link href="/">
              <Home className="size-4" />
              بازگشت به صفحه اصلی
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/shop">
              <Search className="size-4" />
              جست‌وجو در فروشگاه
            </Link>
          </Button>
        </div>

        <div className="flex flex-col items-center gap-3 border-t border-line pt-7">
          <span className="text-[0.66rem] tracking-[0.18em] text-mute">یا از دسته‌بندی‌ها شروع کنید</span>
          <div className="flex flex-wrap justify-center gap-2">
            {CATEGORIES.map((category) => (
              <Link
                key={category.slug}
                href={`/shop?category=${category.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-[0.68rem] text-smoke transition-colors duration-300 hover:border-gold/40 hover:text-gold-soft"
              >
                {category.title}
                <ArrowLeft className="size-3" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
