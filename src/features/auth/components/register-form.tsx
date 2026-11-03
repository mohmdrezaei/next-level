"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, AtSign, Lock, Phone, UserRound } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/controls";
import { Separator } from "@/components/ui/separator";
import { registerAction } from "../actions";
import type { AuthState } from "../types";

export function RegisterForm() {
  const [state, formAction, pending] = React.useActionState<AuthState, FormData>(
    registerAction,
    {},
  );
  const [accepted, setAccepted] = React.useState(false);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <span className="inline-flex items-center gap-2.5 text-[0.66rem] tracking-[0.28em] text-gold/85">
          <span className="h-px w-7 bg-gold/45" />
          CREATE ACCOUNT
        </span>
        <h1 className="text-xl font-semibold tracking-tight text-ivory sm:text-2xl">
          ساخت حساب جدید
        </h1>
        <p className="text-xs leading-7 text-smoke">
          با ثبت‌نام، به باشگاه مشتریان Next Level می‌پیوندید و از امتیاز و تخفیف‌های اختصاصی استفاده
          می‌کنید.
        </p>
      </header>

      <form action={formAction} className="flex flex-col gap-5">
        <Field label="نام و نام خانوادگی" required error={state.fieldErrors?.name}>
          <Input
            name="name"
            autoComplete="name"
            placeholder="مثلاً آرش مهرآذین"
            startIcon={<UserRound />}
            data-invalid={state.fieldErrors?.name ? "" : undefined}
          />
        </Field>

        <Field label="شماره موبایل" required error={state.fieldErrors?.phone}>
          <Input
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="09120000000"
            dir="ltr"
            className="tnum text-start"
            startIcon={<Phone />}
            data-invalid={state.fieldErrors?.phone ? "" : undefined}
          />
        </Field>

        <Field label="ایمیل" hint="اختیاری" error={state.fieldErrors?.email}>
          <Input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            dir="ltr"
            className="text-start"
            startIcon={<AtSign />}
            data-invalid={state.fieldErrors?.email ? "" : undefined}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="رمز عبور" required error={state.fieldErrors?.password} hint="حداقل ۶ کاراکتر">
            <Input
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              dir="ltr"
              className="text-start"
              startIcon={<Lock />}
              data-invalid={state.fieldErrors?.password ? "" : undefined}
            />
          </Field>

          <Field label="تکرار رمز عبور" required error={state.fieldErrors?.confirm}>
            <Input
              name="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              dir="ltr"
              className="text-start"
              startIcon={<Lock />}
              data-invalid={state.fieldErrors?.confirm ? "" : undefined}
            />
          </Field>
        </div>

        <label className="flex cursor-pointer items-start gap-3 text-[0.7rem] leading-6 text-smoke">
          <Checkbox
            name="terms"
            checked={accepted}
            onCheckedChange={(value) => setAccepted(Boolean(value))}
            className="mt-1"
          />
          <span>
            قوانین فروشگاه و سیاست حریم خصوصی Next Level را خوانده‌ام و می‌پذیرم.
            {state.fieldErrors?.terms ? (
              <span className="mt-1 block text-danger">{state.fieldErrors.terms}</span>
            ) : null}
          </span>
        </label>

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
          ساخت حساب کاربری
        </Button>
      </form>

      <Separator />

      <p className="text-center text-xs text-smoke">
        قبلاً ثبت‌نام کرده‌اید؟{" "}
        <Link
          href="/login"
          className="text-gold transition-colors duration-300 hover:text-gold-soft"
        >
          وارد شوید
        </Link>
      </p>
    </div>
  );
}
