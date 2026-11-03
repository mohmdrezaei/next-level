/**
 * Media colour handling for light mode.
 *
 * Every product/collection/hero visual shipped in `public/` is generated as a
 * dark editorial composition (see scripts/generate-art.mjs). Light mode inverts
 * those assets so they sit inside light surfaces — but real photographs must
 * never be inverted: an uploaded product photo stored as a data URL, a remote
 * Unsplash URL, or a user avatar has to keep its true colours.
 *
 * Only assets under `/products/`, `/collections/` and `/art/` are generated
 * art, so only those opt in to the inversion defined in globals.css.
 */
const GENERATED_ART_PREFIXES = ["/products/", "/collections/", "/art/"];

/** True when `src` points at locally generated artwork rather than a photo. */
export function isGeneratedArt(src: string | undefined | null): boolean {
  if (!src) return false;
  return GENERATED_ART_PREFIXES.some((prefix) => src.startsWith(prefix));
}

/**
 * Class that tells light mode whether this image may be inverted.
 *
 * - `media-invertible` → generated art, inverted in light mode.
 * - `media-natural`    → real photograph, always keeps its true colours.
 */
export function mediaClassFor(src: string | undefined | null): string {
  return isGeneratedArt(src) ? "media-invertible" : "media-natural";
}
