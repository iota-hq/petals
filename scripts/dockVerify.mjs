// scripts/dockVerify.ts
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
  localStorage.setItem("petal.projects.v1", JSON.stringify([{ id: "dock1", name: "Dock", createdAt: Date.now(), updatedAt: Date.now() }]));
});
await page.goto("http://localhost:5173/board/dock1");
await page.waitForTimeout(900);
await page.keyboard.press("r");
await page.mouse.move(600, 300);
await page.mouse.down();
for (let i = 1;i <= 5; i++)
  await page.mouse.move(600 + i * 40, 300 + i * 70);
await page.mouse.up();
await page.waitForTimeout(300);
var zoomOf = () => page.evaluate(() => {
  const root = document.querySelector("[data-canvas-root]");
  const world = root?.firstElementChild;
  const m = /scale\(([\d.]+)\)/.exec(world?.style.transform ?? "");
  return m ? Number(m[1]) : null;
});
var zoomBefore = await zoomOf();
var dragBtn = page.locator('[aria-label="Drag canvas to fill the screen"]');
ok(await dragBtn.count() === 1, "toolbar drag-to-fill button present");
await dragBtn.click();
await page.waitForTimeout(200);
ok(await page.locator("[data-dock-zone]").count() === 6, "six thin strips appear");
await page.mouse.move(270, 450);
await page.waitForTimeout(120);
var leftBg = await page.evaluate(() => document.querySelector('[data-dock-zone="left"]')?.className ?? "");
ok(/bg-\[#f472b6\]\/20/.test(leftBg), "left strip lights on hover");
await page.mouse.move(900, 500);
await page.mouse.down();
for (let i = 1;i <= 6; i++)
  await page.mouse.move(900 - i * 105, 500);
await page.mouse.up();
await page.waitForTimeout(500);
var zoomAfter = await zoomOf();
var rootH = await page.evaluate(() => document.querySelector("[data-canvas-root]")?.clientHeight ?? 0);
var expected = (rootH - 48) / 350;
ok(zoomAfter != null && Math.abs(zoomAfter - expected) < 0.02, `left drop fits full height (zoom ${zoomAfter}, expected ~${expected.toFixed(3)})`);
ok(await page.locator("[data-dock-zone]").count() === 0, "mode turns off after docking");
await dragBtn.click();
await page.waitForTimeout(150);
ok(await page.locator("[data-dock-zone]").count() === 6, "re-toggle shows strips again");
await page.mouse.move(900, 500);
await page.mouse.down();
for (let i = 1;i <= 6; i++)
  await page.mouse.move(900 + i * 55, 500);
await page.mouse.up();
await page.waitForTimeout(500);
ok(await page.locator("[data-dock-zone]").count() === 0, "right drop docks and closes mode");
await page.screenshot({ path: "test-artifacts/dock-right.png" });
console.log(`console/page errors: ${errors.length}`);
ok(errors.length === 0, "no console/page errors");
await browser.close();
if (failures) {
  console.log(`
${failures} FAILURES`);
  process.exit(1);
}
console.log(`
DOCK CHECKS PASSED`);
