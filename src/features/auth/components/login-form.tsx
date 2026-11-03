"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, AtSign, Lock, Phone, ShieldCheck, UserRound } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/controls";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { loginAction } from "../actions";
import { DEMO_CREDENTIALS, ADMIN_CREDENTIALS } from "@/lib/constants";
import { toPersianDigits } from "@/lib/format";
import type { AuthState } from "../types";

export function LoginForm({ next = "/account" }: { next?: string }) {
  const [mode, setMode] = React.useState<"phone" | "email">("phone");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [remember, setRemember] = React.useState(true);

  const [state, formAction, pending] = React.useActionState<AuthState, FormData>(
    loginAction,
    {},
  );

  /**
   * Typing an "@" means the visitor is entering an email address, so the tab
   * switches for them instead of failing phone validation.
   */
  const handlePhoneChange = (value: string) => {
    if (value.includes("@")) {
      setMode("email");
      setEmail(value);
      setPhone("");
      return;
    }
    setPhone(value);
  };

  const fillDemo = (role: "customer" | "admin") => {
    if (role === "admin") {
      setMode("email");
      setEmail(ADMIN_CREDENTIALS.email);
      setPassword(ADMIN_CREDENTIALS.password);
      return;
    }
    setMode("phone");
    setPhone(DEMO_CREDENTIALS.phone);
    setPassword(DEMO_CREDENTIALS.password);
  };

  /** Where the visitor lands once signed in. */
  const destination = next.startsWith("/") ? next : "/account";

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <span className="inline-flex items-center gap-2.5 text-[0.66rem] tracking-[0.28em] text-gold/85">
          <span className="h-px w-7 bg-gold/45" />
          SIGN IN
        </span>
        <h1 className="text-xl font-semibold tracking-tight text-ivory sm:text-2xl">
          ورود به حساب کاربری
        </h1>
        <p className="text-xs leading-7 text-smoke">
          برای پیگیری سفارش‌ها و مدیریت حساب، با شماره موبایل یا ایمیل وارد شوید. ورود با ایمیل
          مدیر، شما را به پنل مدیریت می‌برد.
        </p>
      </header>

      <Tabs value={mode} onValueChange={(value) => setMode(value as "phone" | "email")}>
        <TabsList className="w-full">
          <TabsTrigger value="phone" className="flex-1">
            <Phone className="size-3.5" />
            ورود با موبایل
          </TabsTrigger>
          <TabsTrigger value="email" className="flex-1">
            <AtSign className="size-3.5" />
            ورود با ایمیل
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <form action={formAction} className="flex flex-col gap-5">
        <input type="hidden" name="mode" value={mode} />
        <input type="hidden" name="next" value={destination} />

        {mode === "phone" ? (
          <Field label="شماره موبایل" required error={state.fieldErrors?.phone}>
            <Input
              name="phone"
              type="text"
              inputMode="tel"
              autoComplete="tel"
              placeholder="09120000000"
              dir="ltr"
              className="tnum text-start"
              startIcon={<Phone />}
              value={phone}
              onChange={(event) => handlePhoneChange(event.target.value)}
              data-invalid={state.fieldErrors?.phone ? "" : undefined}
            />
          </Field>
        ) : (
          <Field label="ایمیل" required error={state.fieldErrors?.email}>
            <Input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="admin@nextlevel.test"
              dir="ltr"
              className="text-start"
              startIcon={<AtSign />}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              data-invalid={state.fieldErrors?.email ? "" : undefined}
            />
          </Field>
        )}

        <Field label="رمز عبور" required error={state.fieldErrors?.password}>
          <Input
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            dir="ltr"
            className="text-start"
            startIcon={<Lock />}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            data-invalid={state.fieldErrors?.password ? "" : undefined}
          />
        </Field>

        <div className="flex items-center justify-between gap-4">
          <label className="flex cursor-pointer items-center gap-2.5 text-xs text-smoke">
            <Checkbox
              checked={remember}
              onCheckedChange={(value) => setRemember(Boolean(value))}
            />
            مرا به خاطر بسپار
          </label>

          <Link
            href="/forgot-password"
            className="text-[0.68rem] text-mute transition-colors duration-300 hover:text-gold-soft"
          >
            رمز عبور را فراموش کرده‌اید؟
          </Link>
        </div>

        <AnimatePresence>
          {state.error ? (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-start gap-2.5 rounded-lg border border-danger/30 bg-danger/[0.07] px-4 py-3 text-[0.7rem] leading-6 text-danger"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              {state.error}
            </motion.p>
          ) : null}
        </AnimatePresence>

        <Button type="submit" variant="gold" size="lg" loading={pending} className="w-full">
          ورود به حساب
        </Button>
      </form>

      <Separator />

      <div className="flex flex-col gap-3.5 rounded-xl border border-line bg-surface/50 p-4">
        <span className="text-[0.66rem] tracking-[0.18em] text-mute">حساب‌های آزمایشی</span>

        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-2 text-[0.68rem] text-smoke">
            <UserRound className="size-3.5 text-mute" />
            <span className="text-mute">مشتری:</span>
            <span className="tnum rounded border border-line px-2 py-0.5" dir="ltr">
              {DEMO_CREDENTIALS.phone}
            </span>
            <span className="rounded border border-line px-2 py-0.5" dir="ltr">
              {DEMO_CREDENTIALS.password}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="ms-auto h-7 px-3 text-[0.66rem]"
              onClick={() => fillDemo("customer")}
            >
              پر کردن
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[0.68rem] text-smoke">
            <ShieldCheck className="size-3.5 text-mute" />
            <span className="text-mute">مدیر:</span>
            <span className="rounded border border-line px-2 py-0.5" dir="ltr">
              {ADMIN_CREDENTIALS.email}
            </span>
            <span className="rounded border border-line px-2 py-0.5" dir="ltr">
              {ADMIN_CREDENTIALS.password}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="ms-auto h-7 px-3 text-[0.66rem]"
              onClick={() => fillDemo("admin")}
            >
              پر کردن
            </Button>
          </div>
        </div>

        <span className="text-[0.64rem] leading-6 text-mute">
          ورود با ایمیل مدیر، شما را مستقیم به پنل مدیریت هدایت می‌کند. ورود با شماره موبایل،
          دسترسی مشتری می‌دهد و پنل مدیریت برای آن باز نمی‌شود.
        </span>
      </div>

      <p className="text-center text-xs text-smoke">
        حساب کاربری ندارید؟{" "}
        <Link
          href={`/register${next !== "/account" ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="text-gold transition-colors duration-300 hover:text-gold-soft"
        >
          ثبت‌نام کنید
        </Link>
      </p>

      <p className="text-center text-[0.62rem] text-mute">
        پشتیبانی تلفنی: <span className="tnum">{toPersianDigits("02191002233")}</span>
      </p>
    </div>
  );
}
