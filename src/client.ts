import {
  defaults,
  dateKey,
  countdown,
  trainingDay,
  recommendation,
  safety,
  position,
  elapsed,
  total,
  pause,
  resume,
  format,
  createLog,
  validateData,
  magerPhases,
  type Data,
} from "./core";
import { Repository } from "./repository";
const icons: Record<string, string> = {
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z"/><path d="M9 21v-8h6v8"/>',
  coach:
    '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6M12 2v3m6 1 2-2"/>',
  progress: '<path d="M4 20V10m8 10V4m8 16v-7M2 22h20"/>',
  prep: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M8 10l2 2 5-5M8 17h8"/>',
  race: '<path d="M5 22V3m0 0c6-4 8 5 15 0v10c-7 5-9-4-15 0"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  play: '<path d="m9 5 11 7-11 7Z"/>',
  leaf: '<path d="M20 3C7 2 2 9 6 16s15 1 14-13ZM4 21l12-12"/>',
  check: '<path d="m5 12 4 4 10-10"/>',
  bolt: '<path d="m13 2-9 12h7l-1 8 10-13h-7Z"/>',
  settings:
    '<circle cx="12" cy="12" r="4"/><path d="m12 2 2 3 4-1 1 4 3 2-2 3 1 4-4 1-2 3-3-2-4 1-1-4-3-2 2-3-1-4 4-1Z"/>',
};
const icon = (name: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.check}</svg>`;
const escape = (v: string) =>
  v.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const repo = new Repository();
let data: Data = defaults();
let ready = false;
let page = location.hash.slice(1) || "today";
let notice = "";
let busy = false;
let intervalIndex = -1;
let saveQueue = Promise.resolve();
let audio: AudioContext | null = null;
let wake: WakeLockSentinel | null = null;
let installPrompt: (Event & { prompt: () => Promise<void> }) | null = null;
const root = document.querySelector<HTMLElement>("#app")!;
function raceRemaining(t: Data["timer"]) {
  return Math.max(
    0,
    5400 -
      (t?.raceStartedAt
        ? Math.max(0, (Date.now() - t.raceStartedAt) / 1000)
        : 0),
  );
}
function toast(message: string) {
  const el = document.querySelector<HTMLElement>("#toast")!;
  el.textContent = message;
  el.classList.add("visible");
  setTimeout(() => el.classList.remove("visible"), 5000);
}
function persist() {
  const snapshot = structuredClone(data);
  saveQueue = saveQueue
    .then(() => repo.save(snapshot))
    .catch((err) => {
      notice = "Penyimpanan gagal. Ekspor data sebelum menutup aplikasi.";
      toast(`${notice} ${err instanceof Error ? err.message : ""}`);
    });
  return saveQueue;
}
function applyTheme() {
  document.documentElement.dataset.theme = data.preferences.theme;
}
function button(action: string, label: string, cls = "primary", extra = "") {
  return `<button class="${cls}" data-action="${action}" ${extra}>${label}</button>`;
}
function nav() {
  return `<nav class="navigation" aria-label="Navigasi utama">${[
    ["today", "home", "Hari ini"],
    ["coach", "coach", "Coach"],
    ["progress", "progress", "Progres"],
    ["prep", "prep", "Persiapan"],
    ["race", "race", "Race Day"],
  ]
    .map(
      ([p, i, label]) =>
        `<a href="#${p}" class="${page === p ? "active" : ""}" ${page === p ? 'aria-current="page"' : ""}>${icon(i)}<span>${label}</span></a>`,
    )
    .join("")}</nav>`;
}
function today() {
  const day = trainingDay(dateKey()),
    w = recommendation(day, data.logs, data.plan),
    risk = safety(data.logs);
  const trained = data.logs.filter((l) => l.seconds >= 600).length;
  return `<section class="welcome"><div><p class="eyebrow">SATU LANGKAH, SETIAP HARI</p><h1>Pelan-pelan.<br><span>Kamu bisa, Haidar.</span></h1><p class="muted">Bukan soal paling cepat. Soal sampai garis finis.</p></div><div class="countdown-card"><span class="countdown-number">${countdown(dateKey(), data.profile.raceDate)}</span><span>HARI MENUJU LOMBA</span><small>8 November 2026</small></div></section>
<section class="race-strip" aria-label="Profil lomba"><span class="bib">BIB <strong>#6</strong></span><span><strong>Haidar</strong><small>Skybridge Run 2026</small></span><span class="strip-detail"><strong>5K</strong><small>Jarak lomba</small></span><span class="strip-detail"><strong>90 menit</strong><small>COT resmi*</small></span></section>
<div class="section-heading"><h2>Fokus hari ini</h2><span>${day === 0 ? "Hari persiapan" : day > 32 ? "Setelah lomba" : `Hari ${day} dari 32`}</span></div>
<section class="workout-card"><div class="workout-copy"><span class="pill">${icon("leaf")} ${escape(w.stage)}</span><h2>${escape(w.title)}</h2><p>${risk === "red" ? "Ada catatan nyeri atau gejala mengkhawatirkan. Jangan lanjutkan latihan. Cari bantuan medis sesuai gejala." : w.kind === "rest" ? "Beri tubuh ruang untuk pulih. Tidak perlu mengejar sesi yang terlewat." : "Jaga intensitas yang masih memungkinkan ngobrol. Jalan selalu boleh."}</p><div class="workout-facts"><span>${icon(coachIcon())}<strong>${total(w.phases) ? Math.round(total(w.phases) / 60) : 0}</strong> menit</span><span>${icon("leaf")}<strong>Mudah</strong> intensitas</span></div>${button("start", `${icon("play")} ${data.timer ? "Lanjutkan sesi" : w.kind === "rest" ? "Mulai jalan santai" : "Mulai sesi"} ${icon("arrow")}`, "primary", risk === "red" ? "disabled" : "")}<small>${w.kind === "rest" ? "Opsional saja. Istirahat penuh juga boleh." : "Termasuk pemanasan & pendinginan. Tidak ada target pace."}</small></div><div class="workout-art" aria-hidden="true"><svg viewBox="0 0 250 220"><path class="art-path" d="M30 172c-34-39 20-84 69-59s-16 60 28 73 94-14 66-48S93 64 124 31"/><circle cx="124" cy="31" r="8"/><circle cx="193" cy="138" r="7"/><path d="m122 72 16 9 17-5m-17 5-8 26-21 14m21-14 16 20 14-2"/><circle cx="144" cy="61" r="8"/></svg><span>FINISH, NOT FAST.</span></div></section>
<section class="mager-card"><div class="mager-icon">${icon("bolt")}</div><div><span class="eyebrow">LAGI MAGER? NGGAK APA-APA.</span><h3>Cuma 10 menit dulu.</h3><p>Gerak santai. Berhenti setelah 10 menit boleh banget.</p></div>${button("mager", `Yuk, mulai ${icon("arrow")}`, "secondary", risk === "red" ? "disabled" : "")}</section>
<div class="bottom-grid"><section class="card journey-card"><div class="card-heading"><h3>Perjalanan kecilmu</h3><a href="#progress">Lihat progres ${icon("arrow")}</a></div><div class="journey-days">${Array.from({ length: 32 }, (_, i) => `<span class="${i + 1 < day ? "past" : ""} ${i + 1 === day ? "current" : ""}" title="Hari ${i + 1}">${i + 1 === day ? i + 1 : ""}</span>`).join("")}</div><p><strong>${trained} sesi gerak</strong> tercatat. Setiap langkah berarti.</p><small>7 Okt: persiapan · 8 Okt–8 Nov: 32 hari perjalanan</small></section><section class="card note-card"><span class="note-symbol">${icon("leaf")}</span><h3>Istirahat bukan tertinggal.</h3><p>Sesi terlewat tidak perlu digandakan. Besok mulai lagi dengan ringan.</p><small>*COT adalah batas resmi, bukan target latihan.</small></section></div>`;
}
function coachIcon() {
  return "coach";
}
function coach(race = false) {
  const t = data.timer,
    pos = t ? position(t) : null,
    w = recommendation(trainingDay(dateKey()), data.logs, data.plan);
  const risk = safety(data.logs);
  return `<section class="page-heading"><p class="eyebrow">${race ? "SATU LOMBA. RITMEMU SENDIRI." : "COACH DI SAKUMU"}</p><h1>${race ? "Nikmati perjalanan 5K." : "Tetap ringan. Tetap bergerak."}</h1><p class="muted">${race ? "Ikuti marshal dan aturan terbaru penyelenggara. Jangan kejar pelari lain." : "Lari ringan, jalan, pulih. Kamu yang memegang kendali."}</p></section>${race ? `<section class="race-info"><span><strong>5K</strong> jarak</span><span><strong>90 menit</strong> COT resmi</span><span><strong>8 Nov</strong> hari lomba</span></section>` : ""}
<section class="timer-card ${race ? "race-timer" : ""}" aria-label="Timer latihan"><span class="pill">${escape(t?.title || w.title)}</span><h2 id="timer-phase">${pos?.label || "Siap kalau kamu siap"}</h2><div id="timer-countdown" class="timer-number" role="timer">${format(pos?.remaining || 0)}</div><p id="timer-next">${pos ? `Berikutnya: ${pos.next}` : "Pilih mulai untuk bergerak dengan santai."}</p><div class="timer-meta"><span>Waktu aktif <strong id="timer-elapsed">${format(pos?.elapsed || 0)}</strong></span>${t?.mode === "race" ? `<span>Sisa COT* <strong id="race-cot">${format(raceRemaining(t))}</strong></span>` : `<span>Total <strong>${format(t ? total(t.phases) : total(w.phases))}</strong></span>`}</div><div class="timer-track"><span id="timer-track-fill" style="width:${t ? (100 * elapsed(t)) / total(t.phases) : 0}%"></span></div><div class="timer-controls">${!t ? button(race ? "race-start" : "start", `${icon("play")} ${race ? "Mulai lomba" : "Mulai sesi"}`, "primary", risk === "red" ? "disabled" : "") : t.status === "ended" ? button("log", "Simpan catatan sesi") : button(t.status === "running" ? "pause" : "resume", t.status === "running" ? "Jeda" : "Lanjutkan")}${t && t.status !== "ended" ? button("end", "Akhiri sesi", "secondary") : ""}${t ? button("restart", "Ulangi", "text-button") : ""}</div>${t?.mode === "race" ? "<small>*Jeda tidak menghentikan COT resmi. Timer ini bukan pencatat waktu resmi.</small>" : ""}</section>
${risk === "red" ? '<aside class="safety-warning"><strong>Latihan ditunda untuk keselamatan.</strong> Jangan berolahraga melalui nyeri. Nyeri dada, pingsan, atau sesak berat: berhenti dan cari bantuan medis segera. Hapus status hanya jika sudah pulih dan layak kembali.</aside>' : ""}
<section class="card coach-options"><label><input type="checkbox" data-pref="audio" ${data.preferences.audio ? "checked" : ""}> Suara pergantian interval</label><label><input type="checkbox" data-pref="vibration" ${data.preferences.vibration ? "checked" : ""}> Getar pergantian interval</label><small>Opsional, mengikuti dukungan browser. Usahakan layar tetap terbuka.</small></section><aside class="gentle-note">${icon("leaf")} ${race ? "Gunakan ritme yang sudah dicoba. Minum sesuai toleransi dan fasilitas panitia." : "Tes ngobrol: kamu masih bisa mengucapkan kalimat utuh. Kalau tidak, perlambat atau jalan."}</aside>${race ? '<p class="muted">Batas waktu bukan alasan mengabaikan gejala. Tidak ada GPS atau prediksi finis.</p>' : ""}`;
}
function progress() {
  const logs = data.logs,
    completed = logs.filter((l) => l.completed).length,
    minutes = logs.reduce((s, l) => s + l.seconds, 0) / 60,
    longest = Math.max(0, ...logs.map((l) => l.seconds)) / 60,
    distance = logs.reduce((s, l) => s + (l.distance || 0), 0);
  return `<section class="page-heading"><p class="eyebrow">YANG KECIL TETAP BERARTI</p><h1>Progres, bukan perlombaan.</h1><p class="muted">${escape(recommendation(trainingDay(dateKey()), logs, data.plan).stage)} · ${safety(logs) === "red" ? "Perlu pemulihan" : safety(logs) === "yellow" ? "Kurangi beban" : "Bangun konsistensi"}</p></section><section class="stats-grid">${[
    [String(completed), "Sesi selesai"],
    [String(Math.round(minutes)), "Menit aktif"],
    [String(Math.round(longest)), "Sesi terlama · menit"],
    [distance.toFixed(1), "Jarak tercatat · km"],
  ]
    .map(
      ([v, l]) =>
        `<article class="card"><strong>${v}</strong><span>${l}</span></article>`,
    )
    .join(
      "",
    )}</section><div class="section-heading"><h2>Catatan perjalanan</h2><span>RPE terakhir: ${logs.at(-1)?.rpe || "—"} / 10</span></div><section class="card log-list">${
    logs.length
      ? logs
          .slice()
          .reverse()
          .slice(0, 30)
          .map(
            (l) =>
              `<article><div>${icon("check")}<span><strong>${escape(l.title)}</strong><small>${l.date} · ${l.completed ? "Selesai" : "Sesi singkat"} · RPE ${l.rpe}/10 · Nyeri ${l.pain}/10${l.symptoms ? " · Gejala dilaporkan" : ""}</small>${l.notes ? `<p>${escape(l.notes)}</p>` : ""}</span></div><strong>${format(l.seconds)}</strong></article>`,
          )
          .join("")
      : '<div class="empty-state">' +
        icon("leaf") +
        '<h3>Langkah pertama menunggu.</h3><p>Setelah sesi, simpan catatan agar perjalananmu terlihat di sini.</p><a href="#coach">Buka Coach →</a></div>'
  }</section><details class="card plan-details"><summary>Lihat rencana 32 hari</summary><p>Rencana dasar, bukan utang latihan. Coach menyesuaikan beban dari catatan terakhir.</p>${data.plan.map((w) => `<p class="plan-row"><strong>Hari ${w.day}</strong><span>${w.title}</span><small>${w.kind === "rest" ? "Pulih" : Math.round(total(w.phases) / 60) + " menit dasar"}</small></p>`).join("")}</details>`;
}
function prep() {
  const done = data.checklist.filter((c) => c.done).length;
  return `<section class="page-heading"><p class="eyebrow">SEDIKIT PERSIAPAN, LEBIH TENANG</p><h1>Siapkan hari besarmu.</h1><p class="muted">${done} dari ${data.checklist.length} siap. Tidak perlu menunggu malam sebelum lomba.</p></section><div class="prep-grid">${[
    ...new Set(data.checklist.map((c) => c.group)),
  ]
    .map(
      (group) =>
        `<section class="card checklist-card"><h2>${escape(group)}</h2>${data.checklist
          .filter((c) => c.group === group)
          .map(
            (c) =>
              `<label class="checklist-item ${c.done ? "done" : ""}"><input type="checkbox" data-check="${escape(c.id)}" ${c.done ? "checked" : ""}><span>${escape(c.label)}</span></label>`,
          )
          .join("")}</section>`,
    )
    .join(
      "",
    )}</div><aside class="gentle-note">${icon("leaf")} Jangan mencoba sepatu atau makanan baru saat lomba. Konfirmasi jam start langsung ke penyelenggara.</aside>`;
}
function settings() {
  return `<section class="page-heading"><p class="eyebrow">LOKAL, PRIBADI, MILIKMU</p><h1>Pengaturan & data.</h1><p class="muted">Tidak ada akun. Tidak ada pelacakan. Catatan tersimpan di perangkat ini.</p></section><section class="card settings-card"><h2>Tampilan</h2><label>Tema <select id="theme-select"><option value="system" ${data.preferences.theme === "system" ? "selected" : ""}>Ikuti perangkat</option><option value="light" ${data.preferences.theme === "light" ? "selected" : ""}>Terang</option><option value="dark" ${data.preferences.theme === "dark" ? "selected" : ""}>Gelap</option></select></label><h2>Cadangan lokal</h2><p>Ekspor secara berkala. Menghapus data browser atau mengganti perangkat dapat menghilangkan catatan. Impor mengganti seluruh data setelah validasi.</p><div class="settings-actions">${button("export", "Ekspor JSON", "secondary")}<label class="secondary import-label">Impor JSON<input id="import-file" type="file" accept="application/json,.json"></label>${button("storage", "Minta penyimpanan persisten", "text-button")}</div>${repo.recovered ? button("recover-export", "Ekspor data rusak untuk pemulihan", "secondary") : ""}${installPrompt ? button("install", "Instal aplikasi", "primary") : '<p class="muted">Instal melalui menu browser → Instal aplikasi / Tambahkan ke Layar Utama (Safari: Bagikan).</p>'}<h2>Keselamatan</h2><p>Nyeri ≥4/10 atau gejala mengkhawatirkan menunda latihan. RPE ≥7 atau nyeri ringan mengurangi beban. Status ini bukan diagnosis.</p>${safety(data.logs) !== "green" ? button("clear-safety", "Saya sudah pulih · evaluasi ulang", "secondary") : ""}<h2>Hapus data</h2><p>Hapus semua catatan, checklist, dan preferensi di perangkat ini. Ekspor dulu bila diperlukan.</p>${button("reset", "Hapus & reset semua data", "danger")}<h2>Tentang Skybridge 32</h2><p>Tujuan: finis 5K dengan aman dan percaya diri. COT 90 menit adalah asumsi profil, bukan target latihan. Aturan panitia tetap berwenang.</p><p>7 Oktober adalah hari persiapan (Hari 0). Hari 1: 8 Oktober. Hari 32: 8 November 2026. Tidak ada simulasi 5K otomatis atau klaim kesiapan medis.</p><small>Versi 1.0 · Offline setelah pemuatan pertama · Data hanya di browser ini.</small></section>`;
}
function render() {
  applyTheme();
  root.innerHTML = `<header class="app-header"><a class="brand" href="#today"><span class="brand-mark"><svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M4 22h24M6 22V12m20 10V12M6 14c7-12 13-12 20 0M11 8v14m10-14v14" stroke="currentColor" stroke-width="2"/></svg></span><span>skybridge<span class="brand-number">32</span><small>PERSONAL 5K RACE COACH</small></span></a><div class="header-actions"><span class="connection"><i></i><span id="connection-label">${navigator.onLine ? "Lokal & privat" : "Offline · siap"}</span></span><a class="settings-link ${page === "settings" ? "active" : ""}" href="#settings" aria-label="Pengaturan">${icon("settings")}</a></div></header>${nav()}<main id="main-content">${notice ? `<aside class="safety-warning" role="alert">${escape(notice)}</aside>` : ""}${!ready ? "<p>Menyiapkan penyimpanan lokal…</p>" : page === "today" ? today() : page === "coach" ? coach() : page === "progress" ? progress() : page === "prep" ? prep() : page === "race" ? coach(true) : settings()}</main><footer class="app-footer"><span>Finish first. Nyaman selalu.</span><span>${icon("leaf")} ${navigator.onLine ? "Data tetap di perangkatmu" : "Offline · data tetap lokal"}</span></footer>`;
  tick();
}
async function keepAwake() {
  try {
    if ("wakeLock" in navigator && !wake)
      wake = await navigator.wakeLock.request("screen");
    wake?.addEventListener("release", () => {
      wake = null;
    });
  } catch {
    /* Optional API. */
  }
}
function releaseWake() {
  void wake?.release();
  wake = null;
}
function primeAudio() {
  if (data.preferences.audio) {
    try {
      audio ||= new AudioContext();
      void audio.resume();
    } catch {
      toast("Audio tidak tersedia di browser ini.");
    }
  }
}
function signal() {
  if (data.preferences.vibration) navigator.vibrate?.([180, 100, 180]);
  if (data.preferences.audio && audio?.state === "running") {
    const oscillator = audio.createOscillator(),
      gain = audio.createGain();
    oscillator.connect(gain);
    gain.connect(audio.destination);
    gain.gain.value = 0.07;
    oscillator.frequency.value = 620;
    oscillator.start();
    oscillator.stop(audio.currentTime + 0.18);
  }
}
function tick() {
  const t = data.timer;
  if (!t) return;
  const pos = position(t);
  for (const [id, value] of [
    ["timer-phase", pos.label],
    ["timer-countdown", format(pos.remaining)],
    ["timer-next", `Berikutnya: ${pos.next}`],
    ["timer-elapsed", format(pos.elapsed)],
    ["race-cot", format(raceRemaining(t))],
  ]) {
    const e = document.getElementById(id);
    if (e) e.textContent = value;
  }
  const fill = document.getElementById("timer-track-fill");
  if (fill) fill.style.width = `${(100 * pos.elapsed) / total(t.phases)}%`;
  if (pos.index !== intervalIndex) {
    if (intervalIndex >= 0 && t.status === "running") signal();
    intervalIndex = pos.index;
  }
  if (pos.finished && t.status !== "ended") {
    data.timer = { ...pause(t), status: "ended" };
    void persist();
    releaseWake();
    render();
    toast("Sesi selesai. Simpan catatanmu.");
  }
}
function download(value: unknown, name: string) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function logDialog() {
  if (!data.timer) return;
  const dialog = document.querySelector<HTMLDialogElement>("#log-dialog")!;
  dialog.innerHTML = `<form id="log-form"><div class="card-heading"><h2>Bagaimana rasanya?</h2><button type="button" data-action="close-dialog" class="text-button" aria-label="Tutup">×</button></div><p>${format(elapsed(data.timer))} bergerak. Sesi singkat tetap berarti.</p><label>Usaha (RPE 1–10)<input name="rpe" type="number" min="1" max="10" value="3" required></label><small>1 sangat ringan · 10 usaha maksimal</small><label>Nyeri (0–10)<input name="pain" type="number" min="0" max="10" value="0" required></label><label class="symptoms"><input name="symptoms" type="checkbox"> Ada nyeri dada, pusing/pingsan, sesak berat, atau gejala mengkhawatirkan</label><label>Jarak (km, opsional)<input name="distance" type="number" min="0" max="100" step="0.01" placeholder="Tanpa GPS — isi jika tahu"></label><label>Catatan (opsional)<textarea name="notes" maxlength="500" rows="2" placeholder="Apa yang terasa nyaman hari ini?"></textarea></label><p class="muted">Jika gejala mengkhawatirkan muncul, berhenti dan cari bantuan medis. Jangan menunggu selesai mencatat.</p><button type="submit" class="primary">Simpan sesi</button></form>`;
  dialog.showModal();
}
async function action(name: string) {
  if (!ready || busy) return;
  busy = true;
  try {
    const risk = safety(data.logs);
    switch (name) {
      case "start":
      case "mager":
      case "race-start": {
        if (data.timer) {
          page = "coach";
          location.hash = page;
          render();
          break;
        }
        if (risk === "red") {
          toast("Latihan ditunda. Utamakan keselamatan.");
          break;
        }
        primeAudio();
        const w = recommendation(
          name === "race-start" ? 32 : trainingDay(dateKey()),
          data.logs,
          data.plan,
        );
        const phases =
          name === "mager" || !w.phases.length ? magerPhases : w.phases;
        data.timer = {
          title:
            name === "mager"
              ? "Mager Mode · 10 menit"
              : !w.phases.length
                ? "Jalan santai · 10 menit"
                : w.title,
          phases,
          elapsed: 0,
          startedAt: Date.now(),
          status: "running",
          mode:
            name === "race-start"
              ? "race"
              : name === "mager"
                ? "mager"
                : "training",
          ...(name === "race-start" ? { raceStartedAt: Date.now() } : {}),
        };
        intervalIndex = -1;
        await persist();
        void keepAwake();
        page = name === "race-start" ? "race" : "coach";
        location.hash = page;
        render();
        break;
      }
      case "pause":
        if (data.timer) {
          data.timer = pause(data.timer);
          await persist();
          releaseWake();
          render();
        }
        break;
      case "resume":
        if (data.timer && risk !== "red") {
          primeAudio();
          data.timer = resume(data.timer);
          await persist();
          void keepAwake();
          render();
        }
        break;
      case "end":
        if (data.timer) {
          data.timer = { ...pause(data.timer), status: "ended" };
          await persist();
          releaseWake();
          render();
          logDialog();
        }
        break;
      case "log":
        logDialog();
        break;
      case "restart":
        if (
          data.timer &&
          confirm("Ulangi timer dari awal? Waktu sesi ini tidak akan disimpan.")
        ) {
          data.timer = {
            ...data.timer,
            elapsed: 0,
            startedAt: null,
            status: "paused",
            ...(data.timer.mode === "race"
              ? { raceStartedAt: Date.now() }
              : {}),
          };
          intervalIndex = -1;
          await persist();
          releaseWake();
          render();
        }
        break;
      case "close-dialog":
        document.querySelector<HTMLDialogElement>("#log-dialog")!.close();
        break;
      case "export":
        await saveQueue;
        download(data, `skybridge32-${dateKey()}.json`);
        toast("Cadangan JSON diekspor.");
        break;
      case "recover-export":
        download(await repo.recovery(), "skybridge32-recovery.json");
        break;
      case "reset":
        if (confirm("Hapus SEMUA data lokal? Tidak bisa dibatalkan.")) {
          releaseWake();
          data = await repo.reset();
          notice = "";
          page = "today";
          location.hash = page;
          render();
          toast("Data lokal direset.");
        }
        break;
      case "storage": {
        const granted = await navigator.storage?.persist?.();
        toast(
          granted
            ? "Penyimpanan persisten diizinkan."
            : "Browser belum mengizinkan. Tetap ekspor cadangan berkala.",
        );
        break;
      }
      case "install":
        await installPrompt?.prompt();
        installPrompt = null;
        render();
        break;
      case "clear-safety":
        if (
          confirm(
            "Lanjut hanya jika gejala sudah pulih dan, bila perlu, tenaga medis mengizinkan. Aplikasi tidak dapat menilai keamanan Anda.",
          )
        ) {
          data.logs.push({
            id: crypto.randomUUID(),
            date: dateKey(),
            title: "Check-in pemulihan",
            seconds: 0,
            rpe: 1,
            pain: 0,
            symptoms: false,
            notes: "Pengguna menyatakan pulih; bukan penilaian medis.",
            completed: false,
          });
          await persist();
          render();
        }
        break;
    }
  } catch (err) {
    toast(err instanceof Error ? err.message : "Terjadi kesalahan.");
  } finally {
    busy = false;
  }
}
document.addEventListener("click", (e) => {
  const el = (e.target as Element).closest<HTMLElement>("[data-action]");
  if (el) void action(el.dataset.action!);
});
document.addEventListener("change", async (e) => {
  const input = e.target as HTMLInputElement;
  try {
    if (input.dataset.check) {
      data.checklist.find((c) => c.id === input.dataset.check)!.done =
        input.checked;
      await persist();
      render();
    }
    if (input.dataset.pref) {
      data.preferences[input.dataset.pref as "audio" | "vibration"] =
        input.checked;
      primeAudio();
      await persist();
    }
    if (input.id === "theme-select") {
      data.preferences.theme = input.value as Data["preferences"]["theme"];
      applyTheme();
      await persist();
    }
    if (input.id === "import-file" && input.files?.[0]) {
      const file = input.files[0];
      if (file.size > 5_000_000) throw new Error("Cadangan maksimal 5 MB.");
      const imported = validateData(JSON.parse(await file.text()));
      if (confirm("Ganti semua data lokal dengan cadangan ini?")) {
        if (imported.timer?.status === "running")
          imported.timer = pause(imported.timer);
        await repo.save(imported);
        data = imported;
        releaseWake();
        render();
        toast("Cadangan berhasil diimpor.");
      }
    }
  } catch (err) {
    toast(err instanceof Error ? err.message : "Data tidak valid.");
  } finally {
    if (input.id === "import-file") input.value = "";
  }
});
document.addEventListener("submit", async (e) => {
  if ((e.target as HTMLElement).id !== "log-form") return;
  e.preventDefault();
  if (!data.timer || busy) return;
  busy = true;
  try {
    const form = e.target as HTMLFormElement,
      values = new FormData(form),
      distance = values.get("distance");
    const log = createLog(data.timer, {
      rpe: Number(values.get("rpe")),
      pain: Number(values.get("pain")),
      symptoms: values.get("symptoms") === "on",
      notes: String(values.get("notes") || ""),
      ...(distance ? { distance: Number(distance) } : {}),
    });
    const updated = { ...data, logs: [...data.logs, log], timer: null };
    validateData(updated);
    await repo.save(updated);
    data = updated;
    document.querySelector<HTMLDialogElement>("#log-dialog")!.close();
    releaseWake();
    page = "progress";
    location.hash = page;
    render();
    toast("Sesi tersimpan. Terima kasih sudah bergerak.");
  } catch {
    toast("Gagal menyimpan. Periksa isian dan coba lagi.");
  } finally {
    busy = false;
  }
});
window.addEventListener("hashchange", () => {
  page = location.hash.slice(1) || "today";
  if (
    !["today", "coach", "progress", "prep", "race", "settings"].includes(page)
  )
    page = "today";
  render();
  window.scrollTo(0, 0);
});
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  installPrompt = e as typeof installPrompt;
  if (page === "settings") render();
});
window.addEventListener("online", render);
window.addEventListener("offline", render);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    tick();
    if (data.timer?.status === "running") void keepAwake();
  }
});
// Timer state is timestamp-based, independent of DOM renders and throttled intervals.
setInterval(tick, 250);
async function boot() {
  render();
  try {
    await repo.open();
    data = await repo.load();
    if (repo.recovered)
      notice =
        "Data lokal rusak telah dipisahkan; cadangan mentah bisa diekspor dari Pengaturan.";
    if (data.timer?.status === "running") {
      data.timer = pause(data.timer);
      await repo.save(data);
      notice =
        "Timer dipulihkan dan dijeda. Tinjau waktu aktif, lalu lanjutkan jika sesuai.";
    }
    ready = true;
    render();
    if ("serviceWorker" in navigator) {
      await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      toast("Aplikasi siap digunakan offline.");
    }
  } catch (err) {
    notice = `Penyimpanan/offline tidak siap: ${err instanceof Error ? err.message : "kesalahan browser"}. Coba mode browser biasa dan muat ulang.`;
    render();
  }
}
async function exclusiveBoot() {
  if (!navigator.locks) {
    await boot();
    return;
  }
  await navigator.locks.request(
    "skybridge32-session",
    { ifAvailable: true },
    async (lock) => {
      if (!lock) {
        notice =
          "Skybridge 32 sedang terbuka di tab lain. Tutup tab lain lalu muat ulang agar catatan tidak saling menimpa.";
        render();
        return;
      }
      await boot();
      await new Promise<void>((resolve) =>
        window.addEventListener("pagehide", () => resolve(), { once: true }),
      );
    },
  );
}
void exclusiveBoot();
