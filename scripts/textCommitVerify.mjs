// scripts/textCommitVerify.ts
import { chromium } from "playwright-core";
import { existsSync } from "node:fs";
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
  localStorage.setItem("petal.projects.v1", JSON.stringify([{ id: "txtedit1", name: "Txt Edit", createdAt: Date.now(), updatedAt: Date.now() }]));
});
await page.goto("http://localhost:5173/board/txtedit1");
await page.waitForTimeout(900);
await page.keyboard.press("t");
await page.mouse.click(500, 400);
await page.waitForTimeout(250);
await page.keyboard.type("Hello Petals");
var stillEditing = await page.locator('[contenteditable="true"]').count();
ok(stillEditing === 1, "text node is editable while typing");
await page.mouse.click(900, 700);
await page.waitForTimeout(350);
var editables = await page.locator('[contenteditable="true"]').count();
ok(editables === 0, "no editable element left after outside click (caret gone)");
var selectedOutline = await page.locator("[data-node-id] input").count();
var textEl = page.locator("[data-node-id]").first();
var boxVisible = await textEl.evaluate((el) => {
  const s = getComputedStyle(el);
  return s.opacity !== "0" && el.getClientRects().length > 0;
});
ok(boxVisible, "text node still on canvas after commit");
var saved = await page.evaluate(() => {
  const raw = localStorage.getItem("petal.doc.v1.txtedit1");
  const nodes = JSON.parse(raw).nodes;
  const t = Object.values(nodes).find((s) => s.text);
  return t?.text ?? "";
});
ok(saved === "Hello Petals", `committed text saved (${saved})`);
await page.keyboard.type("XYZ");
await page.waitForTimeout(400);
var saved2 = await page.evaluate(() => {
  const raw = localStorage.getItem("petal.doc.v1.txtedit1");
  const nodes = JSON.parse(raw).nodes;
  const t = Object.values(nodes).find((s) => s.text);
  return t?.text ?? "";
});
ok(saved2 === "Hello Petals", `typing after commit does not reach text (${saved2})`);
console.log(`console/page errors: ${errors.length}`);
ok(errors.length === 0, "no console/page errors");
await browser.close();
if (failures) {
  console.log(`
${failures} FAILURES`);
  process.exit(1);
}
console.log(`
TEXT COMMIT CHECKS PASSED`);
