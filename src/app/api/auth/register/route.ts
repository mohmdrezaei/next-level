import type { NextRequest } from "next/server";

import { createSessionForUser } from "@/server/auth/session";
import { ok, withApi } from "@/server/http";
import { createUser } from "@/server/repositories/users";
import { emailOptional, parseBody, phone, str } from "@/server/validate";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/register
 * Creates a shopper account and starts a session.
 * Body: `{ name, phone, email?, password }`
 *
 * The role is pinned to `customer` here; promotion to `admin` only ever happens
 * server-side (seed / database), never from a request body.
 */
export async function POST(request: NextRequest) {
  return withApi(async () => {
    const body = await parseBody(request, {
      name: str({ label: "نام و نام خانوادگی", min: 3, max: 80 }),
      phone: phone(),
      email: emailOptional(),
      password: str({ label: "رمز عبور", min: 6, max: 200, sanitize: false, trim: false }),
    });

    const user = await createUser({
      name: body.name,
      phone: body.phone,
      email: body.email,
      password: body.password,
      role: "customer",
    });

    await createSessionForUser(user.id);

    return ok({ user, session: true }, undefined, 201);
  });
}
