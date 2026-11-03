import type { NextRequest } from "next/server";

import { requireApiUser } from "@/server/api-auth";
import { ok, withApi } from "@/server/http";
import { getProfile, updateProfile } from "@/server/repositories/users";
import { emailOptional, parseBody, phoneOptional, strOptional } from "@/server/validate";

export const dynamic = "force-dynamic";

/** GET /api/account/profile — the signed-in shopper's own profile. */
export async function GET() {
  return withApi(async () => {
    const user = await requireApiUser();
    return ok(await getProfile(user.id));
  });
}

/**
 * PATCH /api/account/profile
 * Body: `{ name?, email?, phone?, birthday?, gender? }` — omitted keys are kept.
 *
 * Every field is optional, but a supplied field is fully validated: length caps,
 * HTML stripping, Iranian phone normalisation and a Jalali birthday pattern.
 * The user id always comes from the session — never from the body — so a
 * shopper can only ever edit their own profile.
 */
export async function PATCH(request: NextRequest) {
  return withApi(async () => {
    const user = await requireApiUser();

    const body = await parseBody(request, {
      name: strOptional({ label: "نام و نام خانوادگی", min: 3, max: 80 }),
      email: emailOptional(),
      phone: phoneOptional(),
      birthday: strOptional({
        label: "تاریخ تولد",
        max: 10,
        latinDigits: true,
        pattern: /^\d{4}\/\d{2}\/\d{2}$/,
        patternMessage: "تاریخ تولد را به شکل ۱۳۷۰/۰۵/۱۲ وارد کنید.",
      }),
      gender: strOptional({ label: "جنسیت", max: 20, latinDigits: true }),
    });

    return ok(await updateProfile(user.id, body));
  });
}
