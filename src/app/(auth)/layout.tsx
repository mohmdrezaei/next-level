import Link from "next/link";
import { ArrowRight, BadgeCheck, Gem, Truck } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { SITE } from "@/lib/constants";

const PERKS = [
  { icon: Truck, title: "ارسال رایگان", body: "برای سفارش‌های بالای ۵ میلیون تومان" },
  { icon: BadgeCheck, title: "ضمانت اصالت", body: "برگه اصالت پارچه برای هر قطعه" },
  { icon: Gem, title: "دسترسی زودتر", body: "مشاهده قطعات تیراژ محدود پیش از انتشار" },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Form column */}
      <div className="flex flex-col px-6 py-10 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between gap-4">
          <Logo />
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[0.68rem] text-mute transition-colors duration-300 hover:text-gold-soft"
          >
            بازگشت به فروشگاه
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-md">{children}</div>
        </div>

        <p className="text-center text-[0.65rem] text-mute">
          با ورود به حساب، قوانین فروشگاه {SITE.name} و سیاست حریم خصوصی را می‌پذیرید.
        </p>
      </div>

      {/* Visual column */}
      <aside className="relative hidden overflow-hidden border-s border-line lg:block">
        <img
          src="/art/auth-backdrop.svg"
          alt=""
          aria-hidden
          className="media-invertible absolute inset-0 size-full object-cover"
        />
        <span
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(to_top,rgba(11,11,13,0.96),rgba(11,11,13,0.65)_50%,rgba(11,11,13,0.4))]"
        />
        <span aria-hidden className="grain-layer absolute inset-0 opacity-[0.16]" />

        <div className="relative flex h-full flex-col justify-end gap-8 p-12">
          <div className="flex flex-col gap-4">
            <span className="text-[0.66rem] tracking-[0.28em] text-gold/85">
              {SITE.latinName} ATELIER
            </span>
            <h2 className="max-w-md text-2xl font-semibold leading-relaxed tracking-tight text-ivory">
              عضویت در آتلیه، دسترسی به قطعاتی که پیش از انتشار تمام می‌شوند.
            </h2>
            <p className="max-w-md text-xs leading-7 text-smoke">
              با ساخت حساب، سفارش‌های خود را پیگیری کنید، نشانی‌ها را ذخیره کنید و از تخفیف‌های
              اختصاصی اعضای باشگاه استفاده کنید.
            </p>
          </div>

          <ul className="flex flex-col gap-4 border-t border-line pt-8">
            {PERKS.map((perk) => (
              <li key={perk.title} className="flex items-start gap-3.5">
                <span className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-ink/50 text-gold backdrop-blur-md">
                  <perk.icon className="size-4" />
                </span>
                <span className="flex flex-col gap-1">
                  <span className="text-xs text-ivory">{perk.title}</span>
                  <span className="text-[0.65rem] text-mute">{perk.body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
