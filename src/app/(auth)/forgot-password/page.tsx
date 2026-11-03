import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, KeyRound, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "بازیابی رمز عبور",
  description: "بازیابی رمز عبور حساب کاربری آتلیه Next Level.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col gap-7">
      <header className="flex flex-col gap-3">
        <span className="inline-flex items-center gap-2.5 text-[0.66rem] tracking-[0.28em] text-gold/85">
          <span className="h-px w-7 bg-gold/45" />
          RECOVERY
        </span>
        <h1 className="text-xl font-semibold tracking-tight text-ivory sm:text-2xl">
          بازیابی رمز عبور
        </h1>
        <p className="text-xs leading-7 text-smoke">
          برای بازنشانی رمز عبور، با پشتیبانی آتلیه تماس بگیرید. پس از احراز هویت، رمز جدید برای شما
          تنظیم می‌شود.
        </p>
      </header>

      <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface/50 p-5">
        <span className="flex items-center gap-3 text-xs text-smoke">
          <KeyRound className="size-4 text-gold" />
          رمز عبور به‌صورت پیامک برای شماره ثبت‌شده ارسال می‌شود.
        </span>
        <span className="flex items-center gap-3 text-xs text-smoke">
          <Phone className="size-4 text-gold" />
          <span className="tnum">{SITE.phone}</span>
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="gold" size="md">
          <Link href="/login">بازگشت به صفحه ورود</Link>
        </Button>
        <Button asChild variant="ghost" size="md">
          <Link href="/contact">
            تماس با پشتیبانی
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
