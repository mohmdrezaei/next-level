import type { NextRequest } from "next/server";
import { createAccessToken, verifyRefreshToken } from "@/server/auth/otp";
import { badRequest, ok, unauthorized, withApi } from "@/server/http";
import { getUserById } from "@/server/repositories/users";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/refresh
 * Body: `{ refreshToken: string }`
 *
 * Exchanges a valid refresh token for a fresh access token.
 */
export async function POST(request: NextRequest) {
  return withApi(async () => {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      throw badRequest("درخواست ارسالی معتبر نیست.");
    }

    const refreshToken = String(body.refreshToken ?? "").trim();
    if (!refreshToken) {
      throw badRequest("توکن تجدید (Refresh Token) ارسال نشده است.");
    }

    const userId = verifyRefreshToken(refreshToken);
    if (!userId) {
      throw unauthorized("توکن نامعتبر یا منقضی شده است.");
    }

    const user = await getUserById(userId);
    if (!user) {
      throw unauthorized("کاربر یافت نشد.");
    }

    const accessToken = createAccessToken({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      accent: user.accent,
    });

    return ok({ accessToken });
  });
}
