import type { Metadata } from "next";
import { safeInternalPath } from "@/lib/redirects";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "ورود به حساب",
  description: "ورود به حساب کاربری آتلیه Next Level برای پیگیری سفارش‌ها و مدیریت حساب.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const raw = Array.isArray(params.next) ? params.next[0] : params.next;
  // Only same-origin, internal paths — `//evil.com` and friends are rejected.
  const next = safeInternalPath(raw, "/account");

  return <LoginForm next={next} />;
}
