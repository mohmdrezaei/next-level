import type { NextRequest } from "next/server";

import { requireApiUser } from "@/server/api-auth";
import { createSessionForUser } from "@/server/auth/session";
import { badRequest, ok, withApi } from "@/server/http";
import { changePassword } from "@/server/repositories/users";
import { parseBody, str } from "@/server/validate";

export const dynamic = "force-dynamic";

const passwordField = (label: string, min = 0) =>
  str({ label, min, max: 200, sanitize: false, trim: false });

/**
 * PUT /api/account/password
 * Body: `{ current, next, confirm }` — verifies the current password first.
 *
 * Changing the password revokes every session for the account (see
 * `changePassword`), so a fresh session is issued for this device before the
 * response is returned — the caller stays signed in, every other device does not.
 */
export async function PUT(request: NextRequest) {
  return withApi(async () => {
    const user = await requireApiUser();

    const body = await parseBody(request, {
      current: passwordField("رمز عبور فعلی"),
      next: passwordField("رمز عبور جدید", 6),
      confirm: passwordField("تکرار رمز جدید"),
    });

    if (body.next !== body.confirm) {
      throw badRequest("تکرار رمز جدید مطابقت ندارد.", { field: "confirm" });
    }

    await changePassword(user.id, body.current, body.next);
    await createSessionForUser(user.id);

    return ok({ changed: true, message: "رمز عبور با موفقیت تغییر کرد." });
  });
}
