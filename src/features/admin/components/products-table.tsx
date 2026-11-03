"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpDown,
  Copy,
  MoreHorizontal,
  Pencil,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { ProductBadgePill, StockBadge } from "./status-badge";
import { BulkDeleteButton } from "./bulk-actions";
import { CATEGORIES, CATEGORY_MAP } from "@/features/products/data/catalog";
import { deleteProductAction, deleteProductsAction, duplicateProductAction } from "../actions";
import { formatCompactPrice, formatNumber, toPersianDigits } from "@/lib/format";
import { normalize, productStock } from "@/features/products/lib/query";
import { mediaClassFor } from "@/lib/media";
import { cn } from "@/lib/utils";
import type { CategorySlug, Product } from "@/features/products/types";

const PAGE_SIZE = 8;

type SortKey = "newest" | "price-desc" | "price-asc" | "stock-asc" | "name";

const SORT_LABELS: Record<SortKey, string> = {
  newest: "جدیدترین",
  "price-desc": "گران‌ترین",
  "price-asc": "ارزان‌ترین",
  "stock-asc": "کم‌موجودترین",
  name: "الفبایی",
};

export function ProductsTable({ products }: { products: Product[] }) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<"all" | CategorySlug>("all");
  const [sort, setSort] = React.useState<SortKey>("newest");
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [pendingDelete, setPendingDelete] = React.useState<Product | null>(null);
  const [busy, setBusy] = React.useState(false);

  const filtered = React.useMemo(() => {
    const needle = normalize(query);

    const list = products.filter((product) => {
      if (category !== "all" && product.category !== category) return false;
      if (!needle) return true;
      return normalize(
        `${product.name} ${product.latinName} ${product.slug} ${product.id}`,
      ).includes(needle);
    });

    const sorted = [...list];
    switch (sort) {
      case "price-desc":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "price-asc":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "stock-asc":
        sorted.sort((a, b) => productStock(a) - productStock(b));
        break;
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name, "fa"));
        break;
      default:
        sorted.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    }
    return sorted;
  }, [products, query, category, sort]);

  React.useEffect(() => {
    setPage(1);
  }, [query, category, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const allOnPageSelected = rows.length > 0 && rows.every((row) => selected.includes(row.id));

  const toggleAll = () => {
    if (allOnPageSelected) {
      setSelected((state) => state.filter((id) => !rows.some((row) => row.id === id)));
    } else {
      setSelected((state) => [...new Set([...state, ...rows.map((row) => row.id)])]);
    }
  };

  const run = async (
    action: () => Promise<{ ok: boolean; message: string }>,
    successPrefix?: string,
  ) => {
    setBusy(true);
    const result = await action();
    setBusy(false);
    if (result.ok) {
      toast.success(successPrefix ?? result.message);
      router.refresh();
    } else toast.error(result.message);
    return result.ok;
  };

  return (
    <>
      <Card className="overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 border-b border-line p-5 lg:flex-row lg:items-center">
          <div className="lg:w-72">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              startIcon={<Search />}
              placeholder="جست‌وجوی نام یا نامک محصول…"
              className="h-11 text-xs"
            />
          </div>

          <div className="flex flex-1 flex-wrap items-center gap-3">
            <Select
              value={category}
              onValueChange={(value) => setCategory(value as "all" | CategorySlug)}
            >
              <SelectTrigger size="sm" className="w-44">
                <SelectValue placeholder="دسته‌بندی" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه دسته‌بندی‌ها</SelectItem>
                {CATEGORIES.map((item) => (
                  <SelectItem key={item.slug} value={item.slug}>
                    {item.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={(value) => setSort(value as SortKey)}>
              <SelectTrigger size="sm" className="w-40">
                <span className="flex items-center gap-2">
                  <ArrowUpDown className="size-3.5 text-mute" />
                  <SelectValue placeholder="ترتیب" />
                </span>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SORT_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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

            <BulkDeleteButton
              count={selected.length}
              entityLabel="محصول"
              busy={busy}
              onConfirm={async () => {
                const ok = await run(() => deleteProductsAction(selected));
                if (ok) setSelected([]);
                return ok;
              }}
            />

            <span className="tnum ms-auto text-[0.68rem] text-mute">
              {formatNumber(filtered.length)} محصول
            </span>
          </div>
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
              <TH>محصول</TH>
              <TH>دسته‌بندی</TH>
              <TH className="text-center">قیمت</TH>
              <TH className="text-center">موجودی</TH>
              <TH className="text-center">امتیاز</TH>
              <TH className="w-14 text-center">عملیات</TH>
            </TR>
          </THead>

          <TBody>
            {rows.map((product) => {
              const stock = productStock(product);
              const checked = selected.includes(product.id);

              return (
                <TR key={product.id} className={cn(checked && "bg-gold/[0.04]")}>
                  <TD>
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() =>
                        setSelected((state) =>
                          state.includes(product.id)
                            ? state.filter((id) => id !== product.id)
                            : [...state, product.id],
                        )
                      }
                      aria-label={`انتخاب ${product.name}`}
                    />
                  </TD>

                  <TD className="whitespace-normal">
                    <span className="flex items-center gap-3">
                      <span className="size-11 shrink-0 overflow-hidden rounded-md border border-line bg-carbon">
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
                      <span className="flex min-w-0 flex-col gap-1">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="truncate text-xs text-ivory transition-colors duration-300 hover:text-gold-soft"
                        >
                          {product.name}
                        </Link>
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-[0.62rem] text-mute">
                            {product.latinName}
                          </span>
                          {product.featured ? (
                            <Star className="size-3 fill-gold text-gold" aria-label="منتخب" />
                          ) : null}
                        </span>
                        {product.badges.length ? (
                          <span className="flex flex-wrap gap-1">
                            {product.badges.map((badge) => (
                              <ProductBadgePill key={badge} badge={badge} />
                            ))}
                          </span>
                        ) : null}
                      </span>
                    </span>
                  </TD>

                  <TD>
                    <Badge tone="outline">{CATEGORY_MAP[product.category]?.title}</Badge>
                  </TD>

                  <TD className="tnum text-center text-ivory">
                    {formatCompactPrice(product.price)}
                    {product.compareAtPrice ? (
                      <span className="ms-1.5 text-[0.6rem] text-danger">تخفیف</span>
                    ) : null}
                  </TD>

                  <TD className="text-center">
                    <StockBadge stock={stock} />
                  </TD>

                  <TD className="tnum text-center">
                    {product.reviewCount ? (
                      <span className="text-ivory">
                        {toPersianDigits(product.rating.toFixed(1))}
                        <span className="ms-1 text-[0.6rem] text-mute">
                          ({toPersianDigits(product.reviewCount)})
                        </span>
                      </span>
                    ) : (
                      <span className="text-mute">—</span>
                    )}
                  </TD>

                  <TD className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          aria-label={`عملیات ${product.name}`}
                          className="grid size-8 place-items-center rounded-md border border-line text-mute transition-colors duration-300 hover:border-ivory/25 hover:text-ivory"
                        >
                          <MoreHorizontal className="size-4" />
                        </button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="start" className="w-48">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/products/${product.id}`}>
                            <Pencil className="size-4" />
                            ویرایش محصول
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem asChild>
                          <Link href={`/shop/${product.slug}`}>
                            <Search className="size-4" />
                            مشاهده در فروشگاه
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onSelect={() => {
                            void run(() => duplicateProductAction(product.id));
                          }}
                        >
                          <Copy className="size-4" />
                          ساخت کپی
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          variant="danger"
                          onSelect={() => setPendingDelete(product)}
                        >
                          <Trash2 className="size-4" />
                          حذف محصول
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TD>
                </TR>
              );
            })}

            {rows.length === 0 ? (
              <TableEmpty colSpan={7} message="محصولی با این مشخصات پیدا نشد." />
            ) : null}
          </TBody>
        </Table>

        <div className="border-t border-line p-5">
          <TablePager
            page={current}
            totalPages={totalPages}
            totalItems={filtered.length}
            onPageChange={setPage}
          />
        </div>
      </Card>

      {/* Delete confirmation */}
      <Dialog open={Boolean(pendingDelete)} onOpenChange={(open) => (!open ? setPendingDelete(null) : null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>حذف محصول</DialogTitle>
            <DialogDescription>
              آیا از حذف «{pendingDelete?.name}» مطمئن هستید؟ این عملیات قابل بازگشت نیست و قطعه از
              فروشگاه حذف می‌شود.
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
                const ok = await run(() => deleteProductAction(pendingDelete.id));
                if (ok) {
                  setSelected((state) => state.filter((id) => id !== pendingDelete.id));
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
