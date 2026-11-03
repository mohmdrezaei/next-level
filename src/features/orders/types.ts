import type { ShippingMethodId, PaymentMethodId } from "@/lib/constants";

export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned";

export interface OrderItem {
  productId: string;
  slug: string;
  name: string;
  latinName: string;
  image: string;
  size: string;
  color: string;
  price: number;
  quantity: number;
}

export interface OrderAddress {
  fullName: string;
  phone: string;
  province: string;
  city: string;
  line1: string;
  postalCode: string;
}

export interface OrderEvent {
  status: OrderStatus;
  at: string;
  note: string;
}

export interface Order {
  id: string;
  code: string;
  createdAt: string;
  status: OrderStatus;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  shippingMethod: ShippingMethodId;
  paymentMethod: PaymentMethodId;
  address: OrderAddress;
  timeline: OrderEvent[];
  trackingCode: string | null;
  hasReview: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  province: string;
  joinedAt: string;
  orders: number;
  totalSpent: number;
  tier: "bronze" | "silver" | "gold";
  lastOrderAt: string;
}

export interface Address {
  id: string;
  title: string;
  fullName: string;
  phone: string;
  province: string;
  city: string;
  line1: string;
  postalCode: string;
  isDefault: boolean;
}
