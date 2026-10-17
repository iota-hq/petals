// scripts/shot.ts
import { chromium } from "playwright-core";
var base = process.env.BASE ?? "http://localhost:5173";
var browser = await chromium.launch({ executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe" });
var page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
var errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => m.type() === "error" && errors.push(`console: ${m.text()}`));
await page.goto(base + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
await page.screenshot({ path: "test-artifacts/landing.png" });
await page.screenshot({ path: "test-artifacts/landing-full.png", fullPage: true });
await page.goto(base + "/#/projects", { waitUntil: "networkidle" });
await page.screenshot({ path: "test-artifacts/dashboard.png" });
console.log("screenshots done, console errors:", errors.length);
for (const e of errors)
  console.log(" ", e);
await browser.close();
