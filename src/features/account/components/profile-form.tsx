"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/controls";
import { formatNumber, maskPhone, toPersianDigits } from "@/lib/format";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import type { SessionUser } from "@/features/auth/types";

interface Profile {
  name: string;
  email: string;
  phone: string;
  birthday: string;
  gender: "male" | "female" | "unspecified";
}

export function ProfileForm({
  user,
  totalOrders,
  totalSpent,
}: {
  user: SessionUser;
  totalOrders: number;
  totalSpent: number;
}) {
  const router = useRouter();
  const [values, setValues] = React.useState<Profile>({
    name: user.name,
    email: user.email,
    phone: user.phone,
    birthday: "",
    gender: "unspecified",
  });
  const [errors, setErrors] = React.useState<Partial<Record<keyof Profile, string>>>({});
  const [savingProfile, setSavingProfile] = React.useState(false);

  const [passwords, setPasswords] = React.useState({ current: "", next: "", confirm: "" });
  const [passwordErrors, setPasswordErrors] = React.useState<Record<string, string>>({});
  const [savingPassword, setSavingPassword] = React.useState(false);

  // The session only carries name/email/phone, so the extra profile fields
  // (birthday, gender) are hydrated from the account endpoint.
  React.useEffect(() => {
    let active = true;

    apiFetch<Profile>("/api/account/profile")
      .then((profile) => {
        if (!active) return;
        setValues((state) => ({
          ...state,
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          birthday: profile.birthday ?? "",
          gender: profile.gender ?? "unspecified",
        }));
      })
      .catch(() => {
        /* keep the session values as a fallback */
      });

    return () => {
      active = false;
    };
  }, []);

  const set = <K extends keyof Profile>(key: K, value: Profile[K]) => {
    setValues((state) => ({ ...state, [key]: value }));
    setErrors((state) => ({ ...state, [key]: undefined }));
  };

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    const next: Partial<Record<keyof Profile, string>> = {};
    if (values.name.trim().length < 3) next.name = "نام را کامل وارد کنید.";
    if (values.email && !/^\S+@\S+\.\S+$/.test(values.email)) next.email = "ایمیل معتبر نیست.";
    if (!/^0?9\d{9}$/.test(values.phone.replace(/[\s-]/g, "").replace(/^(\+98|98)/, "0")))
      next.phone = "شماره موبایل معتبر نیست.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSavingProfile(true);
    try {
      const saved = await apiFetch<Profile>("/api/account/profile", {
        method: "PATCH",
        body: values,
      });
      setValues((state) => ({ ...state, ...saved }));
      toast.success("اطلاعات حساب ذخیره شد");
      router.refresh();
    } catch (error) {
      if (error instanceof ApiClientError && error.field) {
        setErrors((state) => ({ ...state, [error.field as keyof Profile]: error.message }));
      }
      toast.error(error instanceof ApiClientError ? error.message : "ذخیره اطلاعات ناموفق بود.");
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (passwords.current.length < 6) next.current = "رمز فعلی را وارد کنید.";
    if (passwords.next.length < 6) next.next = "رمز جدید باید حداقل ۶ کاراکتر باشد.";
    if (passwords.next !== passwords.confirm) next.confirm = "تکرار رمز مطابقت ندارد.";
    setPasswordErrors(next);
    if (Object.keys(next).length) return;

    setSavingPassword(true);
    try {
      await apiFetch("/api/account/password", {
        method: "PUT",
        body: {
          current: passwords.current,
          next: passwords.next,
          confirm: passwords.confirm,
        },
      });
      setPasswords({ current: "", next: "", confirm: "" });
      toast.success("رمز عبور تغییر کرد");
    } catch (error) {
      if (error instanceof ApiClientError && error.field) {
        setPasswordErrors({ [error.field]: error.message });
      }
      toast.error(error instanceof ApiClientError ? error.message : "تغییر رمز ناموفق بود.");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="grid gap-7 xl:grid-cols-[1.4fr_1fr]">
      <Card>
        <CardHeader className="flex flex-col gap-1">
          <CardTitle>اطلاعات حساب</CardTitle>
          <CardDescription>
            این اطلاعات در فاکتورها و اطلاع‌رسانی سفارش استفاده می‌شود.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={saveProfile} className="grid gap-5 sm:grid-cols-2">
            <Field label="نام و نام خانوادگی" required error={errors.name}>
              <Input
                value={values.name}
                onChange={(event) => set("name", event.target.value)}
                data-invalid={errors.name ? "" : undefined}
              />
            </Field>

            <Field label="ایمیل" error={errors.email}>
              <Input
                value={values.email}
                onChange={(event) => set("email", event.target.value)}
                dir="ltr"
                className="text-start"
                data-invalid={errors.email ? "" : undefined}
              />
            </Field>

            <Field label="شماره موبایل" required error={errors.phone} hint={maskPhone(user.phone)}>
              <Input
                value={values.phone}
                onChange={(event) => set("phone", event.target.value)}
                dir="ltr"
                className="tnum text-start"
                data-invalid={errors.phone ? "" : undefined}
              />
            </Field>

            <Field label="تاریخ تولد" hint="برای هدیه تولد">
              <Input
                value={values.birthday}
                onChange={(event) => set("birthday", event.target.value)}
                className="tnum"
                placeholder="۱۳۷۰/۰۵/۱۲"
              />
            </Field>

            <div className="sm:col-span-2">
              <span className="mb-3 block text-xs font-medium text-smoke">جنسیت</span>
              <RadioGroup
                value={values.gender}
                onValueChange={(value) => set("gender", value as Profile["gender"])}
                className="flex flex-wrap gap-3"
              >
                {[
                  { value: "male", label: "آقا" },
                  { value: "female", label: "خانم" },
                  { value: "unspecified", label: "ترجیح می‌دهم نگویم" },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={
                      values.gender === option.value
                        ? "flex cursor-pointer items-center gap-3 rounded-lg border border-gold/45 bg-gold/[0.06] px-4 py-3 text-xs text-ivory"
                        : "flex cursor-pointer items-center gap-3 rounded-lg border border-line px-4 py-3 text-xs text-smoke transition-colors duration-300 hover:border-ivory/25"
                    }
                  >
                    <RadioGroupItem value={option.value} />
                    {option.label}
                  </label>
                ))}
              </RadioGroup>
            </div>

            <div className="sm:col-span-2">
              <Button type="submit" variant="gold" size="md" loading={savingProfile}>
                <Save className="size-4" />
                ذخیره اطلاعات
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-7">
        <Card>
          <CardHeader className="flex flex-col gap-1">
            <CardTitle>خلاصه فعالیت</CardTitle>
            <CardDescription>نمای کوتاه از حساب شما</CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-mute">سطح باشگاه</span>
              <Badge tone="gold">
                {totalSpent > 60_000_000 ? "طلایی" : totalSpent > 25_000_000 ? "نقره‌ای" : "برنز"}
              </Badge>
            </div>

            <Separator />

            <dl className="flex flex-col gap-3 text-xs">
              <div className="flex items-center justify-between">
                <dt className="text-mute">تعداد سفارش‌ها</dt>
                <dd className="tnum text-ivory">{toPersianDigits(totalOrders)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-mute">مجموع خرید</dt>
                <dd className="tnum text-ivory">{formatNumber(totalSpent)} تومان</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-mute">وضعیت حساب</dt>
                <dd className="flex items-center gap-2 text-success">
                  <ShieldCheck className="size-3.5" />
                  تأییدشده
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-1">
            <CardTitle>تغییر رمز عبور</CardTitle>
            <CardDescription>برای امنیت بیشتر هر ۳ ماه رمز را تغییر دهید</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={savePassword} className="flex flex-col gap-5">
              <Field label="رمز فعلی" required error={passwordErrors.current}>
                <Input
                  type="password"
                  value={passwords.current}
                  onChange={(event) =>
                    setPasswords((state) => ({ ...state, current: event.target.value }))
                  }
                  data-invalid={passwordErrors.current ? "" : undefined}
                />
              </Field>

              <Field label="رمز جدید" required error={passwordErrors.next} hint="حداقل ۶ کاراکتر">
                <Input
                  type="password"
                  value={passwords.next}
                  onChange={(event) =>
                    setPasswords((state) => ({ ...state, next: event.target.value }))
                  }
                  data-invalid={passwordErrors.next ? "" : undefined}
                />
              </Field>

              <Field label="تکرار رمز جدید" required error={passwordErrors.confirm}>
                <Input
                  type="password"
                  value={passwords.confirm}
                  onChange={(event) =>
                    setPasswords((state) => ({ ...state, confirm: event.target.value }))
                  }
                  data-invalid={passwordErrors.confirm ? "" : undefined}
                />
              </Field>

              <Button type="submit" variant="subtle" size="md" loading={savingPassword}>
                <KeyRound className="size-4" />
                تغییر رمز عبور
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
