"use server";

import { redirect } from "next/navigation";

import { safeInternalPath } from "@/lib/redirects";
import { sanitizeString } from "@/lib/sanitize";
import { lockoutStatus, registerFailure, registerSuccess } from "@/server/auth/throttle";
import { cleanPhone, isValidEmail, isValidPhone } from "@/server/phone";
import { createCustomerSession, createSession, destroySession, resolveCredentials } from "./server/session";
import type { AuthState } from "./types";

/** Longest credential we will even look at — a cheap anti-DoS guard. */
const MAX_IDENTIFIER = 254;
const MAX_PASSWORD = 200;

function str(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const mode = str(formData, "mode").trim() || "phone";
  const submitted = str(formData, mode === "email" ? "email" : "phone").trim();

  // An address containing "@" is unambiguous, so it is treated as an email even
  // when the phone tab is active. This is how staff sign in to the admin panel.
  const usingEmail = mode === "email" || submitted.includes("@");
  const identifier = usingEmail ? submitted.toLowerCase() : cleanPhone(submitted);

  const password = str(formData, "password");

  // Never trust the posted target: `//evil.com` would otherwise be an open redirect.
  const next = safeInternalPath(str(formData, "next"), "/account");

  const fieldErrors: Record<string, string> = {};
  if (!identifier) fieldErrors[usingEmail ? "email" : "phone"] = "این فیلد الزامی است.";
  else if (identifier.length > MAX_IDENTIFIER) fieldErrors[usingEmail ? "email" : "phone"] = "این مقدار بیش از حد طولانی است.";
  else if (usingEmail && !isValidEmail(identifier)) fieldErrors.email = "ایمیل معتبر نیست.";
  else if (!usingEmail && !isValidPhone(identifier))
    fieldErrors.phone = "شماره موبایل باید با ۰۹ شروع شده و ۱۱ رقم باشد.";

  if (!password) fieldErrors.password = "رمز عبور را وارد کنید.";
  else if (password.length < 6) fieldErrors.password = "رمز عبور باید حداقل ۶ کاراکتر باشد.";
  else if (password.length > MAX_PASSWORD) fieldErrors.password = "رمز عبور بیش از حد طولانی است.";

  if (Object.keys(fieldErrors).length) {
    return { error: "لطفاً خطاهای فرم را برطرف کنید.", fieldErrors };
  }

  // Account-level lockout, on top of the per-IP limiter in the proxy: hammering
  // one account from many addresses still trips this.
  const lock = lockoutStatus(identifier);
  if (lock.locked) {
    return {
      error: `به‌دلیل تلاش‌های ناموفق، ورود به این حساب موقتاً قفل شده است. حدود ${Math.ceil(
        lock.retryAfterMs / 60000,
      )} دقیقه دیگر تلاش کنید.`,
    };
  }

  const user = await resolveCredentials(identifier, password);
  if (!user) {
    registerFailure(identifier);
    return { error: "اطلاعات ورود مطابقت ندارد." };
  }

  registerSuccess(identifier);
  await createSession(user);

  redirect(user.role === "admin" ? "/admin" : next);
}

export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const name = sanitizeString(str(formData, "name"), 80);
  const phone = cleanPhone(str(formData, "phone"));
  const email = sanitizeString(str(formData, "email"), 254).toLowerCase();
  const password = str(formData, "password");
  const confirm = str(formData, "confirm");
  const accepted = formData.get("terms");

  const fieldErrors: Record<string, string> = {};
  if (name.length < 3) fieldErrors.name = "نام و نام خانوادگی را کامل وارد کنید.";
  if (!isValidPhone(phone)) fieldErrors.phone = "شماره موبایل باید با ۰۹ شروع شده و ۱۱ رقم باشد.";
  if (email && !isValidEmail(email)) fieldErrors.email = "ایمیل معتبر نیست.";
  if (password.length < 6) fieldErrors.password = "رمز عبور باید حداقل ۶ کاراکتر باشد.";
  else if (password.length > MAX_PASSWORD) fieldErrors.password = "رمز عبور بیش از حد طولانی است.";
  if (confirm !== password) fieldErrors.confirm = "تکرار رمز عبور مطابقت ندارد.";
  if (!accepted) fieldErrors.terms = "پذیرش قوانین فروشگاه الزامی است.";

  if (Object.keys(fieldErrors).length) {
    return { error: "لطفاً خطاهای فرم را برطرف کنید.", fieldErrors };
  }

  // Role is pinned server-side; the form cannot ask to be an admin.
  const created = await createCustomerSession({
    name,
    phone,
    email: email || `${phone}@nextlevel.demo`,
    password,
  });

  await createSession(created);
  redirect("/account");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}
