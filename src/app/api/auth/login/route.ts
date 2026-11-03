import type { NextRequest } from "next/server";

import { createSessionForUser } from "@/server/auth/session";
import { lockoutStatus, registerFailure, registerSuccess } from "@/server/auth/throttle";
import { badRequest, ok, tooManyRequests, unauthorized, withApi } from "@/server/http";
import { verifyCredentials } from "@/server/repositories/users";
import { parseBody, str, strOptional } from "@/server/validate";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/login
 * Body: `{ identifier | email | phone, password }`
 *
 * Failures are counted per identifier (see `@/server/auth/throttle`) on top of
 * the per-IP limiter in the proxy, and the response is deliberately identical
 * whether the account is unknown or the password is wrong — the endpoint must
 * not be usable to enumerate accounts.
 */
export async function POST(request: NextRequest) {
  return withApi(async () => {
    const body = await parseBody(request, {
      identifier: strOptional({ label: "ایمیل یا شماره موبایل", max: 254, sanitize: false }),
      email: strOptional({ label: "ایمیل", max: 254, sanitize: false }),
      phone: strOptional({ label: "شماره موبایل", max: 20, sanitize: false }),
      password: str({ label: "رمز عبور", max: 200, sanitize: false, trim: false }),
    });

    const identifier = (body.identifier ?? body.email ?? body.phone ?? "").trim();
    if (!identifier) {
      throw badRequest("ایمیل یا شماره موبایل را وارد کنید.", { field: "identifier" });
    }

    const lock = lockoutStatus(identifier);
    if (lock.locked) {
      throw tooManyRequests(
        `حساب شما به‌دلیل تلاش‌های ناموفق موقتاً قفل شده است. لطفاً ${Math.ceil(
          lock.retryAfterMs / 60000,
        )} دقیقه دیگر تلاش کنید.`,
      );
    }

    const user = await verifyCredentials(identifier, body.password);
    if (!user) {
      registerFailure(identifier);
      throw unauthorized("اطلاعات ورود مطابقت ندارد.");
    }

    registerSuccess(identifier);
    await createSessionForUser(user.id);

    return ok({ user, session: true });
  });
}
