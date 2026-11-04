"use client";

import { Droplets, Package, Shirt, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { Product } from "../types";

const SHIPPING_ROWS = [
  { title: "ارسال استاندارد", body: "۳ تا ۵ روز کاری — ۱۴۹٬۰۰۰ تومان (بالای ۵ میلیون تومان رایگان)" },
  { title: "ارسال سریع", body: "۲۴ ساعته فقط برای تهران و کرج — ۳۴۹٬۰۰۰ تومان" },
  { title: "تحویل حضوری", body: "دریافت از بوتیک ولیعصر، همان روز پس از تأیید آماده‌سازی" },
  { title: "بازگشت کالا", body: "تا ۷ روز پس از دریافت، با شرط استفاده‌نشدن و حفظ پلمب" },
];

export function ProductDetailsTabs({ product }: { product: Product }) {
  return (
    <Tabs defaultValue="description" className="flex flex-col gap-8">
      <TabsList variant="underline">
        <TabsTrigger variant="underline" value="description">
          توضیحات
        </TabsTrigger>
        <TabsTrigger variant="underline" value="materials">
          پارچه و نگهداری
        </TabsTrigger>
        <TabsTrigger variant="underline" value="features">
          ویژگی‌های ساخت و تن‌خور
        </TabsTrigger>
        <TabsTrigger variant="underline" value="shipping">
          ارسال و بازگشت
        </TabsTrigger>
      </TabsList>

      <TabsContent value="description" className="max-w-3xl">
        <div className="flex flex-col gap-5">
          <p className="text-sm leading-8 text-smoke">{product.description}</p>

          <div className="rounded-xl border border-line bg-surface/40 p-5">
            <span className="mb-3 flex items-center gap-2 text-[0.68rem] tracking-[0.18em] text-gold/85">
              <Sparkles className="size-3.5" />
              داستان قطعه
            </span>
            <p className="text-xs leading-7 text-smoke">{product.story}</p>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="materials" className="max-w-3xl">
        <div className="grid gap-8 sm:grid-cols-2">
          <div className="flex flex-col gap-4">
            <span className="flex items-center gap-2 text-[0.68rem] tracking-[0.18em] text-mute">
              <Shirt className="size-3.5 text-gold" />
              ترکیب و پارچه
            </span>
            <ul className="flex flex-col gap-3">
              {product.materials.map((material) => (
                <li key={material} className="flex items-start gap-2.5 text-xs leading-6 text-smoke">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold/70" />
                  {material}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <span className="flex items-center gap-2 text-[0.68rem] tracking-[0.18em] text-mute">
              <Droplets className="size-3.5 text-gold" />
              نگهداری
            </span>
            <ul className="flex flex-col gap-3">
              {product.care.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-xs leading-6 text-smoke">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold/70" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="features" className="max-w-3xl">
        <Accordion type="single" collapsible defaultValue="item-0">
          {product.highlights.map((highlight, index) => (
            <AccordionItem key={highlight} value={`item-${index}`}>
              <AccordionTrigger>{highlight}</AccordionTrigger>
              <AccordionContent>
                این ویژگی در مرحله کنترل کیفیت بوتیک به‌صورت جداگانه بررسی می‌شود و روی برگه
                شناسنامه قطعه ثبت می‌گردد.
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </TabsContent>

      <TabsContent value="shipping" className="max-w-3xl">
        <div className="flex flex-col gap-4">
          <span className="flex items-center gap-2 text-[0.68rem] tracking-[0.18em] text-mute">
            <Package className="size-3.5 text-gold" />
            روش‌های ارسال و بازگشت
          </span>

          <dl className="flex flex-col divide-y divide-line rounded-xl border border-line">
            {SHIPPING_ROWS.map((row) => (
              <div key={row.title} className="flex flex-col gap-1.5 p-4 sm:flex-row sm:items-center sm:gap-6">
                <dt className="w-40 shrink-0 text-xs text-ivory">{row.title}</dt>
                <dd className="text-xs leading-6 text-smoke">{row.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </TabsContent>
    </Tabs>
  );
}
