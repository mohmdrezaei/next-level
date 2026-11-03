import { destroySession } from "@/server/auth/session";
import { ok, withApi } from "@/server/http";

export const dynamic = "force-dynamic";

/** POST /api/auth/logout — clears the session row and the cookie. */
export async function POST() {
  return withApi(async () => {
    await destroySession();
    return ok({ session: false });
  });
}
