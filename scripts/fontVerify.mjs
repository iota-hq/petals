// scripts/fontVerify.ts
import { chromium } from "playwright-core";
import { existsSync, mkdirSync } from "node:fs";
var BROWSERS = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
];
var exe = BROWSERS.find(existsSync);
if (!exe) {
  console.error("No Edge/Chrome install found");
  process.exit(1);
}
mkdirSync("test-artifacts", { recursive: true });
var failures = 0;
var ok = (cond, label) => {
  console.log(cond ? `ok   ${label}` : `FAIL ${label}`);
  if (!cond)
    failures++;
};
var browser = await chromium.launch({ executablePath: exe, headless: true });
var page = await browser.newPage({ viewport: { width: 1520, height: 900 } });
var errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto("http://localhost:5173");
await page.evaluate(() => localStorage.clear());
await page.evaluate(() => {
  localStorage.setItem("petal.projects.v1", JSON.stringify([{ id: "fonttest1", name: "Font Test", createdAt: Date.now(), updatedAt: Date.now() }]));
});
await page.goto("http://localhost:5173/board/fonttest1");
await page.waitForTimeout(900);
await page.keyboard.press("t");
await page.mouse.click(500, 400);
await page.waitForTimeout(200);
await page.keyboard.type("Hello Petals");
await page.keyboard.press("Escape");
await page.waitForTimeout(300);
console.log("— text panel parity —");
var section = (t) => page.locator("aside >> text=" + t).first();
ok(await section("Outline").count() > 0, "Outline section present for text");
ok(await section("Fill").count() > 0, "Fill section present for text");
ok(await section("Shadow").count() > 0, "Shadow section present for text");
console.log("— outline round-trip on text —");
await section("Outline").click();
await page.waitForTimeout(250);
var outlineRow = page.locator("aside div", { hasText: /^Outline\s*$/ }).last();
await outlineRow.locator("button").last().click();
await page.waitForTimeout(500);
var hasStroke = await page.evaluate(() => {
  const raw = localStorage.getItem("petal.doc.v1.fonttest1");
  const nodes = JSON.parse(raw).nodes;
  return Object.values(nodes).some((s) => s.type === "text" && s.stroke);
});
ok(hasStroke, "outline add writes stroke onto the text shape");
await page.screenshot({ path: "test-artifacts/text-panel.png" });
console.log("— font picker —");
var trigger = page.locator('aside button[aria-haspopup="listbox"]').first();
await trigger.click();
await page.waitForTimeout(1800);
var search = page.locator('[role="listbox"] input');
ok(await search.count() === 1, "font list opens with search");
await search.fill("Inter");
await page.waitForTimeout(250);
var rows = page.locator('[role="listbox"] [role="option"]', { hasText: "Inter" });
ok(await rows.count() > 0, `search finds Inter (${await rows.count()} rows)`);
await rows.first().click();
await page.waitForTimeout(700);
var applied = await page.evaluate(() => {
  const raw = localStorage.getItem("petal.doc.v1.fonttest1");
  const nodes = JSON.parse(raw).nodes;
  const t = Object.values(nodes).find((s) => s.type === "text");
  return t?.fontFamily ?? "";
});
ok(applied.includes("Inter"), `fontFamily applied (${applied})`);
await page.screenshot({ path: "test-artifacts/font-picker.png" });
console.log(`console/page errors: ${errors.length}`);
ok(errors.length === 0, "no console/page errors");
await browser.close();
if (failures) {
  console.log(`
${failures} FAILURES`);
  process.exit(1);
}
console.log(`
FONT CHECKS PASSED`);
