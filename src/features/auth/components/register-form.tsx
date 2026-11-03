"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  AtSign,
  KeyRound,
  Lock,
  Phone,
  RotateCw,
  Smartphone,
  UserRound,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/controls";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { registerAction } from "../actions";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { toast } from "sonner";
import type { AuthState, SessionUser } from "../types";

export function RegisterForm() {
  const router = useRouter();
  const [tab, setTab] = React.useState<"otp" | "password">("otp");

  // OTP flow state
  const [otpStep, setOtpStep] = React.useState<"info" | "code">("info");
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [otpCode, setOtpCode] = React.useState("");
  const [acceptedTerms, setAcceptedTerms] = React.useState(false);
  const [otpLoading, setOtpLoading] = React.useState(false);
  const [otpError, setOtpError] = React.useState<string | null>(null);
  const [countdown, setCountdown] = React.useState(0);

  // Password flow state
  const [state, formAction, pending] = React.useActionState<AuthState, FormData>(
    registerAction,
    {},
  );
  const [acceptedPw, setAcceptedPw] = React.useState(false);

  // Timer effect
  React.useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setOtpError(null);

    if (name.trim().length < 3) {
      setOtpError("نام و نام خانوادگی را کامل وارد کنید.");
      return;
    }

    const clean = phone.replace(/[\s-]/g, "").replace(/^(\+98|0098|98)/, "0");
    if (!/^0?9\d{9}$/.test(clean)) {
      setOtpError("شماره موبایل نامعتبر است. شماره باید ۱۱ رقم بوده و با ۰۹ شروع شود.");
      return;
    }

    if (!acceptedTerms) {
      setOtpError("پذیرش قوانین فروشگاه الزامی است.");
      return;
    }

    setOtpLoading(true);
    try {
      const res = await apiFetch<{ ok: boolean; phone: string; expiresIn: number; message: string }>(
        "/api/auth/otp/send",
        {
          method: "POST",
          body: { phone: clean },
        },
      );
      toast.success(res.message || "کد تأیید ارسال شد.");
      setOtpStep("code");
      setCountdown(res.expiresIn || 120);
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : "خطا در ارسال کد تأیید.";
      setOtpError(msg);
      toast.error(msg);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);

    if (!otpCode.trim() || otpCode.trim().length < 4) {
      setOtpError("لطفاً کد ۵ رقمی را وارد کنید.");
      return;
    }

    setOtpLoading(true);
    try {
      const clean = phone.replace(/[\s-]/g, "").replace(/^(\+98|0098|98)/, "0");
      const res = await apiFetch<{
        ok: boolean;
        user: SessionUser;
        accessToken: string;
        refreshToken: string;
      }>("/api/auth/otp/verify", {
        method: "POST",
        body: { phone: clean, code: otpCode.trim(), name: name.trim() },
      });

      if (typeof window !== "undefined") {
        localStorage.setItem("nextlevel_access_token", res.accessToken);
        localStorage.setItem("nextlevel_refresh_token", res.refreshToken);
      }

      toast.success(`خوش آمدید، ${res.user.name}`);
      router.push("/account");
      router.refresh();
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : "کد تأیید نادرست است.";
      setOtpError(msg);
      toast.error(msg);
    } finally {
      setOtpLoading(false);
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

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
          با عضویت در بوتیک Next Level، از تخفیف‌های اعضای باشگاه و پیگیری سریع سفارش‌ها بهره‌مند شوید.
        </p>
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "otp" | "password")}>
        <TabsList className="w-full">
          <TabsTrigger value="otp" className="flex-1">
            <Smartphone className="size-3.5" />
            ثبت‌نام با پیامک (OTP)
          </TabsTrigger>
          <TabsTrigger value="password" className="flex-1">
            <Lock className="size-3.5" />
            ثبت‌نام با رمز عبور
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "otp" ? (
        <div className="flex flex-col gap-5">
          {otpStep === "info" ? (
            <form onSubmit={handleSendOtp} className="flex flex-col gap-5">
              <Field label="نام و نام خانوادگی" required>
                <Input
                  autoComplete="name"
                  placeholder="مثلاً آرش مهرآذین"
                  startIcon={<UserRound />}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </Field>

              <Field label="شماره موبایل" required hint="کد تأیید به این شماره ارسال خواهد شد">
                <Input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="09120000000"
                  dir="ltr"
                  className="tnum text-start"
                  startIcon={<Phone />}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </Field>

              <label className="flex cursor-pointer items-start gap-3 text-[0.7rem] leading-6 text-smoke">
                <Checkbox
                  checked={acceptedTerms}
                  onCheckedChange={(v) => setAcceptedTerms(Boolean(v))}
                  className="mt-1"
                />
                <span>قوانین فروشگاه و سیاست حفظ حریم خصوصی Next Level را مطالعه کرده و می‌پذیرم.</span>
              </label>

              <AnimatePresence>
                {otpError ? (
                  <motion.p
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="flex items-start gap-2.5 rounded-lg border border-danger/30 bg-danger/[0.07] px-4 py-3 text-[0.7rem] leading-6 text-danger"
                  >
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    {otpError}
                  </motion.p>
                ) : null}
              </AnimatePresence>

              <Button
                type="submit"
                variant="gold"
                size="lg"
                loading={otpLoading}
                className="w-full"
              >
                ارسال کد تأیید
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
              <div className="flex items-center justify-between rounded-xl border border-line bg-surface/50 p-3.5 text-xs">
                <div className="flex items-center gap-2 text-smoke">
                  <Smartphone className="size-4 text-gold" />
                  <span>ارسال‌شده به:</span>
                  <span dir="ltr" className="tnum font-medium text-ivory">
                    {phone}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[0.66rem] text-gold"
                  onClick={() => {
                    setOtpStep("info");
                    setOtpCode("");
                    setOtpError(null);
                  }}
                >
                  تغییر شماره
                </Button>
              </div>

              <Field
                label="کد تأیید ۵ رقمی"
                required
                hint={
                  process.env.NODE_ENV !== "production"
                    ? "در حالت لوکال، کد در ترمینال سرور نمایش داده می‌شود (یا ۱۲۳۴۵)"
                    : undefined
                }
                error={otpError ?? undefined}
              >
                <Input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="• • • • •"
                  dir="ltr"
                  className="tnum text-center text-lg tracking-[0.5em]"
                  startIcon={<KeyRound />}
                  value={otpCode}
                  maxLength={6}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  autoFocus
                />
              </Field>

              <div className="flex items-center justify-between text-xs">
                {countdown > 0 ? (
                  <span className="text-[0.7rem] text-mute">
                    ارسال مجدد کد پس از{" "}
                    <span className="tnum font-mono text-gold-soft">
                      {formatTimer(countdown)}
                    </span>
                  </span>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 px-2 text-[0.68rem] text-gold"
                    onClick={() => handleSendOtp()}
                    disabled={otpLoading}
                  >
                    <RotateCw className="size-3" />
                    ارسال مجدد کد تأیید
                  </Button>
                )}
              </div>

              <AnimatePresence>
                {otpError ? (
                  <motion.p
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="flex items-start gap-2.5 rounded-lg border border-danger/30 bg-danger/[0.07] px-4 py-3 text-[0.7rem] leading-6 text-danger"
                  >
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    {otpError}
                  </motion.p>
                ) : null}
              </AnimatePresence>

              <Button
                type="submit"
                variant="gold"
                size="lg"
                loading={otpLoading}
                className="w-full"
              >
                تکمیل ثبت‌نام و ورود
              </Button>
            </form>
          )}
        </div>
      ) : (
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
              checked={acceptedPw}
              onCheckedChange={(value) => setAcceptedPw(Boolean(value))}
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
      )}

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
