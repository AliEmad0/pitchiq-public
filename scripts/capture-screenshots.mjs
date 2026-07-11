// Regenerate portfolio screenshots + social-preview (TASK-901).
// Run: node scripts/capture-screenshots.mjs   (captures the LIVE site, dark theme, 1440x900)
// Override the target with SITE_URL=... node scripts/capture-screenshots.mjs
import { chromium } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = process.env.SITE_URL || "https://pitchiq-pl.vercel.app";
const OUT = path.join(ROOT, "docs", "screenshots");

const lb = JSON.parse(await readFile(path.join(ROOT, "data", "leaderboards-2025.json"), "utf8"));
const a = lb.topScorers[0].playerId; // Haaland
const b = lb.topAssists[0].playerId; // Bruno

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  colorScheme: "dark",
});
const page = await ctx.newPage();

async function shot(url, file, waitFor) {
  await page.goto(`${SITE}${url}`, { waitUntil: "networkidle" });
  if (waitFor) await page.waitForSelector(waitFor, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, file) });
  console.log("captured", file);
}

await shot("/", "dashboard.png", "table");
await shot("/teams/42", "team-profile.png", "h1");
await shot(`/compare?a=${a}&b=${b}`, "compare.png", "svg.recharts-surface");

await page.setViewportSize({ width: 1280, height: 640 });
await page.setContent(`<!doctype html><html><body style="margin:0">
<div style="width:1280px;height:640px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;background:#0c0a14;background-image:radial-gradient(at 30% 20%,rgba(201,29,187,.18),transparent 55%);font-family:system-ui,'Segoe UI',sans-serif;color:#fff">
  <div style="position:relative;width:140px;height:140px;border-radius:38px;background-image:linear-gradient(135deg,#e22fd0,#a3179a);display:flex;align-items:center;justify-content:center">
    <div style="position:absolute;width:6px;height:96px;background:rgba(255,255,255,.92)"></div>
    <div style="width:50px;height:50px;border-radius:50%;border:6px solid rgba(255,255,255,.92)"></div>
  </div>
  <div style="font-size:96px;font-weight:800;letter-spacing:-2px">PitchIQ</div>
  <div style="font-size:34px;opacity:.7">Premier League, decoded.</div>
</div></body></html>`);
await page.screenshot({ path: path.join(ROOT, "docs", "social-preview.png") });
console.log("captured social-preview.png");

await browser.close();
