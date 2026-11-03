"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, MoreHorizontal, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/controls";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableEmpty,
  TablePager,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "./data-table";
import { SetForm } from "./set-form";
import { BulkDeleteButton } from "./bulk-actions";
import { SetCollage } from "@/features/sets/components/set-collage";
import { deleteSetAction, deleteSetsAction, duplicateSetAction } from "../actions";
import { resolveSet, setPricing, setRoles } from "@/features/sets/lib/set-helpers";
import { formatCompactPrice, formatNumber, toPersianDigits } from "@/lib/format";
import { normalize } from "@/features/products/lib/query";
import { Sheet, SheetBody, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { Product } from "@/features/products/types";
import type { ProductSet } from "@/features/sets/types";

const PAGE_SIZE = 8;

export function SetsTable({
  sets,
  products,
}: {
  sets: ProductSet[];
  products: Product[];
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [editing, setEditing] = React.useState<ProductSet | null>(null);
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [pendingDelete, setPendingDelete] = React.useState<ProductSet | null>(null);
  const [busy, setBusy] = React.useState(false);

  const rows = React.useMemo(() => {
    const needle = normalize(query);
    return sets
      .map((set) => ({ set, resolved: resolveSet(set, products), pricing: setPricing(resolveSet(set, products)) }))
      .filter(({ set }) =>
        needle ? normalize(`${set.title} ${set.latinTitle} ${set.slug} ${set.occasion}`).includes(needle) : true,
      );
  }, [sets, products, query]);

  React.useEffect(() => setPage(1), [query]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const allOnPageSelected =
    visible.length > 0 && visible.every((row) => selected.includes(row.set.slug));

  const toggleAll = () => {
    if (allOnPageSelected) {
      setSelected((state) =>
        state.filter((slug) => !visible.some((row) => row.set.slug === slug)),
      );
    } else {
      setSelected((state) => [
        ...new Set([...state, ...visible.map((row) => row.set.slug)]),
      ]);
    }
  };

  const run = async (action: () => Promise<{ ok: boolean; message: string }>) => {
    setBusy(true);
    const result = await action();
    setBusy(false);
    if (result.ok) {
      toast.success(result.message);
      router.refresh();
    } else toast.error(result.message);
    return result.ok;
  };

  const openCreate = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const openEdit = (set: ProductSet) => {
    setEditing(set);
    setEditorOpen(true);
  };

  return (
    <>
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-4 border-b border-line p-5">
          <div className="w-full sm:w-72">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              startIcon={<Search />}
              placeholder="جست‌وجوی عنوان یا موقعیت ست…"
              className="h-11 text-xs"
            />
          </div>

          {selected.length > 0 ? (
            <span className="tnum inline-flex items-center gap-2 text-[0.68rem] text-gold-soft">
              {toPersianDigits(selected.length)} انتخاب‌شده
              <button
                type="button"
                onClick={() => setSelected([])}
                aria-label="لغو انتخاب"
                className="grid size-6 place-items-center rounded-full text-mute transition-colors duration-300 hover:text-ivory"
              >
                <X className="size-3" />
              </button>
            </span>
          ) : null}

          <span className="tnum text-[0.68rem] text-mute">{formatNumber(rows.length)} ست</span>

          <BulkDeleteButton
            count={selected.length}
            entityLabel="ست"
            busy={busy}
            onConfirm={async () => {
              const ok = await run(() => deleteSetsAction(selected));
              if (ok) setSelected([]);
              return ok;
            }}
          />

          <Button type="button" variant="gold" size="sm" className="ms-auto" onClick={openCreate}>
            <Plus className="size-3.5" />
            ست جدید
          </Button>
        </div>

        <Table>
          <THead>
            <TR>
              <TH className="w-10">
                <Checkbox
                  checked={allOnPageSelected}
                  onCheckedChange={toggleAll}
                  aria-label="انتخاب همه"
                />
              </TH>
              <TH>ست</TH>
              <TH>موقعیت</TH>
              <TH className="text-center">قطعات</TH>
              <TH className="text-center">جمع قطعات</TH>
              <TH className="text-center">مبلغ ست</TH>
              <TH className="text-center">تخفیف</TH>
              <TH className="text-center">وضعیت</TH>
              <TH className="w-14 text-center">عملیات</TH>
            </TR>
          </THead>

          <TBody>
            {visible.map(({ set, resolved, pricing }) => (
              <TR
                key={set.slug}
                className={selected.includes(set.slug) ? "bg-gold/[0.04]" : undefined}
              >
                <TD>
                  <Checkbox
                    checked={selected.includes(set.slug)}
                    onCheckedChange={() =>
                      setSelected((state) =>
                        state.includes(set.slug)
                          ? state.filter((slug) => slug !== set.slug)
                          : [...state, set.slug],
                      )
                    }
                    aria-label={`انتخاب ${set.title}`}
                  />
                </TD>

                <TD className="whitespace-normal">
                  <div className="flex items-center gap-3.5">
                    <span className="w-16 shrink-0 overflow-hidden rounded-md border border-line">
                      <SetCollage
                        items={resolved.items}
                        title={set.title}
                        interactive={false}
                        className="aspect-4/3"
                      />
                    </span>
                    <span className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(set)}
                        className="text-start text-xs font-medium text-ivory transition-colors duration-300 hover:text-gold-soft"
                      >
                        {set.title}
                      </button>
                      <span className="max-w-56 truncate text-[0.62rem] text-mute">
                        {setRoles(resolved)}
                      </span>
                    </span>
                  </div>
                </TD>

                <TD className="text-[0.7rem] text-smoke">{set.occasion}</TD>

                <TD className="tnum text-center text-[0.7rem] text-smoke">
                  {toPersianDigits(pricing.itemCount)}
                </TD>

                <TD className="tnum text-center text-[0.7rem] text-mute line-through">
                  {formatCompactPrice(pricing.subtotal)}
                </TD>

                <TD className="tnum text-center text-[0.72rem] font-medium text-gold-soft">
                  {formatCompactPrice(pricing.total)}
                </TD>

                <TD className="text-center">
                  <Badge tone="success" size="sm" className="tnum">
                    {toPersianDigits(Math.round(set.discountRate * 100))}٪
                  </Badge>
                </TD>

                <TD className="text-center">
                  {set.featured ? (
                    <Badge tone="gold" size="sm">
                      منتخب
                    </Badge>
                  ) : (
                    <Badge tone="neutral" size="sm">
                      عادی
                    </Badge>
                  )}
                </TD>

                <TD className="text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label={`عملیات ${set.title}`}
                        className="grid size-8 place-items-center rounded-md border border-line text-mute transition-colors duration-300 hover:border-ivory/25 hover:text-ivory"
                      >
                        <MoreHorizontal className="size-4" />
                      </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="start" className="w-48">
                      <DropdownMenuItem asChild>
                        <Link href={`/sets/${set.slug}`} target="_blank">
                          <ExternalLink className="size-4" />
                          مشاهده در فروشگاه
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem onSelect={() => openEdit(set)}>
                        <Pencil className="size-4" />
                        ویرایش ست
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onSelect={() => {
                          void run(() => duplicateSetAction(set.slug));
                        }}
                      >
                        <Plus className="size-4" />
                        ساخت کپی
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        variant="danger"
                        onSelect={() => setPendingDelete(set)}
                      >
                        <Trash2 className="size-4" />
                        حذف ست
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TD>
              </TR>
            ))}

            {visible.length === 0 ? (
              <TableEmpty colSpan={9} message="ستی با این مشخصات پیدا نشد." />
            ) : null}
          </TBody>
        </Table>

        <div className="border-t border-line p-5">
          <TablePager
            page={current}
            totalPages={totalPages}
            totalItems={rows.length}
            onPageChange={setPage}
          />
        </div>
      </Card>

      {/* Editor drawer */}
      <Sheet open={editorOpen} onOpenChange={setEditorOpen}>
        <SheetContent side="left" width="xl" hideTitle aria-label="ویرایشگر ست">
          <SheetHeader>
            <SheetTitle>{editing ? `ویرایش «${editing.title}»` : "ست جدید"}</SheetTitle>
          </SheetHeader>

          <SheetBody>
            <SetForm
              key={editing?.slug ?? "new"}
              set={editing}
              products={products}
            />
          </SheetBody>
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
      <Dialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => (!open ? setPendingDelete(null) : null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>حذف ست</DialogTitle>
            <DialogDescription>
              آیا از حذف «{pendingDelete?.title}» مطمئن هستید؟ این ست از صفحه «ست‌ها» حذف می‌شود،
              اما قطعات آن در فروشگاه باقی می‌مانند.
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
                if (!pendingDelete) return;
                const ok = await run(() => deleteSetAction(pendingDelete.slug));
                if (ok) {
                  setSelected((state) => state.filter((slug) => slug !== pendingDelete.slug));
                  setPendingDelete(null);
                }
              }}
            >
              <Trash2 className="size-4" />
              حذف قطعی
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
