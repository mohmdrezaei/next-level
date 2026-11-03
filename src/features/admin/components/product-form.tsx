"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Image as ImageIcon,
  ImagePlus,
  Link2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/shared/price";
import { Switch } from "@/components/ui/controls";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/controls";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES } from "@/features/products/data/catalog";
import { createProductAction, updateProductAction } from "../actions";
import type { ProductInput } from "../actions";
import type { CategorySlug, Product, ProductBadge } from "@/features/products/types";
import { toPersianDigits } from "@/lib/format";
import { mediaClassFor } from "@/lib/media";
import { cn, slugify } from "@/lib/utils";

const SIZE_OPTIONS: Record<"clothing" | "shoe" | "one", string[]> = {
  clothing: ["S", "M", "L", "XL", "XXL"],
  shoe: ["40", "41", "42", "43", "44", "45"],
  one: ["ONE"],
};

const BADGE_OPTIONS: { value: ProductBadge; label: string }[] = [
  { value: "new", label: "جدید" },
  { value: "limited", label: "تیراژ محدود" },
  { value: "bestseller", label: "پرفروش" },
  { value: "sale", label: "تخفیف" },
];

const PRESET_COLORS = [
  { name: "مشکی", hex: "#141418" },
  { name: "زغالی", hex: "#2b2b31" },
  { name: "سرمه‌ای", hex: "#232a3c" },
  { name: "شتری", hex: "#a9855c" },
  { name: "سفید", hex: "#f2efe9" },
  { name: "زیتونی", hex: "#4a4a37" },
];

function sizeGroupFor(category: CategorySlug): keyof typeof SIZE_OPTIONS {
  if (category === "footwear") return "shoe";
  if (category === "accessories") return "one";
  return "clothing";
}

function toInput(product: Product | null): ProductInput {
  if (!product) {
    return {
      name: "",
      latinName: "",
      slug: "",
      category: "shirts",
      price: 0,
      compareAtPrice: null,
      shortDescription: "",
      description: "",
      materials: [],
      highlights: [],
      colors: [{ name: "زغالی", hex: "#2b2b31" }],
      sizes: ["S", "M", "L", "XL"],
      badges: [],
      stock: 20,
      featured: false,
      images: [],
    };
  }

  return {
    name: product.name,
    latinName: product.latinName,
    slug: product.slug,
    category: product.category,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    shortDescription: product.shortDescription,
    description: product.description,
    materials: product.materials,
    highlights: product.highlights,
    colors: product.colors.map((color) => ({ name: color.name, hex: color.hex })),
    sizes: product.variants.map((variant) => variant.size),
    badges: product.badges,
    stock: product.variants.reduce((sum, variant) => sum + variant.stock, 0),
    featured: product.featured,
    images: product.images.map((image) => ({ src: image.src, alt: image.alt })),
  };
}

const linesToArray = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const MAX_UPLOAD_BYTES = 1_500_000;

/** Move an item within a list, returning a new array. */
function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function ProductForm({ product }: { product: Product | null }) {
  const router = useRouter();
  const [input, setInput] = React.useState<ProductInput>(() => toInput(product));
  const [materialsText, setMaterialsText] = React.useState(() => toInput(product).materials.join("\n"));
  const [highlightsText, setHighlightsText] = React.useState(() =>
    toInput(product).highlights.join("\n"),
  );
  const [saving, setSaving] = React.useState(false);
  const [imageUrl, setImageUrl] = React.useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const set = <K extends keyof ProductInput>(key: K, value: ProductInput[K]) =>
    setInput((state) => ({ ...state, [key]: value }));

  /* ---------------------------- image management --------------------------- */

  const addImage = (src: string) => {
    const trimmed = src.trim();
    if (!trimmed) return;
    if (input.images.some((image) => image.src === trimmed)) {
      toast.error("این تصویر از قبل اضافه شده است.");
      return;
    }
    set("images", [...input.images, { src: trimmed, alt: input.name || "تصویر محصول" }]);
    setImageUrl("");
  };

  /** Read a picked file as a data URL so it can be stored with the product. */
  const onPickFiles = (files: FileList | null) => {
    if (!files?.length) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`«${file.name}» یک تصویر نیست.`);
        return;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        toast.error(`حجم «${file.name}» بیش از ۱.۵ مگابایت است.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") addImage(reader.result);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const sizeOptions = SIZE_OPTIONS[sizeGroupFor(input.category)];

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);

    const payload: ProductInput = {
      ...input,
      slug: input.slug || slugify(input.latinName || input.name),
      materials: linesToArray(materialsText),
      highlights: linesToArray(highlightsText),
    };

    const result = product
      ? await updateProductAction(product.id, payload)
      : await createProductAction(payload);

    setSaving(false);

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    router.push("/admin/products");
    router.refresh();
  };

  const previewImages = input.images;

  return (
    <form onSubmit={submit} className="grid gap-7 xl:grid-cols-[1.6fr_1fr]">
      <div className="flex flex-col gap-7">
        {/* Identity */}
        <Card>
          <CardHeader className="flex flex-col gap-1">
            <CardTitle>اطلاعات پایه</CardTitle>
            <CardDescription>نام، دسته‌بندی و قیمت‌گذاری قطعه</CardDescription>
          </CardHeader>

          <CardContent className="grid gap-5 sm:grid-cols-2">
            <Field label="نام محصول" required>
              <Input
                value={input.name}
                onChange={(event) => set("name", event.target.value)}
                placeholder="مثلاً پالتو کشمیر مونته"
                required
              />
            </Field>

            <Field label="نام لاتین" hint="روی برچسب و جست‌وجو استفاده می‌شود">
              <Input
                value={input.latinName}
                onChange={(event) => set("latinName", event.target.value)}
                placeholder="Monte Cashmere Coat"
                dir="ltr"
                className="text-start"
              />
            </Field>

            <Field label="نامک (slug)" hint="خالی بگذارید تا خودکار ساخته شود">
              <Input
                value={input.slug}
                onChange={(event) => set("slug", event.target.value)}
                placeholder="monte-cashmere-coat"
                dir="ltr"
                className="text-start"
              />
            </Field>

            <Field label="دسته‌بندی" required>
              <Select
                value={input.category}
                onValueChange={(value) => set("category", value as CategorySlug)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category.slug} value={category.slug}>
                      {category.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="قیمت (تومان)" required>
              <Input
                type="number"
                min={0}
                step={1000}
                value={input.price || ""}
                onChange={(event) => set("price", Number(event.target.value))}
                placeholder="18900000"
                dir="ltr"
                className="text-start"
                required
              />
            </Field>

            <Field label="قیمت پیش از تخفیف" hint="برای نمایش تخفیف">
              <Input
                type="number"
                min={0}
                step={1000}
                value={input.compareAtPrice ?? ""}
                onChange={(event) =>
                  set("compareAtPrice", event.target.value ? Number(event.target.value) : null)
                }
                placeholder="23500000"
                dir="ltr"
                className="text-start"
              />
            </Field>

            <Field label="موجودی کل" required hint="بین سایزها تقسیم می‌شود">
              <Input
                type="number"
                min={0}
                value={input.stock}
                onChange={(event) => set("stock", Number(event.target.value))}
                dir="ltr"
                className="text-start"
              />
            </Field>

            <div className="flex items-end">
              <label className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-md border border-line bg-surface/60 px-4 py-3.5 text-xs text-smoke">
                نمایش در بخش منتخب صفحه اصلی
                <Switch
                  checked={input.featured}
                  onCheckedChange={(checked) => set("featured", checked)}
                />
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Copy */}
        <Card>
          <CardHeader className="flex flex-col gap-1">
            <CardTitle>توضیحات</CardTitle>
            <CardDescription>متنی که در کارت محصول و صفحه جزئیات نمایش داده می‌شود</CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-5">
            <Field label="توضیح کوتاه" required hint="حداکثر یک خط">
              <Input
                value={input.shortDescription}
                onChange={(event) => set("shortDescription", event.target.value)}
                placeholder="پالتو کشمیر بلند با یقه انگلیسی…"
              />
            </Field>

            <Field label="توضیحات کامل">
              <Textarea
                value={input.description}
                onChange={(event) => set("description", event.target.value)}
                placeholder="جزئیات پارچه، دوخت و کاربرد قطعه…"
                className="min-h-32"
              />
            </Field>
          </CardContent>
        </Card>

        {/* Gallery */}
        <Card>
          <CardHeader className="flex flex-col gap-1">
            <CardTitle>تصاویر محصول</CardTitle>
            <CardDescription>
              گالری صفحه محصول. تصویر اول، تصویر اصلی کارت است. می‌توانید از رایانه بارگذاری کنید یا
              نشانی تصویر بدهید.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addImage(imageUrl);
                  }
                }}
                startIcon={<Link2 />}
                placeholder="https://… یا /products/name-1.svg"
                dir="ltr"
                className="text-start"
              />

              <div className="flex shrink-0 gap-2">
                <Button type="button" variant="subtle" size="md" onClick={() => addImage(imageUrl)}>
                  <Plus className="size-4" />
                  افزودن نشانی
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus className="size-4" />
                  بارگذاری
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => onPickFiles(event.target.files)}
              />
            </div>

            {input.images.length ? (
              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {input.images.map((image, index) => (
                  <li
                    key={`${image.src.slice(0, 48)}-${index}`}
                    className="group relative flex flex-col overflow-hidden rounded-lg border border-line bg-carbon"
                  >
                    <span className="relative block aspect-square overflow-hidden">
                      <img
                        src={image.src}
                        alt=""
                        className={cn("size-full object-cover", mediaClassFor(image.src))}
                      />

                      {index === 0 ? (
                        <Badge tone="gold" size="sm" className="absolute top-2 start-2">
                          تصویر اصلی
                        </Badge>
                      ) : null}
                    </span>

                    <span className="flex items-center justify-between gap-1 border-t border-line p-1.5">
                      <span className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => set("images", move(input.images, index, index - 1))}
                          disabled={index === 0}
                          aria-label="جابه‌جایی به جلو"
                          className="grid size-7 place-items-center rounded-md text-mute transition-colors duration-300 hover:bg-ivory/[0.06] hover:text-ivory disabled:opacity-30"
                        >
                          <ArrowUp className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => set("images", move(input.images, index, index + 1))}
                          disabled={index === input.images.length - 1}
                          aria-label="جابه‌جایی به عقب"
                          className="grid size-7 place-items-center rounded-md text-mute transition-colors duration-300 hover:bg-ivory/[0.06] hover:text-ivory disabled:opacity-30"
                        >
                          <ArrowDown className="size-3.5" />
                        </button>
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          set(
                            "images",
                            input.images.filter((_, position) => position !== index),
                          )
                        }
                        aria-label="حذف تصویر"
                        className="grid size-7 place-items-center rounded-md text-mute transition-colors duration-300 hover:bg-danger/10 hover:text-danger"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line py-10 text-mute transition-colors duration-300 hover:border-gold/35 hover:text-gold-soft"
              >
                <ImageIcon className="size-6" />
                <span className="text-[0.7rem]">
                  هنوز تصویری اضافه نشده — تا زمانی که تصویر اضافه کنید از طرح پیش‌فرض استفاده می‌شود.
                </span>
              </button>
            )}
          </CardContent>
        </Card>

        {/* Attributes */}
        <Card>
          <CardHeader className="flex flex-col gap-1">
            <CardTitle>مشخصات و سایزبندی</CardTitle>
            <CardDescription>هر مورد را در یک خط جدا وارد کنید</CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="ترکیب و پارچه">
                <Textarea
                  value={materialsText}
                  onChange={(event) => setMaterialsText(event.target.value)}
                  placeholder={"۱۰۰٪ پشم مرینو\nآستر ویسکوز"}
                />
              </Field>

              <Field label="ویژگی‌های دوخت">
                <Textarea
                  value={highlightsText}
                  onChange={(event) => setHighlightsText(event.target.value)}
                  placeholder={"دوخت ۱۰ بخیه در هر اینچ\nجیب داخلی دوتیکه"}
                />
              </Field>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-xs font-medium text-smoke">سایزهای موجود</span>
              <ToggleGroup
                type="multiple"
                value={input.sizes}
                onValueChange={(value) => set("sizes", value)}
                className="flex-wrap"
              >
                {sizeOptions.map((size) => (
                  <ToggleGroupItem key={size} value={size}>
                    {size === "ONE" ? "تک‌سایز" : size}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-xs font-medium text-smoke">برچسب‌ها</span>
              <ToggleGroup
                type="multiple"
                value={input.badges}
                onValueChange={(value) => set("badges", value as ProductBadge[])}
                className="flex-wrap"
              >
                {BADGE_OPTIONS.map((option) => (
                  <ToggleGroupItem key={option.value} value={option.value}>
                    {option.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            {/* Colours */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-smoke">رنگ‌ها</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    set("colors", [...input.colors, { name: "رنگ جدید", hex: "#8a8a8e" }])
                  }
                >
                  <Plus className="size-3.5" />
                  افزودن رنگ
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((preset) => (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => {
                      if (input.colors.some((color) => color.hex === preset.hex)) return;
                      set("colors", [...input.colors, preset]);
                    }}
                    className="inline-flex h-8 items-center gap-2 rounded-full border border-line px-3 text-[0.68rem] text-mute transition-colors duration-300 hover:border-ivory/25 hover:text-ivory"
                  >
                    <span
                      className="size-3 rounded-full border border-ivory/20"
                      style={{ backgroundColor: preset.hex }}
                    />
                    {preset.name}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-3">
                {input.colors.map((color, index) => (
                  <div key={`${color.hex}-${index}`} className="flex items-center gap-3">
                    <input
                      type="color"
                      value={color.hex}
                      onChange={(event) => {
                        const next = [...input.colors];
                        next[index] = { ...next[index], hex: event.target.value };
                        set("colors", next);
                      }}
                      aria-label="انتخاب رنگ"
                      className="size-10 shrink-0 cursor-pointer rounded-md border border-line bg-surface"
                    />
                    <Input
                      value={color.name}
                      onChange={(event) => {
                        const next = [...input.colors];
                        next[index] = { ...next[index], name: event.target.value };
                        set("colors", next);
                      }}
                      placeholder="نام رنگ"
                      className="h-10"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        set(
                          "colors",
                          input.colors.filter((_, position) => position !== index),
                        )
                      }
                      disabled={input.colors.length <= 1}
                      aria-label="حذف رنگ"
                      className="grid size-10 shrink-0 place-items-center rounded-md border border-line text-mute transition-colors duration-300 hover:border-danger/40 hover:text-danger disabled:opacity-35"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview + submit */}
      <div className="flex flex-col gap-5 xl:sticky xl:top-28 xl:h-fit">
        <Card>
          <CardHeader className="flex flex-col gap-1">
            <CardTitle>پیش‌نمایش</CardTitle>
            <CardDescription>نمای تقریبی کارت محصول در فروشگاه</CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            <div className="relative aspect-4/5 overflow-hidden rounded-xl border border-line bg-carbon">
              {previewImages[0] ? (
                <img
                  src={previewImages[0].src}
                  alt=""
                  className={cn(
                    "size-full object-cover",
                    mediaClassFor(previewImages[0].src),
                  )}
                />
              ) : (
                <span className="grid size-full place-items-center text-mute">
                  <ImageIcon className="size-7" />
                </span>
              )}
              <span className="overlay-scrim absolute inset-0" />

              <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
                {input.badges.slice(0, 2).map((badge) => (
                  <Badge key={badge} tone={badge === "sale" ? "danger" : badge === "new" ? "info" : "gold"}>
                    {BADGE_OPTIONS.find((option) => option.value === badge)?.label}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[0.62rem] tracking-[0.18em] text-mute">
                {CATEGORIES.find((category) => category.slug === input.category)?.latinTitle}
              </span>
              <span className="text-sm text-ivory">{input.name || "نام محصول"}</span>
              <Price value={input.price} compareAt={input.compareAtPrice} size="sm" />
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {input.colors.map((color) => (
                  <span
                    key={`${color.hex}-preview`}
                    title={color.name}
                    className="size-3 rounded-full border border-ivory/20"
                    style={{ backgroundColor: color.hex }}
                  />
                ))}
                <span className="tnum ms-auto text-[0.62rem] text-mute">
                  {toPersianDigits(input.stock)} عدد موجودی
                </span>
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
            {product ? "ذخیره تغییرات" : "ایجاد محصول"}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin/products")}
          >
            انصراف و بازگشت
          </Button>

          <p className="text-[0.62rem] leading-5 text-mute">
            تغییرات در حافظه سرور ذخیره می‌شود؛ پس از اتصال به پایگاه داده واقعی، همین اکشن‌ها روی
            دیتابیس اعمال خواهند شد.
          </p>
        </motion.div>
      </div>
    </form>
  );
}
