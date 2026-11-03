"use client";

import * as React from "react";
import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toPersianDigits } from "@/lib/format";

/* -------------------------------------------------------------------------- */
/*  Selection summary pill                                                    */
/* -------------------------------------------------------------------------- */

export function SelectionPill({
  count,
  onClear,
}: {
  count: number;
  onClear: () => void;
}) {
  if (count <= 0) return null;

  return (
    <span className="tnum inline-flex items-center gap-2 text-[0.68rem] text-gold-soft">
      {toPersianDigits(count)} انتخاب‌شده
      <button
        type="button"
        onClick={onClear}
        aria-label="لغو انتخاب"
        className="grid size-6 place-items-center rounded-full text-mute transition-colors duration-300 hover:text-ivory"
      >
        <X className="size-3" />
      </button>
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Group delete button + confirmation                                        */
/* -------------------------------------------------------------------------- */

export function BulkDeleteButton({
  count,
  entityLabel,
  busy,
  onConfirm,
  className,
}: {
  /** Number of selected rows — the button hides itself when zero. */
  count: number;
  /** Plural noun used in the confirmation copy, e.g. «سفارش». */
  entityLabel: string;
  busy?: boolean;
  onConfirm: () => Promise<boolean>;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);

  if (count <= 0) return null;

  return (
    <>
      <Button
        type="button"
        variant="danger"
        size="sm"
        className={className}
        onClick={() => setOpen(true)}
      >
        <Trash2 className="size-3.5" />
        حذف گروهی
        <span className="tnum rounded-full bg-white/20 px-1.5 text-[0.6rem]">
          {toPersianDigits(count)}
        </span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>حذف گروهی {entityLabel}</DialogTitle>
            <DialogDescription>
              آیا از حذف {toPersianDigits(count)} {entityLabel} انتخاب‌شده مطمئن هستید؟ این عملیات
              قابل بازگشت نیست.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" size="md">
                انصراف
              </Button>
            </DialogClose>

            <Button
              type="button"
              variant="danger"
              size="md"
              loading={busy}
              onClick={async () => {
                const ok = await onConfirm();
                if (ok) setOpen(false);
              }}
            >
              <Trash2 className="size-4" />
              حذف {toPersianDigits(count)} مورد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
