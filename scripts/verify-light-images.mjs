/**
 * Reproduces + verifies the "uploaded product photo changes colour in light mode" issue.
 *
 * Run against a live dev server:  node scripts/verify-light-images.mjs
 */
const pw = await import(
  process.env.PW_MODULE ??
    "file:///C:/Users/admin/AppData/Local/npm-cache/_npx/f0a362733743bae2/node_modules/playwright/index.js"
);
const chromium = pw.chromium ?? pw.default?.chromium;

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const ADMIN_EMAIL = "admin@nextlevel.test";
const ADMIN_PASSWORD = "nextlevel1234";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });

// 1. Sign in as admin (demo session cookie). -------------------------------
await page.goto(`${BASE}/login?next=%2Fadmin%2Fproducts%2Fnew`, { waitUntil: "networkidle" });
await page.getByRole("tab", { name: /ایمیل/ }).click();
await page.fill('input[name="email"]', ADMIN_EMAIL);
await page.fill('input[name="password"]', ADMIN_PASSWORD);
await page.getByRole("button", { name: /ورود به حساب/ }).click();
// Server actions navigate client-side; give the redirect a moment to settle.
await page.waitForFunction(() => location.pathname.startsWith("/admin"), null, { timeout: 30000 });
console.log("after login ->", page.url());

// 2. Force light theme. ----------------------------------------------------
const forceLight = async () => {
  await page.evaluate(() => {
    localStorage.setItem("theme", "light");
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
  });
};

await page.goto(`${BASE}/admin/products/new`, { waitUntil: "networkidle" });
await forceLight();
console.log("html classes:", await page.evaluate(() => document.documentElement.className));

// 3. "Upload" a known-colour JPEG through the real file input. -------------
const dataUrl = await page.evaluate(() => {
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 400;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#c8102e";
  ctx.fillRect(0, 0, 400, 400);
  return canvas.toDataURL("image/jpeg", 0.95);
});

await page.setInputFiles('input[type="file"]', {
  name: "product-red.jpg",
  mimeType: "image/jpeg",
  buffer: Buffer.from(dataUrl.split(",")[1], "base64"),
});

const previewImg = page.locator("ul li img").first();
await previewImg.waitFor({ state: "attached" });
await previewImg.scrollIntoViewIfNeeded();
await page.waitForTimeout(800);

const before = await page.evaluate(() => {
  const el = document.querySelector("ul li img");
  return {
    filter: getComputedStyle(el).filter,
    className: el.className,
    mediaNatural: el.classList.contains("media-natural"),
  };
});
console.log("\nTHUMBNAIL (light mode) ->", JSON.stringify(before, null, 2));

// Sample the rendered pixel colour of the thumbnail.
const shot = await previewImg.screenshot();
const { createCanvas, loadImage } = { createCanvas: null, loadImage: null };

await page.screenshot({ path: "verify-light-thumb.png", clip: await previewImg.boundingBox() });

// 4. Regression check: generated art must still invert in light mode. ------
await page.goto(`${BASE}/shop`, { waitUntil: "networkidle" });
await forceLight();
await page.waitForTimeout(500);

const artCheck = await page.evaluate(() => {
  const imgs = Array.from(document.querySelectorAll("article img, section img"));
  const generated = imgs.find((el) => (el.getAttribute("src") ?? "").startsWith("/products/"));
  const upload = imgs.find((el) => (el.getAttribute("src") ?? "").startsWith("data:"));
  return {
    generatedArt: generated
      ? { src: generated.getAttribute("src"), filter: getComputedStyle(generated).filter }
      : "none on /shop",
    uploadsOnShop: upload ? "unexpected" : "none (expected)",
  };
});
console.log("\nART REGRESSION:", JSON.stringify(artCheck, null, 2));

console.log("\nScreenshots written: verify-light-thumb.png");
void shot;
void createCanvas;
void loadImage;

await browser.close();
