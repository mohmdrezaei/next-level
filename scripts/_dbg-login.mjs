const pw = await import(
  "file:///C:/Users/admin/AppData/Local/npm-cache/_npx/f0a362733743bae2/node_modules/playwright/index.js"
);
const chromium = pw.chromium ?? pw.default?.chromium;
const browser = await chromium.launch();
const page = await browser.newPage();
page.on("console", (m) => console.log("CONSOLE:", m.type(), m.text().slice(0, 200)));
page.on("pageerror", (e) => console.log("PAGEERROR:", String(e).slice(0, 300)));
await page.goto("http://localhost:3000/login?next=%2Fadmin%2Fproducts%2Fnew", {
  waitUntil: "networkidle",
});
await page.getByRole("tab", { name: /ایمیل/ }).click();
await page.fill('input[name="email"]', "admin@nextlevel.test");
await page.fill('input[name="password"]', "nextlevel1234");
await page.getByRole("button", { name: /ورود به حساب/ }).click();
await page.waitForTimeout(4000);
console.log("URL after login attempt:", page.url());

await page.goto("http://localhost:3000/admin/products/new", { waitUntil: "networkidle" });
console.log("URL on form:", page.url());
console.log("file inputs:", await page.locator('input[type="file"]').count());
console.log("BODY:", (await page.locator("body").innerText()).slice(0, 400));
await browser.close();
