"use client";

import * as React from "react";
import { Check, Send } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch, ApiClientError } from "@/lib/api-client";

const SUBJECTS = [
  { value: "order", label: "پیگیری سفارش" },
  { value: "sizing", label: "مشاوره سایز و فیت" },
  { value: "return", label: "بازگشت یا مرجوعی کالا" },
  { value: "partnership", label: "همکاری و فروش عمده" },
  { value: "other", label: "موضوع دیگر" },
];

interface Values {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export function ContactForm() {
  const [values, setValues] = React.useState<Values>({
    name: "",
    email: "",
    phone: "",
    subject: "order",
    message: "",
  });
  const [errors, setErrors] = React.useState<Partial<Record<keyof Values, string>>>({});
  const [sending, setSending] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  const set = <K extends keyof Values>(key: K, value: Values[K]) => {
    setValues((state) => ({ ...state, [key]: value }));
    setErrors((state) => ({ ...state, [key]: undefined }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    const next: Partial<Record<keyof Values, string>> = {};
    if (values.name.trim().length < 3) next.name = "نام خود را کامل وارد کنید.";
    if (!/^\S+@\S+\.\S+$/.test(values.email)) next.email = "ایمیل معتبر نیست.";
    if (values.phone && !/^0?9\d{9}$/.test(values.phone.replace(/[\s-]/g, "")))
      next.phone = "شماره موبایل معتبر نیست.";
    if (values.message.trim().length < 15) next.message = "متن پیام باید حداقل ۱۵ کاراکتر باشد.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSending(true);
    try {
      await apiFetch("/api/contact", { method: "POST", body: values });
      setSent(true);
      setValues({ name: "", email: "", phone: "", subject: "order", message: "" });
      toast.success("پیام شما ارسال شد", {
        description: "کارشناسان آتلیه حداکثر تا ۴ ساعت کاری پاسخ می‌دهند.",
      });
      window.setTimeout(() => setSent(false), 5000);
    } catch (error) {
      if (error instanceof ApiClientError && error.field) {
        setErrors({ [error.field as keyof Values]: error.message });
      }
      toast.error(error instanceof ApiClientError ? error.message : "ارسال پیام ناموفق بود.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-1">
        <CardTitle>فرم تماس</CardTitle>
        <CardDescription>
          پیام خود را بنویسید؛ در ساعات کاری حداکثر تا ۴ ساعت پاسخ می‌دهیم.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
          <Field label="نام و نام خانوادگی" required error={errors.name}>
            <Input
              value={values.name}
              onChange={(event) => set("name", event.target.value)}
              placeholder="مثلاً آرش مهرآذین"
              data-invalid={errors.name ? "" : undefined}
            />
          </Field>

          <Field label="ایمیل" required error={errors.email}>
            <Input
              type="email"
              value={values.email}
              onChange={(event) => set("email", event.target.value)}
              placeholder="you@example.com"
              dir="ltr"
              className="text-start"
              data-invalid={errors.email ? "" : undefined}
            />
          </Field>

          <Field label="شماره تماس" hint="اختیاری" error={errors.phone}>
            <Input
              type="tel"
              value={values.phone}
              onChange={(event) => set("phone", event.target.value)}
              placeholder="09120000000"
              dir="ltr"
              className="tnum text-start"
              data-invalid={errors.phone ? "" : undefined}
            />
          </Field>

          <Field label="موضوع پیام" required>
            <Select value={values.subject} onValueChange={(value) => set("subject", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUBJECTS.map((subject) => (
                  <SelectItem key={subject.value} value={subject.value}>
                    {subject.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="متن پیام" required error={errors.message} className="sm:col-span-2">
            <Textarea
              value={values.message}
              onChange={(event) => set("message", event.target.value)}
              placeholder="جزئیات پرسش یا درخواست خود را بنویسید…"
              className="min-h-32"
              data-invalid={errors.message ? "" : undefined}
            />
          </Field>

          <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
            <Button type="submit" variant="gold" size="lg" loading={sending}>
              <Send className="size-4" />
              ارسال پیام
            </Button>

            <AnimatePresence>
              {sent ? (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="inline-flex items-center gap-2 text-[0.7rem] text-success"
                >
                  <Check className="size-4" />
                  پیام شما ثبت شد.
                </motion.span>
              ) : null}
            </AnimatePresence>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
