/**
 * Generates the editorial SVG artwork used across the boutique.
 *
 * Every product image, collection cover and hero visual is produced locally so
 * the storefront ships with a coherent art direction and zero external image
 * dependencies. Run with:  node scripts/generate-art.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "public");
const ART_DIR = path.join(PUBLIC_DIR, "art");
const PRODUCT_DIR = path.join(PUBLIC_DIR, "products");

/* -------------------------------------------------------------------------- */
/*  Deterministic helpers                                                     */
/* -------------------------------------------------------------------------- */

function hash(seed) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed) {
  let state = hash(seed) || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 4294967296;
  };
}

/* -------------------------------------------------------------------------- */
/*  Colour                                                                    */
/* -------------------------------------------------------------------------- */

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? value.split("").map((c) => c + c).join("") : value;
  return [0, 2, 4].map((index) => parseInt(full.slice(index, index + 2), 16));
}

function rgbToHex([r, g, b]) {
  return `#${[r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")}`;
}

function mix(a, b, ratio) {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return rgbToHex([r1 + (r2 - r1) * ratio, g1 + (g2 - g1) * ratio, b1 + (b2 - b1) * ratio]);
}

function luminance(hex) {
  const [r, g, b] = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

const INK = "#0b0b0d";
const GOLD = "#c8a24c";

/* -------------------------------------------------------------------------- */
/*  Garment line-art glyphs (200 x 260 local space)                           */
/* -------------------------------------------------------------------------- */

const stroke = (d, extra = "") =>
  `<path d="${d}" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round" ${extra} />`;

const circle = (cx, cy, r, extra = "") =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="currentColor" stroke-width="2.4" ${extra} />`;

const GLYPHS = {
  coat: () =>
    [
      stroke("M58,28 L100,46 L142,28 L170,54 L162,100 L148,100 L148,242 L52,242 L52,100 L38,100 L30,54 Z"),
      stroke("M100,46 L84,74 L100,100 L116,74 Z"),
      stroke("M52,168 L148,168"),
      stroke("M86,24 L100,46 L114,24"),
    ].join(""),
  suit: () =>
    [
      stroke("M58,28 L100,46 L142,28 L168,52 L160,96 L148,96 L148,198 L52,198 L52,96 L40,96 L32,52 Z"),
      stroke("M100,46 L84,72 L100,98 L116,72 Z"),
      stroke("M64,150 L84,150"),
      circle(100, 164, 3),
      circle(100, 182, 3),
    ].join(""),
  shirt: () =>
    [
      stroke("M62,26 L100,44 L138,26 L166,48 L158,86 L146,86 L146,216 L54,216 L54,86 L42,86 L34,48 Z"),
      stroke("M86,22 L100,44 L114,22"),
      stroke("M100,46 L100,216"),
      ...[52, 82, 112, 142, 172].map((y) => circle(100, y, 2.6)),
    ].join(""),
  knitwear: () =>
    [
      stroke("M58,30 L86,20 L100,38 L114,20 L142,30 L172,66 L172,152 L148,152 L148,212 L52,212 L52,152 L28,152 L28,66 Z"),
      stroke("M86,20 Q100,38 114,20"),
      stroke("M28,132 L48,132"),
      stroke("M152,132 L172,132"),
      stroke("M52,196 L148,196"),
    ].join(""),
  trousers: () =>
    [
      stroke("M54,32 L146,32 L150,62 L142,238 L112,238 L100,118 L88,238 L58,238 L50,62 Z"),
      stroke("M54,54 L146,54"),
      stroke("M100,118 L100,238"),
    ].join(""),
  footwear: () =>
    [
      stroke("M26,170 Q26,140 56,130 L88,116 Q106,108 120,114 L162,138 Q184,150 184,172 L184,180 Q184,190 172,190 L38,190 Q26,190 26,180 Z"),
      stroke("M70,124 L96,140"),
      stroke("M82,116 L108,132"),
      stroke("M96,110 L120,126"),
    ].join(""),
  accessories: () =>
    [
      stroke("M46,96 L154,96 L166,222 L34,222 Z"),
      stroke("M76,96 Q100,42 124,96"),
      stroke("M46,142 L154,142"),
      circle(100, 168, 5),
    ].join(""),
  cap: () =>
    [
      stroke("M44,152 Q44,72 100,72 Q156,72 156,152"),
      stroke("M44,152 L186,152 Q186,178 150,178 L44,178 Z"),
      stroke("M44,152 Q44,164 44,178"),
    ].join(""),
  scarf: () =>
    [
      stroke("M62,22 L138,22 L138,238 L62,238 Z"),
      stroke("M82,22 Q76,130 84,238"),
      stroke("M100,22 Q106,130 100,238"),
      stroke("M118,22 Q114,130 118,238"),
      stroke("M62,22 L138,22"),
    ].join(""),
  watch: () =>
    [
      stroke("M84,18 L116,18 L116,92 L84,92 Z"),
      stroke("M84,168 L116,168 L116,242 L84,242 Z"),
      circle(100, 130, 44),
      circle(100, 130, 33),
      stroke("M100,130 L100,106"),
      stroke("M100,130 L118,142"),
    ].join(""),
  belt: () =>
    [
      stroke("M26,108 L174,108 L174,152 L26,152 Z"),
      stroke("M116,108 L116,152"),
      stroke("M116,122 L166,122 L166,138 L116,138"),
      circle(140, 130, 4),
    ].join(""),
};

const CATEGORY_GLYPH = {
  outerwear: "coat",
  suits: "suit",
  shirts: "shirt",
  knitwear: "knitwear",
  trousers: "trousers",
  footwear: "footwear",
  accessories: "accessories",
};

/* -------------------------------------------------------------------------- */
/*  Composition                                                               */
/* -------------------------------------------------------------------------- */

function grain(id) {
  return `
  <filter id="${id}">
    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" />
    <feColorMatrix type="saturate" values="0" />
  </filter>`;
}

/**
 * Builds one editorial composition: tonal background, spotlight, fabric bands,
 * a centred garment line drawing, vignette and film grain.
 */
function composition({
  width = 800,
  height = 1000,
  base,
  accent = GOLD,
  seed = "noir",
  glyph = "coat",
  glyphScale = 1,
  glyphOpacity = 0.62,
  label,
  variant = 0,
}) {
  const random = rng(`${seed}-${variant}`);
  const second = mix(base, accent, 0.12 + random() * 0.12);
  const deep = mix(base, "#000000", 0.42);
  const light = mix(base, "#ffffff", 0.1 + random() * 0.08);
  const uid = `g${hash(`${seed}${variant}`) % 100000}`;

  const bandCount = 5;
  const bands = Array.from({ length: bandCount }, (_, index) => {
    const y = height * (0.12 + (index / bandCount) * 0.8) + random() * 26;
    const opacity = 0.035 + random() * 0.05;
    return `<rect x="-10%" y="${y.toFixed(0)}" width="120%" height="${(6 + random() * 16).toFixed(0)}" fill="${light}" opacity="${opacity.toFixed(3)}" />`;
  }).join("");

  const glowX = variant % 2 === 0 ? 30 : 68;
  const glowY = variant === 2 ? 62 : 26;

  const glyphMarkup = (GLYPHS[glyph] ?? GLYPHS.coat)();
  const scale = (height / 1000) * 1.55 * glyphScale;
  const glyphY = height * 0.5 - 260 * scale * 0.5 + height * 0.03;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img">
  <defs>
    <linearGradient id="bg${uid}" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0%" stop-color="${deep}" />
      <stop offset="46%" stop-color="${base}" />
      <stop offset="100%" stop-color="${second}" />
    </linearGradient>
    <radialGradient id="glow${uid}" cx="${glowX}%" cy="${glowY}%" r="62%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.3" />
      <stop offset="55%" stop-color="${accent}" stop-opacity="0.06" />
      <stop offset="100%" stop-color="${accent}" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="vig${uid}" cx="50%" cy="48%" r="76%">
      <stop offset="55%" stop-color="#000000" stop-opacity="0" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0.55" />
    </radialGradient>
    ${grain(`gr${uid}`)}
  </defs>

  <rect width="${width}" height="${height}" fill="url(#bg${uid})" />
  ${bands}
  <rect width="${width}" height="${height}" fill="url(#glow${uid})" />

  <g transform="translate(${(width / 2 - 100 * scale).toFixed(1)}, ${glyphY.toFixed(1)}) scale(${scale.toFixed(4)})"
     color="${mix(accent, "#ffffff", 0.24)}" opacity="${glyphOpacity}">
    ${glyphMarkup}
  </g>

  <rect width="${width}" height="${height}" fill="url(#vig${uid})" />
  <rect width="${width}" height="${height}" filter="url(#gr${uid})" opacity="0.16" style="mix-blend-mode:overlay" />

  <g opacity="0.5">
    <rect x="${(width * 0.06).toFixed(0)}" y="${(height - 118).toFixed(0)}" width="${(width * 0.16).toFixed(0)}" height="1.5" fill="${accent}" />
    <text x="${(width * 0.06).toFixed(0)}" y="${(height - 86).toFixed(0)}" font-family="Vazirmatn, system-ui, sans-serif" font-size="${(width * 0.026).toFixed(1)}" letter-spacing="${(width * 0.012).toFixed(1)}" fill="${mix(accent, "#ffffff", 0.35)}" direction="ltr">NOIR</text>
    ${label ? `<text x="${(width * 0.06).toFixed(0)}" y="${(height - 56).toFixed(0)}" font-family="Vazirmatn, system-ui, sans-serif" font-size="${(width * 0.023).toFixed(1)}" fill="${mix(accent, "#ffffff", 0.1)}" opacity="0.75">${label}</text>` : ""}
  </g>
</svg>`;
}

/* -------------------------------------------------------------------------- */
/*  Catalogue parsing                                                         */
/* -------------------------------------------------------------------------- */

function readCatalogue() {
  const file = path.join(ROOT, "src", "features", "products", "data", "catalog.ts");
  const source = fs.readFileSync(file, "utf8");
  const blocks = source.split(/\n  \{\n    id: "p-/).slice(1);

  return blocks
    .map((block) => {
      const slug = block.match(/slug: "([^"]+)"/)?.[1];
      const category = block.match(/category: "([^"]+)"/)?.[1];
      const hex = block.match(/colors: \[\["[^"]+", "(#[0-9a-fA-F]{3,6})"/)?.[1];
      if (!slug || !category) return null;
      return { slug, category, color: hex ?? "#2b2b31" };
    })
    .filter(Boolean);
}

/* -------------------------------------------------------------------------- */
/*  Write                                                                     */
/* -------------------------------------------------------------------------- */

fs.mkdirSync(ART_DIR, { recursive: true });
fs.mkdirSync(PRODUCT_DIR, { recursive: true });

const products = readCatalogue();
let written = 0;

for (const product of products) {
  const glyph = CATEGORY_GLYPH[product.category] ?? "coat";
  for (let variant = 0; variant < 3; variant += 1) {
    const svg = composition({
      base: mix(product.color, INK, variant === 0 ? 0.45 : variant === 1 ? 0.62 : 0.3),
      accent: mix(product.color, GOLD, variant === 1 ? 0.55 : 0.2),
      seed: product.slug,
      glyph,
      variant,
      glyphScale: variant === 1 ? 0.82 : 1,
      glyphOpacity: variant === 2 ? 0.42 : 0.6,
    });
    fs.writeFileSync(path.join(PRODUCT_DIR, `${product.slug}-${variant + 1}.svg`), svg, "utf8");
    written += 1;
  }
}

// Hero
fs.writeFileSync(
  path.join(ART_DIR, "hero-main.svg"),
  composition({
    width: 900,
    height: 1125,
    base: "#191713",
    accent: GOLD,
    seed: "hero-main",
    glyph: "coat",
    glyphScale: 1.18,
    glyphOpacity: 0.5,
    variant: 0,
  }),
  "utf8",
);
written += 1;

// Collections
const COLLECTIONS = [
  ["autumn-winter", "#3b2a1c", "knitwear"],
  ["city-tailoring", "#22293d", "suit"],
  ["essential-knitwear", "#2c2c31", "knitwear"],
  ["leather-study", "#38271a", "accessories"],
  ["final-cuts", "#3a201c", "coat"],
];
for (const [slug, base, glyph] of COLLECTIONS) {
  fs.writeFileSync(
    path.join(ART_DIR, `collection-${slug}.svg`),
    composition({ width: 900, height: 620, base, accent: GOLD, seed: slug, glyph, glyphScale: 0.62, variant: 1 }),
    "utf8",
  );
  written += 1;
}

// Editorial panels
fs.writeFileSync(
  path.join(ART_DIR, "editorial-atelier.svg"),
  composition({ width: 900, height: 1100, base: "#1c1a17", accent: GOLD, seed: "atelier", glyph: "shirt", glyphScale: 1.05, variant: 2 }),
  "utf8",
);
fs.writeFileSync(
  path.join(ART_DIR, "editorial-fabric.svg"),
  composition({ width: 800, height: 800, base: "#232019", accent: GOLD, seed: "fabric", glyph: "scarf", glyphScale: 1.0, variant: 0 }),
  "utf8",
);
fs.writeFileSync(
  path.join(ART_DIR, "editorial-tailor.svg"),
  composition({ width: 800, height: 800, base: "#1b1f2a", accent: GOLD, seed: "tailor", glyph: "watch", glyphScale: 1.0, variant: 1 }),
  "utf8",
);
written += 3;

// Categories
const CATEGORY_BASES = {
  outerwear: "#241f19",
  suits: "#1d2231",
  shirts: "#232320",
  knitwear: "#282622",
  trousers: "#1f2224",
  footwear: "#241d18",
  accessories: "#20201f",
};
for (const [slug, glyph] of Object.entries(CATEGORY_GLYPH)) {
  fs.writeFileSync(
    path.join(ART_DIR, `category-${slug}.svg`),
    composition({ width: 640, height: 800, base: CATEGORY_BASES[slug], accent: GOLD, seed: slug, glyph, glyphScale: 0.95, variant: 0 }),
    "utf8",
  );
  written += 1;
}

// Auth backdrop + empty states
fs.writeFileSync(
  path.join(ART_DIR, "auth-backdrop.svg"),
  composition({ width: 900, height: 1200, base: "#161513", accent: GOLD, seed: "auth", glyph: "coat", glyphScale: 1.35, glyphOpacity: 0.28, variant: 2 }),
  "utf8",
);
written += 1;

console.log(`Generated ${written} SVG assets from ${products.length} products.`);
