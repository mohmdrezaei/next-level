import type { NextRequest } from "next/server";

import { requireApiAdmin } from "@/server/api-auth";
import { ok, withApi } from "@/server/http";
import { email, parseBody, phoneOptional, str, strOptional } from "@/server/validate";
import {
  listContactMessages,
  submitContactMessage,
} from "@/server/repositories/messaging";

export const dynamic = "force-dynamic";

/** GET /api/contact (admin only) — inbox. */
export async function GET() {
  return withApi(async () => {
    await requireApiAdmin();
    return ok(await listContactMessages());
  });
}

/**
 * POST /api/contact
 * Body: `{ name, email, phone?, subject?, message }`
 *
 * Public and unauthenticated, so every field is length-capped and stripped of
 * markup before it reaches the inbox table.
 */
export async function POST(request: NextRequest) {
  return withApi(async () => {
    const body = await parseBody(request, {
      name: str({ label: "نام", min: 3, max: 80 }),
      email: email(),
      phone: phoneOptional(),
      subject: strOptional({ label: "موضوع", max: 120 }),
      message: str({ label: "متن پیام", min: 10, max: 5000 }),
    });

    const message = await submitContactMessage(body);

    return ok(
      { ...message, message: "پیام شما ثبت شد. کارشناسان آتلیه به‌زودی پاسخ می‌دهند." },
      undefined,
      201,
    );
  });
}
