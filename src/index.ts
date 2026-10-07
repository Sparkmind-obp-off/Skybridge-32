import { Hono } from "hono";
import { serveStatic } from "hono/cloudflare-workers";
const app = new Hono();
app.use("*", async (c, next) => {
  c.header("X-Content-Type-Options", "nosniff");
  c.header("Referrer-Policy", "no-referrer");
  c.header(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
  );
  c.header("Cache-Control", "no-cache");
  await next();
});
app.use("/static/*", serveStatic({ root: "./public" }));
app.get("/", (c) =>
  c.html(
    `<!doctype html><html lang="id" data-theme="system"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#2d5a48"><meta name="description" content="Pendamping persiapan 5K Haidar. Run/walk yang tenang, catatan lokal, dan timer offline."><meta name="apple-mobile-web-app-capable" content="yes"><link rel="manifest" href="/manifest.webmanifest"><link rel="icon" href="/static/icon-192.png"><link rel="apple-touch-icon" href="/static/icon-192.png"><link rel="stylesheet" href="/static/style.css"><title>Skybridge 32 — Personal 5K Race Coach</title></head><body><a class="skip-link" href="#main-content">Lewati ke konten</a><div id="app"><p>Menyiapkan Skybridge 32…</p></div><noscript>Aktifkan JavaScript untuk timer dan penyimpanan lokal.</noscript><dialog id="log-dialog" aria-label="Catatan sesi"></dialog><div id="toast" class="toast" role="status" aria-live="polite"></div><script src="/static/app.js" defer></script></body></html>`,
  ),
);
export default app;
