import { chromium } from "playwright";
import assert from "node:assert/strict";
import { readFile, mkdir } from "node:fs/promises";
const base = process.env.TEST_URL || "http://localhost:3000";
await mkdir("test-results", { recursive: true });
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  timezoneId: "Asia/Jakarta",
  reducedMotion: "reduce",
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (err) => errors.push(err.message));
const check = (name) => console.log("PASS", name);
async function navigate(hash) {
  await page.goto(base + "/#" + hash);
  await page.waitForSelector("#main-content h1");
}
try {
  await page.goto(base);
  await page.waitForSelector(".welcome");
  assert.match(await page.locator("h1").innerText(), /Haidar/);
  check("fresh install and dashboard");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  check("service worker controls app");
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
  check("mobile layout without overflow");
  await page.locator('[data-action="mager"]').click();
  await page.waitForSelector("#timer-countdown");
  assert.equal(await page.locator("#timer-countdown").innerText(), "10:00");
  check("Mager Mode starts ten minutes");
  await page.waitForTimeout(1250);
  await page.locator('[data-action="pause"]').click();
  const paused = await page.locator("#timer-countdown").innerText();
  await page.waitForTimeout(1200);
  assert.equal(await page.locator("#timer-countdown").innerText(), paused);
  check("timer pauses");
  await page.locator('[data-action="resume"]').click();
  await page.waitForTimeout(1250);
  assert.notEqual(await page.locator("#timer-countdown").innerText(), paused);
  check("timer resumes");
  await page.locator('a[href="#progress"]').first().click();
  await page.locator('a[href="#coach"]').first().click();
  assert.match(await page.locator(".timer-card .pill").innerText(), /Mager/);
  check("navigation rerender preserves timer");
  await page.reload();
  await page.waitForSelector('[data-action="resume"]');
  assert.match(await page.locator(".safety-warning").innerText(), /dipulihkan/);
  check("refresh recovers timer paused");
  await page.locator('[data-action="end"]').click();
  await page.locator('[name="notes"]').fill("Sesi QA singkat");
  await page.locator('#log-form button[type="submit"]').click();
  await page.waitForSelector(".log-list article");
  assert.match(await page.locator(".log-list").innerText(), /Sesi QA singkat/);
  check("save log and progress updates");
  await page.reload();
  await page.waitForSelector(".log-list article");
  assert.match(await page.locator(".log-list").innerText(), /Sesi QA singkat/);
  check("saved log survives refresh");
  await navigate("prep");
  await page.locator('[data-check="0"]').check();
  await page.waitForTimeout(100);
  await page.reload();
  await page.waitForSelector('[data-check="0"]');
  assert.ok(await page.locator('[data-check="0"]').isChecked());
  check("checklist persists");
  await navigate("settings");
  const downloadPromise = page.waitForEvent("download");
  await page.locator('[data-action="export"]').click();
  const download = await downloadPromise;
  const backup = JSON.parse(await readFile(await download.path(), "utf8"));
  assert.equal(backup.version, 1);
  assert.equal(backup.logs.length, 1);
  assert.equal(backup.checklist[0].done, true);
  check("export valid JSON");
  await page
    .locator("#import-file")
    .setInputFiles({
      name: "bad.json",
      mimeType: "application/json",
      buffer: Buffer.from('{"version":99}'),
    });
  await page.waitForTimeout(100);
  assert.match(await page.locator("#toast").innerText(), /tidak valid/);
  check("malformed import rejected");
  page.once("dialog", (d) => d.accept());
  await page.locator('[data-action="reset"]').click();
  await page.waitForSelector(".welcome");
  await navigate("progress");
  assert.equal(await page.locator(".log-list article").count(), 0);
  await navigate("prep");
  assert.ok(!(await page.locator('[data-check="0"]').isChecked()));
  check("delete/reset works");
  await navigate("settings");
  page.once("dialog", (d) => d.accept());
  await page
    .locator("#import-file")
    .setInputFiles({
      name: "backup.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(backup)),
    });
  await page.waitForTimeout(250);
  await navigate("progress");
  assert.equal(await page.locator(".log-list article").count(), 1);
  check("valid import restores logs");
  await context.setOffline(true);
  await navigate("today");
  await page.locator('[data-action="mager"]').click();
  await page.waitForSelector('[data-action="pause"]');
  await page.locator('[data-action="end"]').click();
  await page.locator('#log-form button[type="submit"]').click();
  await page.waitForSelector(".log-list article");
  assert.equal(await page.locator(".log-list article").count(), 2);
  await navigate("prep");
  await page.locator('[data-check="1"]').check();
  await page.waitForTimeout(100);
  await page.reload();
  await page.waitForSelector('[data-check="1"]');
  assert.ok(await page.locator('[data-check="1"]').isChecked());
  check("offline shell, timer, save, checklist and reload");
  await context.setOffline(false);
  await navigate("race");
  await page.locator('[data-action="race-start"]').click();
  await page.waitForSelector("#race-cot");
  await page.waitForTimeout(1100);
  await page.locator('[data-action="pause"]').click();
  const cot = await page.locator("#race-cot").innerText();
  await page.waitForTimeout(1200);
  assert.notEqual(await page.locator("#race-cot").innerText(), cot);
  check("COT continues while race intervals paused");
  await page.locator('[data-action="end"]').click();
  await page.locator('[name="pain"]').fill("5");
  await page.locator('#log-form button[type="submit"]').click();
  await page.waitForSelector(".log-list article");
  await navigate("today");
  assert.ok(await page.locator('[data-action="start"]').isDisabled());
  assert.ok(await page.locator('[data-action="mager"]').isDisabled());
  check("pain safety gate blocks exercise");
  await navigate("settings");
  await page.selectOption("#theme-select", "dark");
  await page.reload();
  await page.waitForSelector("#theme-select");
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
  check("theme persists");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await navigate("today");
  await page.screenshot({
    path: "test-results/desktop-dark.png",
    fullPage: true,
  });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await navigate("settings");
  await page.selectOption("#theme-select", "light");
  await navigate("today");
  await page.screenshot({ path: "test-results/desktop.png", fullPage: true });
  check("desktop and dark mode layout");
  const other = await context.newPage();
  await other.goto(base);
  await other.waitForSelector(".safety-warning");
  assert.match(await other.locator(".safety-warning").innerText(), /tab lain/);
  await other.close();
  check("second tab cannot overwrite data");
  await navigate("settings");
  page.once("dialog", (d) => d.accept());
  await page.locator('[data-action="reset"]').click();
  await page.waitForSelector(".welcome");
  await page.clock.install();
  await page.locator('[data-action="mager"]').click();
  await page.waitForSelector("#timer-countdown");
  await page.clock.fastForward(600_500);
  await page.waitForSelector('[data-action="log"]');
  assert.equal(await page.locator("#timer-countdown").innerText(), "00:00");
  await page.locator('[data-action="log"]').click();
  await page.locator('#log-form button[type="submit"]').click();
  await page.waitForSelector(".log-list article");
  assert.equal(
    await page
      .locator(".stats-grid article")
      .first()
      .locator("strong")
      .innerText(),
    "1",
  );
  assert.equal(
    await page
      .locator(".stats-grid article")
      .nth(1)
      .locator("strong")
      .innerText(),
    "10",
  );
  check("completed ten minute session updates progress");
  assert.deepEqual(errors, []);
  check("no uncaught browser exceptions");
  console.log("Browser QA complete:", base);
} finally {
  await browser.close();
}
