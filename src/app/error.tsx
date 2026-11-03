"use client";

import * as React from "react";
import Link from "next/link";
import { Home, RefreshCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[next-level] runtime error:", error);
  }, [error]);

  return (
    <div className="relative isolate flex min-h-dvh items-center justify-center overflow-hidden px-6 py-20">
      <span
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_-10%,rgba(224,100,92,0.14),transparent_58%)]"
      />

      <div className="flex max-w-xl flex-col items-center gap-7 text-center">
        <span className="grid size-16 place-items-center rounded-full border border-danger/25 bg-danger/[0.07] text-danger">
          <TriangleAlert className="size-7" />
        </span>

        <div className="flex flex-col gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-ivory sm:text-3xl">
            خطایی در بارگذاری صفحه رخ داد
          </h1>
          <p className="text-xs leading-7 text-smoke">
            می‌توانید یک‌بار دیگر تلاش کنید. اگر مشکل ادامه داشت، با پشتیبانی بوتیک تماس بگیرید.
          </p>
          {error.digest ? (
            <span className="tnum text-[0.64rem] text-mute">کد خطا: {error.digest}</span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button type="button" variant="gold" size="lg" onClick={reset}>
            <RefreshCcw className="size-4" />
            تلاش مجدد
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/">
              <Home className="size-4" />
              بازگشت به صفحه اصلی
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
