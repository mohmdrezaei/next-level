import type { NextRequest } from "next/server";

import { requireApiAdmin } from "@/server/api-auth";
import { ok, readJson, withApi } from "@/server/http";
import {
  DEFAULT_SETTINGS,
  getSettings,
  resetSettings,
  updateSettings,
  type SettingsPatch,
} from "@/server/repositories/settings";

export const dynamic = "force-dynamic";

/**
 * GET /api/settings
 *
 * Public: the storefront needs the store identity, shipping prices and the
 * free-shipping threshold to render the header, footer and cart totals.
 */
export async function GET() {
  return withApi(async () => ok(await getSettings()));
}

/**
 * PUT /api/settings (admin only)
 * Body: a partial settings patch — only the supplied keys are updated.
 */
export async function PUT(request: NextRequest) {
  return withApi(async () => {
    await requireApiAdmin();
    const patch = await readJson<SettingsPatch>(request);
    return ok(await updateSettings(patch));
  });
}

/** DELETE /api/settings (admin only) — restore the shipped defaults. */
export async function DELETE() {
  return withApi(async () => {
    await requireApiAdmin();
    return ok({ ...(await resetSettings()), defaults: DEFAULT_SETTINGS });
  });
}
