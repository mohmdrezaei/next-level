"use client";

import * as React from "react";
import { Check, GripVertical, Plus, Save, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/controls";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SetCollage } from "@/features/sets/components/set-collage";
import { createSetAction, updateSetAction } from "../actions";
import type { SetInput } from "../actions";
import type { CategorySlug, Product } from "@/features/products/types";
import type { ProductSet } from "@/features/sets/types";
import { formatNumber, toPersianDigits } from "@/lib/format";
import { mediaClassFor } from "@/lib/media";
import { cn, slugify } from "@/lib/utils";
import { CATEGORY_MAP } from "@/features/products/data/catalog";

const OCCASIONS = ["اداری", "شهری", "آخر هفته", "نیمه‌رسمی", "مهمانی شب", "زمستانی", "تابستانی", "همه‌کاره"];
const SEASONS = ["چهارفصل", "بهار", "تابستان", "پاییز", "زمستان", "بهار و تابستان", "پاییز و زمستان"];

const ROLE_SUGGESTIONS = [
  "رویه",
  "کت",
  "کت‌وشلوار",
  "پیراهن",
  "بافت",
  "شلوار",
  "کفش",
  "بوت",
  "کیف",
  "کمربند",
  "شال",
  "اکسسوری",
];

const PRESET_ACCENTS = ["#c8a24c", "#a9713b", "#8f6f1c", "#6c9bd1", "#b06a8a", "#6a8f6f"];

const EMPTY_SET: SetInput = {
  slug: "",
  title: "",
  latinTitle: "",
  subtitle: "",
  description: "",
  occasion: "شهری",
  season: "چهارفصل",
  discountRate: 0.1,
  featured: false,
  accent: "#c8a24c",
  items: [],
};

function toInput(set: ProductSet | null): SetInput {
  if (!set) return EMPTY_SET;
  return {
    slug: set.slug,
    title: set.title,
    latinTitle: set.latinTitle,
    subtitle: set.subtitle,
    description: set.description,
    occasion: set.occasion,
    season: set.season,
    discountRate: set.discountRate,
    featured: set.featured,
    accent: set.accent,
    items: set.items.map((item) => ({ ...item })),
  };
}

export function SetForm({ set, products }: { set: ProductSet | null; products: Product[] }) {
  const [input, setInput] = React.useState<SetInput>(() => toInput(set));
  const [saving, setSaving] = React.useState(false);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [roleDraft, setRoleDraft] = React.useState("");

  const setField = <K extends keyof SetInput>(key: K, value: SetInput[K]) =>
    setInput((state) => ({ ...state, [key]: value }));

  const productById = React.useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  const chosen = input.items
    .map((item) => ({ item, product: productById.get(item.productId) }))
    .filter((entry): entry is { item: { productId: string; role: string }; product: Product } =>
      Boolean(entry.product),
    );

  const subtotal = chosen.reduce((sum, entry) => sum + entry.product.price, 0);
  const discount = Math.round(subtotal * input.discountRate);

  const addProduct = (product: Product) => {
    if (input.items.some((item) => item.productId === product.id)) {
      toast.error("این قطعه از قبل در ست هست.");
      return;
    }
    setField("items", [...input.items, { productId: product.id, role: "قطعه" }]);
  };

  const removeAt = (index: number) =>
    setField(
      "items",
      input.items.filter((_, position) => position !== index),
    );

  const moveAt = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= input.items.length) return;
    const next = [...input.items];
    const [entry] = next.splice(index, 1);
    next.splice(target, 0, entry);
    setField("items", next);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);

    const payload: SetInput = {
      ...input,
      slug: input.slug || slugify(input.latinTitle || input.title),
    };

    const result = set ? await updateSetAction(set.slug, payload) : await createSetAction(payload);

    setSaving(false);

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    setInput(payload);
  };

  const available = products.filter(
    (product) => !input.items.some((item) => item.productId === product.id),
  );

  return (
    <form onSubmit={submit} className="grid gap-7 xl:grid-cols-[1.6fr_1fr]">
      <div className="flex flex-col gap-7">
        {/* Identity */}
        <Card>
          <CardHeader className="flex flex-col gap-1">
            <CardTitle>اطلاعات ست</CardTitle>
            <CardDescription>عنوان، موقعیت و توضیح این ترکیب</CardDescription>
          </CardHeader>

          <CardContent className="grid gap-5 sm:grid-cols-2">
            <Field label="عنوان ست" required>
              <Input
                value={input.title}
                onChange={(event) => setField("title", event.target.value)}
                placeholder="مثلاً ست اداری میلانو"
                required
              />
            </Field>

            <Field label="عنوان لاتین">
              <Input
                value={input.latinTitle}
                onChange={(event) => setField("latinTitle", event.target.value)}
                placeholder="Office Milano"
                dir="ltr"
                className="text-start"
              />
            </Field>

            <Field label="نامک (slug)" hint="خالی بگذارید تا خودکار ساخته شود">
              <Input
                value={input.slug}
                onChange={(event) => setField("slug", event.target.value)}
                placeholder="office-milano"
                dir="ltr"
                className="text-start"
              />
            </Field>

            <Field label="درصد تخفیف مجموعه‌ای" required hint="عددی بین ۰ تا ۵۰">
              <Input
                type="number"
                min={0}
                max={50}
                step={1}
                value={Math.round(input.discountRate * 100)}
                onChange={(event) => setField("discountRate", Number(event.target.value) / 100)}
                dir="ltr"
                className="text-start"
              />
            </Field>

            <Field label="موقعیت استفاده">
              <Select value={input.occasion} onValueChange={(value) => setField("occasion", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OCCASIONS.map((occasion) => (
                    <SelectItem key={occasion} value={occasion}>
                      {occasion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="فصل">
              <Select value={input.season} onValueChange={(value) => setField("season", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEASONS.map((season) => (
                    <SelectItem key={season} value={season}>
                      {season}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <div className="sm:col-span-2">
              <Field label="زیرعنوان" hint="یک خط کوتاه که قطعات ست را معرفی می‌کند">
                <Input
                  value={input.subtitle}
                  onChange={(event) => setField("subtitle", event.target.value)}
                  placeholder="کت‌وشلوار میلانو، پیراهن آکسفورد، کفش و کمربند چرم"
                />
              </Field>
            </div>

            <div className="sm:col-span-2">
              <Field label="توضیحات کامل">
                <Textarea
                  value={input.description}
                  onChange={(event) => setField("description", event.target.value)}
                  placeholder="چرا این قطعات با هم هماهنگ‌اند و در چه موقعیتی بهترین نتیجه را می‌دهند…"
                  className="min-h-28"
                />
              </Field>
            </div>

            <div className="flex items-end sm:col-span-2">
              <label className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-md border border-line bg-surface/60 px-4 py-3.5 text-xs text-smoke">
                نمایش به‌عنوان ست منتخب
                <Switch
                  checked={input.featured}
                  onCheckedChange={(checked) => setField("featured", checked)}
                />
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Pieces */}
        <Card>
          <CardHeader className="flex flex-col gap-1">
            <CardTitle>قطعات این ست</CardTitle>
            <CardDescription>
              ترتیب قطعات، ترتیب نمایش در کلاژ است. هر قطعه یک نقش هم دارد که در کارت ست دیده می‌شود.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-5">
            {chosen.length ? (
              <ul className="flex flex-col gap-3">
                {chosen.map((entry, index) => (
                  <li
                    key={entry.product.id}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-line p-3"
                  >
                    <span className="grid size-8 shrink-0 place-items-center text-mute">
                      <GripVertical className="size-4" />
                    </span>

                    <span className="size-12 shrink-0 overflow-hidden rounded-md border border-line bg-carbon">
                      <img
                        src={entry.product.images[0]?.src}
                        alt=""
                        className={cn(
                          "size-full object-cover",
                          mediaClassFor(entry.product.images[0]?.src),
                        )}
                      />
                    </span>

                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-xs text-ivory">{entry.product.name}</span>
                      <span className="text-[0.62rem] text-mute">
                        {CATEGORY_MAP[entry.product.category]?.title} ·{" "}
                        {formatNumber(entry.product.price)} تومان
                      </span>
                    </span>

                    <Input
                      value={entry.item.role}
                      onChange={(event) => {
                        const next = [...input.items];
                        next[index] = { ...next[index], role: event.target.value };
                        setField("items", next);
                      }}
                      list="set-role-suggestions"
                      placeholder="نقش"
                      className="h-9 w-28 shrink-0 text-[0.7rem]"
                    />

                    <span className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveAt(index, -1)}
                        disabled={index === 0}
                        aria-label="جابه‌جایی به بالا"
                        className="grid size-8 place-items-center rounded-md text-mute transition-colors duration-300 hover:bg-ivory/[0.06] hover:text-ivory disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveAt(index, 1)}
                        disabled={index === chosen.length - 1}
                        aria-label="جابه‌جایی به پایین"
                        className="grid size-8 place-items-center rounded-md text-mute transition-colors duration-300 hover:bg-ivory/[0.06] hover:text-ivory disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeAt(index)}
                        aria-label="حذف قطعه"
                        className="grid size-8 place-items-center rounded-md text-mute transition-colors duration-300 hover:bg-danger/10 hover:text-danger"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-xl border border-dashed border-line py-10 text-center text-xs text-mute">
                هنوز قطعه‌ای اضافه نشده. حداقل دو قطعه برای ساخت ست لازم است.
              </p>
            )}

            <datalist id="set-role-suggestions">
              {ROLE_SUGGESTIONS.map((role) => (
                <option key={role} value={role} />
              ))}
            </datalist>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" variant="subtle" size="sm" onClick={() => setPickerOpen((v) => !v)}>
                <Plus className="size-3.5" />
                افزودن قطعه از فروشگاه
              </Button>

              <span className="tnum text-[0.68rem] text-mute">
                {toPersianDigits(chosen.length)} قطعه انتخاب‌شده
              </span>
            </div>

            {pickerOpen ? (
              <div className="flex max-h-80 flex-col gap-2 overflow-y-auto rounded-xl border border-line p-3">
                <div className="flex items-center gap-2 pb-2">
                  <Input
                    value={roleDraft}
                    onChange={(event) => setRoleDraft(event.target.value)}
                    placeholder="جست‌وجوی نام محصول…"
                    className="h-9 text-xs"
                  />
                </div>

                {available
                  .filter((product) =>
                    roleDraft
                      ? `${product.name} ${product.latinName}`
                          .toLowerCase()
                          .includes(roleDraft.trim().toLowerCase())
                      : true,
                  )
                  .slice(0, 40)
                  .map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => addProduct(product)}
                      className="flex items-center gap-3 rounded-lg border border-transparent p-2 text-start transition-colors duration-200 hover:border-line hover:bg-ivory/[0.03]"
                    >
                      <span className="size-10 shrink-0 overflow-hidden rounded-md border border-line bg-carbon">
                        <img
                          src={product.images[0]?.src}
                          alt=""
                          loading="lazy"
                          className={cn(
                            "size-full object-cover",
                            mediaClassFor(product.images[0]?.src),
                          )}
                        />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate text-xs text-ivory">{product.name}</span>
                        <span className="text-[0.6rem] text-mute">
                          {CATEGORY_MAP[product.category as CategorySlug]?.title} ·{" "}
                          {formatNumber(product.price)} تومان
                        </span>
                      </span>
                      <Plus className="size-4 shrink-0 text-gold" />
                    </button>
                  ))}

                {available.length === 0 ? (
                  <p className="py-6 text-center text-xs text-mute">
                    همه محصولات به این ست اضافه شده‌اند.
                  </p>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Preview + submit */}
      <div className="flex flex-col gap-5 xl:sticky xl:top-28 xl:h-fit">
        <Card>
          <CardHeader className="flex flex-col gap-1">
            <CardTitle>پیش‌نمایش ست</CardTitle>
            <CardDescription>نمای تقریبی کارت ست در صفحه «ست‌ها»</CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            <div className="overflow-hidden rounded-xl border border-line">
              {chosen.length >= 2 ? (
                <SetCollage
                  items={chosen.map((entry) => ({
                    role: entry.item.role,
                    product: entry.product,
                  }))}
                  title={input.title || "ست جدید"}
                  interactive={false}
                />
              ) : (
                <span className="grid aspect-4/3 place-items-center text-[0.68rem] text-mute">
                  برای پیش‌نمایش، حداقل دو قطعه اضافه کنید
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[0.62rem] tracking-[0.18em] text-mute uppercase">
                {input.latinTitle || "Latin Title"}
              </span>
              <span className="text-sm text-ivory">{input.title || "عنوان ست"}</span>
              <span className="text-[0.68rem] leading-6 text-mute">
                {input.subtitle || "زیرعنوان ست اینجا نمایش داده می‌شود."}
              </span>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Badge tone="neutral" size="sm">
                  {input.occasion}
                </Badge>
                <Badge tone="outline" size="sm">
                  {input.season}
                </Badge>
                <Badge tone="success" size="sm" className="tnum">
                  {toPersianDigits(Math.round(input.discountRate * 100))}٪
                </Badge>
              </div>

              <div className="mt-2 flex items-baseline gap-3 border-t border-line pt-3">
                <span className="tnum text-sm font-semibold text-gold-soft">
                  {formatNumber(Math.max(0, subtotal - discount))}
                  <span className="ms-1 text-[0.58rem] font-normal text-mute">تومان</span>
                </span>
                {discount > 0 ? (
                  <span className="tnum text-[0.65rem] text-mute line-through">
                    {formatNumber(subtotal)}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[0.68rem] text-mute">رنگ تأکید ست</span>
              <div className="flex flex-wrap items-center gap-2">
                {PRESET_ACCENTS.map((accent) => (
                  <button
                    key={accent}
                    type="button"
                    onClick={() => setField("accent", accent)}
                    aria-label={`انتخاب رنگ ${accent}`}
                    className="grid size-8 place-items-center rounded-full border transition-transform duration-200 hover:scale-105"
                    style={{
                      backgroundColor: accent,
                      borderColor: input.accent === accent ? "var(--color-ivory)" : "transparent",
                    }}
                  >
                    {input.accent === accent ? (
                      <Check className="size-4 text-ink" strokeWidth={3} />
                    ) : null}
                  </button>
                ))}

                <input
                  type="color"
                  value={input.accent}
                  onChange={(event) => setField("accent", event.target.value)}
                  aria-label="رنگ تأکید سفارشی"
                  className="size-8 cursor-pointer rounded-full border border-line bg-surface"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-3 rounded-xl border border-line bg-surface/50 p-5"
        >
          <Button type="submit" variant="gold" size="lg" loading={saving}>
            <Save className="size-4" />
            {set ? "ذخیره تغییرات" : "ایجاد ست"}
          </Button>

          <p className="text-[0.62rem] leading-5 text-mute">
            تغییرات بلافاصله در فروشگاه اعمال می‌شود؛ قیمت ست از جمع قیمت قطعات و درصد تخفیف محاسبه
            می‌گردد.
          </p>
        </motion.div>
      </div>
    </form>
  );
}
