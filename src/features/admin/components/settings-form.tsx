"use client";

import * as React from "react";
import { Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem, Switch } from "@/components/ui/controls";
import { Separator } from "@/components/ui/separator";
import { SITE, FREE_SHIPPING_THRESHOLD, TAX_RATE } from "@/lib/constants";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { toPersianDigits } from "@/lib/format";
import { updateClientStoreSettings } from "@/lib/hooks/use-store-settings";

interface Settings {
  name: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  freeShipping: number;
  taxRate: number;
  standardShipping: number;
  expressShipping: number;
  enableWallet: boolean;
  enableCod: boolean;
  enableReviews: boolean;
  defaultOrder: "featured" | "newest" | "price-asc";
}

const DEFAULTS: Settings = {
  name: SITE.name,
  tagline: SITE.tagline,
  phone: SITE.phone,
  email: SITE.email,
  address: SITE.address,
  freeShipping: FREE_SHIPPING_THRESHOLD,
  taxRate: TAX_RATE * 100,
  standardShipping: 149_000,
  expressShipping: 349_000,
  enableWallet: true,
  enableCod: false,
  enableReviews: true,
  defaultOrder: "featured",
};

export function SettingsForm() {
  const [values, setValues] = React.useState<Settings>(DEFAULTS);
  const [saving, setSaving] = React.useState(false);
  const [resetting, setResetting] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  // Hydrate from the database so the form shows what the store actually uses.
  React.useEffect(() => {
    let active = true;

    apiFetch<Settings>("/api/settings")
      .then((settings) => {
        if (active) setValues((state) => ({ ...state, ...settings }));
      })
      .catch(() => {
        if (active) toast.error("خواندن تنظیمات از سرور ناموفق بود.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setValues((state) => ({ ...state, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);

    try {
      const saved = await apiFetch<Settings>("/api/settings", { method: "PUT", body: values });
      setValues((state) => ({ ...state, ...saved }));
      updateClientStoreSettings(saved);
      toast.success("تنظیمات فروشگاه ذخیره شد", {
        description: "تغییرات روی محاسبه سفارش‌های جدید و بخش‌های سایت اعمال شد.",
      });
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : "ذخیره تنظیمات ناموفق بود.");
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    setResetting(true);
    try {
      const defaults = await apiFetch<Settings>("/api/settings", { method: "DELETE" });
      setValues((state) => ({ ...state, ...defaults }));
      updateClientStoreSettings(defaults);
      toast("تنظیمات به حالت پیش‌فرض بازگشت.");
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : "بازگردانی پیش‌فرض ناموفق بود.");
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return <div className="h-96 animate-pulse rounded-2xl border border-line bg-surface/40" />;
  }

  return (
    <form onSubmit={submit} className="grid gap-7 xl:grid-cols-2">
      {/* Store identity */}
      <Card>
        <CardHeader className="flex flex-col gap-1">
          <CardTitle>اطلاعات فروشگاه</CardTitle>
          <CardDescription>در فوتر، صفحه تماس و فاکتورها استفاده می‌شود</CardDescription>
        </CardHeader>

        <CardContent className="grid gap-5 sm:grid-cols-2">
          <Field label="نام فروشگاه" required>
            <Input value={values.name} onChange={(event) => set("name", event.target.value)} />
          </Field>

          <Field label="شعار">
            <Input value={values.tagline} onChange={(event) => set("tagline", event.target.value)} />
          </Field>

          <Field label="شماره تماس" required>
            <Input
              value={values.phone}
              onChange={(event) => set("phone", event.target.value)}
              className="tnum"
            />
          </Field>

          <Field label="ایمیل پشتیبانی" required>
            <Input
              value={values.email}
              onChange={(event) => set("email", event.target.value)}
              dir="ltr"
              className="text-start"
            />
          </Field>

          <Field label="نشانی بوتیک" className="sm:col-span-2">
            <Textarea
              value={values.address}
              onChange={(event) => set("address", event.target.value)}
              className="min-h-20"
            />
          </Field>
        </CardContent>
      </Card>

      {/* Shipping & tax */}
      <Card>
        <CardHeader className="flex flex-col gap-1">
          <CardTitle>ارسال و مالیات</CardTitle>
          <CardDescription>مبنای محاسبه مبلغ نهایی سفارش</CardDescription>
        </CardHeader>

        <CardContent className="grid gap-5 sm:grid-cols-2">
          <Field label="سقف ارسال رایگان (تومان)" hint="مبالغ بالاتر از این مقدار رایگان ارسال می‌شوند">
            <Input
              type="number"
              step={100000}
              value={values.freeShipping}
              onChange={(event) => set("freeShipping", Number(event.target.value))}
              dir="ltr"
              className="text-start"
            />
          </Field>

          <Field label="نرخ مالیات (٪)">
            <Input
              type="number"
              step={0.5}
              value={values.taxRate}
              onChange={(event) => set("taxRate", Number(event.target.value))}
              dir="ltr"
              className="text-start"
            />
          </Field>

          <Field label="هزینه ارسال استاندارد (تومان)">
            <Input
              type="number"
              step={10000}
              value={values.standardShipping}
              onChange={(event) => set("standardShipping", Number(event.target.value))}
              dir="ltr"
              className="text-start"
            />
          </Field>

          <Field label="هزینه ارسال سریع (تومان)">
            <Input
              type="number"
              step={10000}
              value={values.expressShipping}
              onChange={(event) => set("expressShipping", Number(event.target.value))}
              dir="ltr"
              className="text-start"
            />
          </Field>

          <div className="sm:col-span-2">
            <p className="rounded-md border border-line bg-surface/50 p-3.5 text-[0.68rem] leading-6 text-mute">
              در حال حاضر سفارش‌های بالای{" "}
              <span className="tnum text-ivory">
                {toPersianDigits(new Intl.NumberFormat("en-US").format(values.freeShipping))}
              </span>{" "}
              تومان رایگان ارسال می‌شوند و مالیات{" "}
              <span className="tnum text-ivory">{toPersianDigits(values.taxRate)}</span>٪ روی مبلغ
              پس از تخفیف محاسبه می‌شود.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Payment */}
      <Card>
        <CardHeader className="flex flex-col gap-1">
          <CardTitle>روش‌های پرداخت</CardTitle>
          <CardDescription>گزینه‌هایی که در صفحه پرداخت نمایش داده می‌شوند</CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-5">
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-line p-4 text-xs text-smoke">
            <span className="flex flex-col gap-1">
              <span className="text-ivory">کیف پول Next Level</span>
              <span className="text-[0.62rem] text-mute">پرداخت از موجودی کیف پول کاربران</span>
            </span>
            <Switch
              checked={values.enableWallet}
              onCheckedChange={(checked) => set("enableWallet", checked)}
            />
          </label>

          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-line p-4 text-xs text-smoke">
            <span className="flex flex-col gap-1">
              <span className="text-ivory">پرداخت در محل</span>
              <span className="text-[0.62rem] text-mute">فقط برای تهران و کرج</span>
            </span>
            <Switch
              checked={values.enableCod}
              onCheckedChange={(checked) => set("enableCod", checked)}
            />
          </label>

          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-line p-4 text-xs text-smoke">
            <span className="flex flex-col gap-1">
              <span className="text-ivory">ثبت نظرات مشتریان</span>
              <span className="text-[0.62rem] text-mute">نمایش فرم نظر در صفحه محصول</span>
            </span>
            <Switch
              checked={values.enableReviews}
              onCheckedChange={(checked) => set("enableReviews", checked)}
            />
          </label>
        </CardContent>
      </Card>

      {/* Shop defaults */}
      <Card>
        <CardHeader className="flex flex-col gap-1">
          <CardTitle>پیش‌فرض‌های فروشگاه</CardTitle>
          <CardDescription>ترتیب پیش‌فرض نمایش محصولات</CardDescription>
        </CardHeader>

        <CardContent>
          <RadioGroup
            value={values.defaultOrder}
            onValueChange={(value) =>
              set("defaultOrder", value as Settings["defaultOrder"])
            }
            className="gap-3"
          >
            {[
              { value: "featured", label: "پیشنهاد Next Level", hint: "محصولات منتخب و امتیاز بالا" },
              { value: "newest", label: "جدیدترین", hint: "بر اساس تاریخ افزودن" },
              { value: "price-asc", label: "ارزان‌ترین", hint: "از کم‌ترین قیمت" },
            ].map((option) => (
              <label
                key={option.value}
                className={
                  values.defaultOrder === option.value
                    ? "flex cursor-pointer items-center gap-4 rounded-lg border border-gold/45 bg-gold/[0.06] p-4"
                    : "flex cursor-pointer items-center gap-4 rounded-lg border border-line p-4 transition-colors duration-300 hover:border-ivory/25"
                }
              >
                <RadioGroupItem value={option.value} />
                <span className="flex flex-col gap-1">
                  <span className="text-xs text-ivory">{option.label}</span>
                  <span className="text-[0.62rem] text-mute">{option.hint}</span>
                </span>
              </label>
            ))}
          </RadioGroup>

          <Separator className="my-6" />

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" variant="gold" size="md" loading={saving}>
              <Save className="size-4" />
              ذخیره تنظیمات
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="md"
              loading={resetting}
              onClick={reset}
            >
              <RotateCcw className="size-4" />
              بازگردانی پیش‌فرض
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
