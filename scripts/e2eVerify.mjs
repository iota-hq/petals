// scripts/e2eVerify.ts
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
var URL = "http://localhost:5173";
var failures = 0;
var ok = (cond, label) => {
  console.log(cond ? `ok   ${label}` : `FAIL ${label}`);
  if (!cond)
    failures++;
};
var browser = await chromium.launch({ executablePath: exe, headless: true });
var page = await browser.newPage({ viewport: { width: 1520, height: 900 } });
var errors = [];
page.on("console", (m) => {
  if (m.type() === "error")
    errors.push(m.text());
});
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto(URL);
await page.evaluate(() => localStorage.clear());
await page.evaluate(() => {
  localStorage.setItem("petal.projects.v1", JSON.stringify([{ id: "e2etest1", name: "Browser Test", createdAt: Date.now(), updatedAt: Date.now() }]));
});
await page.goto(`${URL}/#/board/e2etest1`);
await page.waitForTimeout(900);
var nodeCount = () => page.locator("[data-layer-row]").count();
var onCanvas = (id) => page.locator(`[data-node-id="${id}"]:not([data-handle])`).count();
var draw = async (x1, y1, x2, y2) => {
  await page.mouse.move(x1, y1);
  await page.mouse.down();
  for (let i = 1;i <= 6; i++) {
    const t = i / 6;
    await page.mouse.move(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t);
    await page.waitForTimeout(12);
  }
  await page.mouse.up();
  await page.waitForTimeout(120);
};
var bgOf = async (id) => page.evaluate((nid) => {
  const el = document.querySelector(`[data-node-id="${nid}"]`);
  if (!el)
    return null;
  if (getComputedStyle(el).backgroundColor.startsWith("rgba(0, 0, 0, 0")) {
    for (const c of Array.from(el.children)) {
      const bg = getComputedStyle(c).backgroundColor;
      if (bg && !bg.startsWith("rgba(0, 0, 0, 0"))
        return bg;
    }
    return "transparent";
  }
  return getComputedStyle(el).backgroundColor;
}, id);
console.log("— draw rect 1 (tool key: r) —");
await page.keyboard.press("r");
await draw(450, 250, 600, 380);
var n1 = await nodeCount();
ok(n1 === 1, `one shape after first draw (count=${n1})`);
var id1 = await page.evaluate(() => document.querySelector("[data-node-id]")?.getAttribute("data-node-id"));
var bg1 = await bgOf(id1);
ok(bg1 === "rgb(217, 217, 217)", `rect1 default fill #D9D9D9 (got ${bg1})`);
await page.screenshot({ path: "test-artifacts/01-rect1.png" });
console.log("— draw rect 2: does rect 1 survive? (the reported vanish bug) —");
await page.keyboard.press("r");
await draw(640, 250, 760, 380);
var n2 = await nodeCount();
ok(n2 === 2, `two shapes after second draw (count=${n2})`);
ok(await onCanvas(id1) === 1, "rect 1 still on canvas after drawing rect 2");
console.log("— frame default fill —");
await page.keyboard.press("f");
await draw(820, 250, 1050, 500);
var n3 = await nodeCount();
ok(n3 === 3, `frame created (count=${n3})`);
var frameId = await page.evaluate(() => Array.from(document.querySelectorAll("[data-node-id]")).map((e) => e.getAttribute("data-node-id")).pop());
ok(await onCanvas(id1) === 1, "rect 1 still on canvas after drawing frame");
var frameBg = await bgOf(frameId);
ok(frameBg === "rgb(255, 255, 255)", `frame fill white (got ${frameBg})`);
await page.screenshot({ path: "test-artifacts/02-frame.png" });
console.log("— draw inside the frame: DOM nesting —");
await page.keyboard.press("r");
await draw(860, 290, 940, 350);
var n4 = await nodeCount();
ok(n4 === 4, `shape inside frame created (count=${n4})`);
var nested = await page.evaluate((fid) => !!document.querySelector(`[data-node-id="${fid}"] [data-node-id]`), frameId);
ok(nested, "inner shape is DOM-nested inside the frame");
console.log("   layers panel rows: " + await page.locator("[data-layer-row]").count());
await page.forceWaitingForSave?.();
await page.screenshot({ path: "test-artifacts/03-inside-frame.png" });
console.log("— deselect, then click back: the reported trigger —");
await page.mouse.click(300, 800);
await page.waitForTimeout(200);
var rowsAfterDeselect = await nodeCount();
ok(rowsAfterDeselect === 4, `layers rows intact after deselect (rows=${rowsAfterDeselect})`);
ok(await onCanvas(id1) === 1, "rect 1 still rendered after deselect");
await page.mouse.click(520, 310);
await page.waitForTimeout(200);
ok(await nodeCount() === 4, `rect 1 still in layers after re-click (rows=${await nodeCount()})`);
ok(await onCanvas(id1) === 1, "rect 1 still rendered after re-click");
var bgAfter = await bgOf(id1);
ok(bgAfter === "rgb(217, 217, 217)", `rect 1 fill intact after re-click (got ${bgAfter})`);
console.log("— draw new rect after the deselect cycle (creates broken per report) —");
await page.keyboard.press("r");
await draw(400, 500, 500, 560);
var rows5 = await nodeCount();
ok(rows5 === 5, `5 shapes after new rect (rows=${rows5})`);
var newBody = await page.evaluate(() => {
  const els = Array.from(document.querySelectorAll("[data-node-id]:not([data-handle])"));
  const last = els[els.length - 1];
  return getComputedStyle(last).backgroundColor;
});
ok(newBody === "rgb(217, 217, 217)", `freshly drawn rect after cycle has fill (got ${newBody})`);
console.log("   whole-page selection state screenshot");
console.log("— undo / redo —");
var before = await nodeCount();
await page.keyboard.press("Control+z");
await page.waitForTimeout(150);
ok(await nodeCount() === before - 1, `undo removes last shape (rows=${before - 1})`);
await page.keyboard.press("Control+Shift+z");
await page.waitForTimeout(150);
ok(await nodeCount() === before, "redo restores it (rows)");
await page.screenshot({ path: "test-artifacts/04-final.png" });
console.log(`
console/page errors while running: ${errors.length}`);
for (const e of errors.slice(0, 5))
  console.log("  error:", e.slice(0, 160));
await browser.close();
console.log(failures === 0 ? `
BROWSER CHECKS PASSED` : `
${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
