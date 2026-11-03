"use client";

import * as React from "react";
import { Home, MapPin, Pencil, Phone, Plus, Star, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { Address } from "@/features/orders/types";

const PROVINCES = [
  "تهران",
  "البرز",
  "اصفهان",
  "فارس",
  "خراسان رضوی",
  "آذربایجان شرقی",
  "گیلان",
  "خوزستان",
  "یزد",
  "قم",
];

type Draft = Omit<Address, "id" | "isDefault">;

const EMPTY_DRAFT: Draft = {
  title: "خانه",
  fullName: "",
  phone: "",
  province: "تهران",
  city: "",
  line1: "",
  postalCode: "",
};

export function AddressManager({
  initial,
  customerId,
}: {
  initial: Address[];
  customerId: string | null;
}) {
  const [addresses, setAddresses] = React.useState<Address[]>(initial);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Address | null>(null);
  const [draft, setDraft] = React.useState<Draft>(EMPTY_DRAFT);
  const [errors, setErrors] = React.useState<Partial<Record<keyof Draft, string>>>({});
  const [busy, setBusy] = React.useState(false);

  const openCreate = () => {
    setEditing(null);
    setDraft(EMPTY_DRAFT);
    setErrors({});
    setOpen(true);
  };

  const openEdit = (address: Address) => {
    setEditing(address);
    const { id: _id, isDefault: _isDefault, ...rest } = address;
    setDraft(rest);
    setErrors({});
    setOpen(true);
  };

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((state) => ({ ...state, [key]: value }));
    setErrors((state) => ({ ...state, [key]: undefined }));
  };

  const validate = () => {
    const next: Partial<Record<keyof Draft, string>> = {};
    if (draft.title.trim().length < 2) next.title = "یک عنوان کوتاه وارد کنید.";
    if (draft.fullName.trim().length < 3) next.fullName = "نام گیرنده را کامل وارد کنید.";
    if (!/^0?9\d{9}$/.test(draft.phone.replace(/[\s-]/g, "").replace(/^(\+98|98)/, "0")))
      next.phone = "شماره موبایل معتبر نیست.";
    if (draft.city.trim().length < 2) next.city = "نام شهر را وارد کنید.";
    if (draft.line1.trim().length < 10) next.line1 = "نشانی کامل‌تری وارد کنید.";
    if (!/^\d{10}$/.test(draft.postalCode.replace(/\D/g, ""))) next.postalCode = "کد پستی باید ۱۰ رقم باشد.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    if (!customerId) {
      toast.error("برای ذخیره نشانی باید وارد حساب خود شوید.");
      return;
    }

    setBusy(true);
    try {
      if (editing) {
        const updated = await apiFetch<Address>(`/api/addresses/${editing.id}`, {
          method: "PATCH",
          body: draft,
        });
        setAddresses((state) => state.map((address) => (address.id === updated.id ? updated : address)));
        toast.success("نشانی ویرایش شد");
      } else {
        const created = await apiFetch<Address>(`/api/customers/${customerId}/addresses`, {
          method: "POST",
          body: draft,
        });
        setAddresses((state) => [...state, created]);
        toast.success("نشانی جدید افزوده شد");
      }

      setOpen(false);
    } catch (error) {
      if (error instanceof ApiClientError && error.field) {
        setErrors({ [error.field as keyof Draft]: error.message });
      }
      toast.error(error instanceof ApiClientError ? error.message : "ذخیره نشانی ناموفق بود.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    setBusy(true);
    try {
      await apiFetch(`/api/addresses/${id}`, { method: "DELETE" });
      setAddresses((state) => state.filter((address) => address.id !== id));
      toast.success("نشانی حذف شد");
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : "حذف نشانی ناموفق بود.");
    } finally {
      setBusy(false);
    }
  };

  const makeDefault = async (id: string) => {
    setBusy(true);
    try {
      await apiFetch(`/api/addresses/${id}/default`, { method: "POST" });
      setAddresses((state) => state.map((address) => ({ ...address, isDefault: address.id === id })));
      toast.success("نشانی پیش‌فرض تغییر کرد");
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : "تغییر نشانی پیش‌فرض ناموفق بود.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="tnum text-xs text-smoke">
          {new Intl.NumberFormat("fa-IR").format(addresses.length)} نشانی ذخیره‌شده
        </span>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="gold" size="sm" onClick={openCreate}>
              <Plus className="size-3.5" />
              افزودن نشانی
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{editing ? "ویرایش نشانی" : "افزودن نشانی جدید"}</DialogTitle>
              <DialogDescription>
                این نشانی در فرآیند پرداخت به‌صورت پیشنهادی نمایش داده می‌شود.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={save} className="grid gap-5 sm:grid-cols-2">
              <Field label="عنوان نشانی" required error={errors.title}>
                <Input
                  value={draft.title}
                  onChange={(event) => set("title", event.target.value)}
                  placeholder="خانه، دفتر کار…"
                  data-invalid={errors.title ? "" : undefined}
                />
              </Field>

              <Field label="نام گیرنده" required error={errors.fullName}>
                <Input
                  value={draft.fullName}
                  onChange={(event) => set("fullName", event.target.value)}
                  data-invalid={errors.fullName ? "" : undefined}
                />
              </Field>

              <Field label="شماره موبایل" required error={errors.phone}>
                <Input
                  value={draft.phone}
                  onChange={(event) => set("phone", event.target.value)}
                  dir="ltr"
                  className="tnum text-start"
                  data-invalid={errors.phone ? "" : undefined}
                />
              </Field>

              <Field label="استان" required>
                <select
                  value={draft.province}
                  onChange={(event) => set("province", event.target.value)}
                  className="h-12 w-full rounded-md border border-line bg-surface/60 px-4 text-sm text-ivory transition-colors duration-300 hover:border-ivory/20 focus:border-gold/60"
                >
                  {PROVINCES.map((province) => (
                    <option key={province} value={province} className="bg-carbon">
                      {province}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="شهر" required error={errors.city}>
                <Input
                  value={draft.city}
                  onChange={(event) => set("city", event.target.value)}
                  data-invalid={errors.city ? "" : undefined}
                />
              </Field>

              <Field label="کد پستی" required error={errors.postalCode}>
                <Input
                  value={draft.postalCode}
                  onChange={(event) => set("postalCode", event.target.value)}
                  dir="ltr"
                  className="tnum text-start"
                  data-invalid={errors.postalCode ? "" : undefined}
                />
              </Field>

              <Field label="نشانی کامل" required error={errors.line1} className="sm:col-span-2">
                <Input
                  value={draft.line1}
                  onChange={(event) => set("line1", event.target.value)}
                  placeholder="خیابان، کوچه، پلاک، واحد"
                  data-invalid={errors.line1 ? "" : undefined}
                />
              </Field>

              <DialogFooter className="sm:col-span-2">
                <DialogClose asChild>
                  <Button type="button" variant="ghost" size="md">
                    انصراف
                  </Button>
                </DialogClose>
                <Button type="submit" variant="gold" size="md" loading={busy}>
                  {editing ? "ذخیره تغییرات" : "افزودن نشانی"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {addresses.length === 0 ? (
        <EmptyState
          icon={<MapPin />}
          title="هنوز نشانی‌ای ثبت نکرده‌اید"
          description="برای ثبت سفارش، حداقل یک نشانی تحویل لازم است."
        >
          <Button type="button" variant="outline" size="sm" onClick={openCreate}>
            افزودن اولین نشانی
          </Button>
        </EmptyState>
      ) : (
        <ul className="grid gap-5 md:grid-cols-2">
          <AnimatePresence initial={false} mode="popLayout">
            {addresses.map((address) => (
              <motion.li
                key={address.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card
                  className={cn(
                    "flex h-full flex-col gap-4 p-5",
                    address.isDefault && "border-gold/35",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex items-center gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-elevated text-gold">
                        <Home className="size-4" />
                      </span>
                      <span className="flex flex-col gap-1">
                        <span className="text-xs text-ivory">{address.title}</span>
                        <span className="text-[0.62rem] text-mute">{address.fullName}</span>
                      </span>
                    </span>

                    {address.isDefault ? (
                      <Badge tone="gold" className="gap-1">
                        <Star className="size-3 fill-current" />
                        پیش‌فرض
                      </Badge>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-1.5 text-xs leading-6 text-smoke">
                    <span>
                      {address.province}، {address.city}
                    </span>
                    <span>{address.line1}</span>
                    <span className="tnum text-mute">کد پستی: {address.postalCode}</span>
                    <span className="tnum flex items-center gap-2 text-mute">
                      <Phone className="size-3.5" />
                      {address.phone}
                    </span>
                  </div>

                  <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-line pt-4">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(address)}
                    >
                      <Pencil className="size-3.5" />
                      ویرایش
                    </Button>

                    {!address.isDefault ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => makeDefault(address.id)}
                      >
                        <Star className="size-3.5" />
                        پیش‌فرض کن
                      </Button>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => remove(address.id)}
                      aria-label={`حذف ${address.title}`}
                      className="ms-auto grid size-9 place-items-center rounded-full border border-line text-mute transition-colors duration-300 hover:border-danger/40 hover:text-danger"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </Card>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
