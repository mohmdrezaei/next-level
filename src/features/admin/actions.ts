"use server";

import { revalidatePath } from "next/cache";

import type { OrderStatus } from "@/features/orders/types";
import type { CategorySlug, Product, ProductBadge } from "@/features/products/types";
import type { Customer, Order } from "@/features/orders/types";
import type { ProductSet } from "@/features/sets/types";
import { requireAdmin } from "@/server/auth/session";
import * as customersRepo from "@/server/repositories/customers";
import * as ordersRepo from "@/server/repositories/orders";
import * as productsRepo from "@/server/repositories/products";
import * as setsRepo from "@/server/repositories/sets";

/* -------------------------------------------------------------------------- */
/*  Public types                                                              */
/* -------------------------------------------------------------------------- */

export type ActionResult = { ok: boolean; message: string };

export type ProductColorInput = productsRepo.ProductColorInput;
export type ProductImageInput = productsRepo.ProductImageInput;
export type ProductInput = productsRepo.ProductInput;

export type CustomerInput = customersRepo.CustomerInput;

export type SetItemInput = setsRepo.SetItemInput;
export type SetInput = setsRepo.SetInput;

export type { CategorySlug, Customer, Order, Product, ProductBadge, ProductSet, OrderStatus };

/**
 * Run an admin-only mutation.
 *
 * `requireAdmin()` sits outside the `try` so its `redirect()` (thrown for
 * guests) propagates instead of being swallowed into a failed ActionResult.
 */
async function guard<T>(
  run: () => Promise<T>,
  describe: (result: T) => string,
): Promise<ActionResult> {
  await requireAdmin();

  try {
    const result = await run();
    revalidatePath("/", "layout");
    return { ok: true, message: describe(result) };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "خطای نامشخص رخ داد.",
    };
  }
}

/* -------------------------------------------------------------------------- */
/*  Reads (invoked from server components)                                    */
/* -------------------------------------------------------------------------- */

export async function fetchAdminProducts(): Promise<Product[]> {
  await requireAdmin();
  return productsRepo.listProducts({ limit: 500 });
}

export async function fetchAdminProduct(id: string): Promise<Product | null> {
  await requireAdmin();
  return productsRepo.findProduct(id);
}

export async function fetchAdminOrders(): Promise<Order[]> {
  await requireAdmin();
  return ordersRepo.listOrders({ limit: 500 });
}

export async function fetchAdminOrder(code: string): Promise<Order | null> {
  await requireAdmin();
  return ordersRepo.getOrderByCode(code);
}

export async function fetchAdminCustomers(): Promise<Customer[]> {
  await requireAdmin();
  return customersRepo.listCustomers({ limit: 500 });
}

export async function fetchAdminSets(): Promise<ProductSet[]> {
  await requireAdmin();
  return setsRepo.listSets({ limit: 200 });
}

/* -------------------------------------------------------------------------- */
/*  Product mutations                                                         */
/* -------------------------------------------------------------------------- */

export async function createProductAction(input: ProductInput): Promise<ActionResult> {
  return guard(
    () => productsRepo.createProduct(input),
    (product) => `محصول «${product.name}» با موفقیت ایجاد شد.`,
  );
}

export async function updateProductAction(id: string, input: ProductInput): Promise<ActionResult> {
  return guard(
    () => productsRepo.updateProduct(id, input),
    (product) => `تغییرات محصول «${product.name}» ذخیره شد.`,
  );
}

export async function deleteProductAction(id: string): Promise<ActionResult> {
  return guard(
    () => productsRepo.deleteProduct(id),
    (product) => `محصول «${product.name}» حذف شد.`,
  );
}

export async function duplicateProductAction(id: string): Promise<ActionResult> {
  return guard(
    () => productsRepo.duplicateProduct(id),
    (product) => `یک کپی از «${product.name}» ساخته شد.`,
  );
}

/* -------------------------------------------------------------------------- */
/*  Customer mutations                                                        */
/* -------------------------------------------------------------------------- */

export async function createCustomerAction(input: CustomerInput): Promise<ActionResult> {
  return guard(
    () => customersRepo.createCustomer(input),
    (customer) => `مشتری «${customer.name}» اضافه شد.`,
  );
}

export async function updateCustomerAction(id: string, input: CustomerInput): Promise<ActionResult> {
  return guard(
    () => customersRepo.updateCustomer(id, input),
    (customer) => `اطلاعات «${customer.name}» ذخیره شد.`,
  );
}

export async function deleteCustomerAction(id: string): Promise<ActionResult> {
  return guard(
    () => customersRepo.deleteCustomer(id),
    (customer) => `مشتری «${customer.name}» حذف شد.`,
  );
}

export async function recalculateCustomerStatsAction(id: string): Promise<ActionResult> {
  return guard(
    () => customersRepo.recalculateCustomerStats(id),
    (customer) => `آمار «${customer.name}» از روی سفارش‌ها بازخوانی شد.`,
  );
}

/* -------------------------------------------------------------------------- */
/*  Set mutations                                                             */
/* -------------------------------------------------------------------------- */

export async function createSetAction(input: SetInput): Promise<ActionResult> {
  return guard(
    () => setsRepo.createSet(input),
    (set) => `ست «${set.title}» ایجاد شد.`,
  );
}

export async function updateSetAction(slug: string, input: SetInput): Promise<ActionResult> {
  return guard(
    () => setsRepo.updateSet(slug, input),
    (set) => `تغییرات ست «${set.title}» ذخیره شد.`,
  );
}

export async function deleteSetAction(slug: string): Promise<ActionResult> {
  return guard(
    () => setsRepo.deleteSet(slug),
    (set) => `ست «${set.title}» حذف شد.`,
  );
}

export async function duplicateSetAction(slug: string): Promise<ActionResult> {
  return guard(
    () => setsRepo.duplicateSet(slug),
    (set) => `یک کپی از «${set.title}» ساخته شد.`,
  );
}

/* -------------------------------------------------------------------------- */
/*  Order mutations                                                           */
/* -------------------------------------------------------------------------- */

export async function changeOrderStatusAction(
  code: string,
  status: OrderStatus,
): Promise<ActionResult> {
  return guard(
    () => ordersRepo.changeOrderStatus(code, status),
    (order) => `وضعیت سفارش ${order.code} به‌روزرسانی شد.`,
  );
}
