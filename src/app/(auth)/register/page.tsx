import type { Metadata } from "next";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = {
  title: "ثبت‌نام",
  description: "ساخت حساب کاربری در بوتیک Next Level و عضویت در باشگاه مشتریان.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
