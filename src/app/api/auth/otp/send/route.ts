import type { NextRequest } from "next/server";
import { sendOtp } from "@/server/auth/otp";
import { badRequest, ok, withApi } from "@/server/http";
import { cleanPhone, isValidPhone } from "@/server/phone";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/otp/send
 * Body: `{ phone: string }`
 *
 * Generates an OTP code, logs it in server terminal for local development,
 * and sets a 2-minute expiration in the OTP store.
 */
export async function POST(request: NextRequest) {
  return withApi(async () => {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      throw badRequest("درخواست ارسالی معتبر نیست.");
    }

    const rawPhone = String(body.phone ?? "");
    const phone = cleanPhone(rawPhone);

    if (!isValidPhone(phone)) {
      throw badRequest("شماره موبایل نامعتبر است. شماره باید ۱۱ رقم بوده و با ۰۹ آغاز شود.", {
        field: "phone",
      });
    }

    const result = await sendOtp(phone);
    return ok(result);
  });
}
