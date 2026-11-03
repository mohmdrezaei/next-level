"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  AtSign,
  CheckCircle2,
  KeyRound,
  Lock,
  Phone,
  RotateCw,
  ShieldCheck,
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
import { loginAction } from "../actions";
import { DEMO_CREDENTIALS, ADMIN_CREDENTIALS } from "@/lib/constants";
import { toPersianDigits } from "@/lib/format";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { toast } from "sonner";
import type { AuthState, SessionUser } from "../types";

export function LoginForm({ next = "/account" }: { next?: string }) {
  const router = useRouter();
  const [tab, setTab] = React.useState<"otp" | "password">("otp");

  // OTP state
  const [otpStep, setOtpStep] = React.useState<"phone" | "code">("phone");
  const [otpPhone, setOtpPhone] = React.useState("");
  const [otpCode, setOtpCode] = React.useState("");
  const [otpLoading, setOtpLoading] = React.useState(false);
  const [otpError, setOtpError] = React.useState<string | null>(null);
  const [countdown, setCountdown] = React.useState<number>(0);

  // Password state
  const [pwMode, setPwMode] = React.useState<"phone" | "email">("phone");
  const [pwPhone, setPwPhone] = React.useState("");
  const [pwEmail, setPwEmail] = React.useState("");
  const [pwPassword, setPwPassword] = React.useState("");
  const [remember, setRemember] = React.useState(true);

  const [state, formAction, pending] = React.useActionState<AuthState, FormData>(
    loginAction,
    {},
  );

  // Countdown timer for OTP
  React.useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  const destination = next.startsWith("/") ? next : "/account";

  // Request OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setOtpError(null);

    const clean = otpPhone.replace(/[\s-]/g, "").replace(/^(\+98|0098|98)/, "0");
    if (!/^0?9\d{9}$/.test(clean)) {
      setOtpError("شماره موبایل نامعتبر است. شماره باید ۱۱ رقم بوده و با ۰۹ شروع شود.");
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

  // Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);

    if (!otpCode.trim() || otpCode.trim().length < 4) {
      setOtpError("لطفاً کد تأیید ۵ رقمی را وارد کنید.");
      return;
    }

    setOtpLoading(true);
    try {
      const clean = otpPhone.replace(/[\s-]/g, "").replace(/^(\+98|0098|98)/, "0");
      const res = await apiFetch<{
        ok: boolean;
        user: SessionUser;
        accessToken: string;
        refreshToken: string;
      }>("/api/auth/otp/verify", {
        method: "POST",
        body: { phone: clean, code: otpCode.trim() },
      });

      // Store tokens
      if (typeof window !== "undefined") {
        localStorage.setItem("nextlevel_access_token", res.accessToken);
        localStorage.setItem("nextlevel_refresh_token", res.refreshToken);
      }

      toast.success(`خوش آمدید، ${res.user.name}`);
      router.push(destination);
      router.refresh();
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : "کد تأیید نادرست است.";
      setOtpError(msg);
      toast.error(msg);
    } finally {
      setOtpLoading(false);
    }
  };

  const fillDemo = (role: "customer" | "admin") => {
    if (role === "admin") {
      setTab("password");
      setPwMode("email");
      setPwEmail(ADMIN_CREDENTIALS.email);
      setPwPassword(ADMIN_CREDENTIALS.password);
      return;
    }
    // Customer
    setTab("otp");
    setOtpStep("phone");
    setOtpPhone(DEMO_CREDENTIALS.phone);
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
          SIGN IN
        </span>
        <h1 className="text-xl font-semibold tracking-tight text-ivory sm:text-2xl">
          ورود به حساب کاربری
        </h1>
        <p className="text-xs leading-7 text-smoke">
          برای پیگیری سفارش‌ها، دسترسی به سبد خرید و مدیریت حساب کاربری وارد شوید.
        </p>
      </header>

      <Tabs value={tab} onValueChange={(val) => setTab(val as "otp" | "password")}>
        <TabsList className="w-full">
          <TabsTrigger value="otp" className="flex-1">
            <Smartphone className="size-3.5" />
            کد یک‌بار مصرف (پیامک)
          </TabsTrigger>
          <TabsTrigger value="password" className="flex-1">
            <Lock className="size-3.5" />
            ورود با رمز عبور
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "otp" ? (
        <div className="flex flex-col gap-5">
          {otpStep === "phone" ? (
            <form onSubmit={handleSendOtp} className="flex flex-col gap-5">
              <Field
                label="شماره موبایل"
                required
                hint="کد تأیید به این شماره پیامک می‌شود"
                error={otpError ?? undefined}
              >
                <Input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="09120000000"
                  dir="ltr"
                  className="tnum text-start"
                  startIcon={<Phone />}
                  value={otpPhone}
                  onChange={(e) => setOtpPhone(e.target.value)}
                  autoFocus
                />
              </Field>

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
                دریافت کد تأیید
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
              <div className="flex items-center justify-between rounded-xl border border-line bg-surface/50 p-3.5 text-xs">
                <div className="flex items-center gap-2 text-smoke">
                  <Smartphone className="size-4 text-gold" />
                  <span>ارسال‌شده به:</span>
                  <span dir="ltr" className="tnum font-medium text-ivory">
                    {otpPhone}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[0.66rem] text-gold"
                  onClick={() => {
                    setOtpStep("phone");
                    setOtpCode("");
                    setOtpError(null);
                  }}
                >
                  ویرایش شماره
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
                تأیید و ورود به حساب
              </Button>
            </form>
          )}
        </div>
      ) : (
        /* Password Form */
        <form action={formAction} className="flex flex-col gap-5">
          <input type="hidden" name="mode" value={pwMode} />
          <input type="hidden" name="next" value={destination} />

          <Tabs value={pwMode} onValueChange={(v) => setPwMode(v as "phone" | "email")}>
            <TabsList className="w-full">
              <TabsTrigger value="phone" className="flex-1 text-xs">
                موبایل
              </TabsTrigger>
              <TabsTrigger value="email" className="flex-1 text-xs">
                ایمیل
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {pwMode === "phone" ? (
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
                value={pwPhone}
                onChange={(e) => setPwPhone(e.target.value)}
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
                value={pwEmail}
                onChange={(e) => setPwEmail(e.target.value)}
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
              value={pwPassword}
              onChange={(e) => setPwPassword(e.target.value)}
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
      )}

      <Separator />

      {/* Demo shortcuts */}
      <div className="flex flex-col gap-3.5 rounded-xl border border-line bg-surface/50 p-4">
        <span className="text-[0.66rem] tracking-[0.18em] text-mute">حساب‌های آزمایشی جهت بررسی سریع</span>

        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-2 text-[0.68rem] text-smoke">
            <UserRound className="size-3.5 text-mute" />
            <span className="text-mute">مشتری (OTP):</span>
            <span className="tnum rounded border border-line px-2 py-0.5" dir="ltr">
              {DEMO_CREDENTIALS.phone}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="ms-auto h-7 px-3 text-[0.66rem]"
              onClick={() => fillDemo("customer")}
            >
              انتخاب مشتری
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[0.68rem] text-smoke">
            <ShieldCheck className="size-3.5 text-mute" />
            <span className="text-mute">مدیر بوتیک:</span>
            <span className="rounded border border-line px-2 py-0.5" dir="ltr">
              {ADMIN_CREDENTIALS.email}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="ms-auto h-7 px-3 text-[0.66rem]"
              onClick={() => fillDemo("admin")}
            >
              پر کردن مدیر
            </Button>
          </div>
        </div>

        <span className="text-[0.64rem] leading-6 text-mute">
          کد تأیید ارسال‌شده در محیط لوکال بلافاصله در ترمینال سرور نمایش داده می‌شود.
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
        پشتیبانی بوتیک: <span className="tnum">{toPersianDigits("02191002233")}</span>
      </p>
    </div>
  );
}
