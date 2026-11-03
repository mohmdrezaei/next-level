import type { NextRequest } from "next/server";
import { authenticateWithOtp } from "@/server/auth/otp";
import { badRequest, ok, withApi } from "@/server/http";
import { cleanPhone, isValidPhone } from "@/server/phone";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/otp/verify
 * Body: `{ phone: string, code: string, name?: string }`
 *
 * Validates the OTP code, logs in or auto-registers the shopper,
 * writes the session cookie, and returns `{ user, accessToken, refreshToken }`.
 */
export async function POST(request: NextRequest) {
  return withApi(async () => {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      throw badRequest("درخواست ارسالی معتبر نیست.");
    }

    const phone = cleanPhone(String(body.phone ?? ""));
    const code = String(body.code ?? "").trim();
    const name = body.name ? String(body.name).trim() : undefined;

    if (!isValidPhone(phone)) {
      throw badRequest("شماره موبایل نامعتبر است.", { field: "phone" });
    }

    if (!code) {
      throw badRequest("کد تأیید را وارد کنید.", { field: "code" });
    }

    const authResult = await authenticateWithOtp(phone, code, name);
    return ok(authResult);
  });
}
