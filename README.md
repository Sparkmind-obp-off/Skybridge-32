# Skybridge 32 — Personal 5K Race Coach

Pendamping lokal persiapan Skybridge Run 2026 untuk **Haidar, BIB #6, 5K, 8 November 2026, COT 90 menit**. Tujuannya finis aman dan percaya diri, bukan podium. Aturan resmi panitia selalu lebih berwenang daripada asumsi aplikasi.

## Status & URL

- Implementasi v1.0 selesai; BYOK Cloudflare Pages aktif dan diverifikasi 7 Oktober 2026.
- QA browser lengkap juga lulus di URL produksi HTTPS, termasuk penggunaan offline.
- GitHub: https://github.com/Sparkmind-obp-off/Skybridge-32
- Produksi: https://skybridge-32.pages.dev
- Deployment awal: https://984cc0e4.skybridge-32.pages.dev
- Tech stack: TypeScript, UI DOM ringan, CSS, IndexedDB, service worker. Hono hanya menyajikan HTML app shell; tidak ada API/backend bisnis, akun, layanan eksternal, analytics, atau database server.
- Semua latihan dan catatan tetap di browser. Hosting tetap menerima permintaan HTTP standar; aplikasi tidak mengirim catatan latihan ke hosting.

## Fitur selesai & halaman

Semua navigasi memakai hash pada `/`, tanpa parameter wajib:

| URI | Fungsi |
| --- | --- |
| `/#today` | Profil, countdown kalender, fokus hari ini, tombol mulai, Mager Mode |
| `/#coach` | Run/walk, fase berikutnya, waktu aktif, jeda/lanjut, akhiri, ulangi, audio/getar opsional |
| `/#progress` | Sesi selesai, menit aktif, sesi terlama, jarak manual, RPE, log dan rencana 32 hari |
| `/#prep` | Checklist perlengkapan, race pack, transportasi, persiapan diri |
| `/#race` | Tampilan timer besar, strategi yang pernah dilatih, sisa COT perkiraan |
| `/#settings` | Tema, instalasi, ekspor/impor JSON, permintaan storage persisten, reset, check-in pemulihan |
| `/manifest.webmanifest` | Manifest instalasi PWA |
| `/sw.js` | Cache offline app shell |
| `/static/*` | Bundle lokal, CSS, ikon PNG 192/512 dan maskable |

Core workflow bekerja offline **setelah pemuatan online pertama dan service worker selesai**. Tidak ada CDN font, script, atau permintaan fitness API.

## Cara pakai

1. Buka URL produksi di Chrome/Edge/Safari dan tunggu pesan siap offline.
2. Pilih latihan hari ini. Jika hari istirahat, jalan santai 10 menit bersifat opsional, bukan utang latihan.
3. Lagi mager? Pilih **Cuma 10 menit dulu**. Berhenti setelah 10 menit diperbolehkan. Berhenti lebih awal juga dapat dicatat.
4. Coach menampilkan fase dan hitung mundur. Navigasi antarlayar tidak mengulang timer.
5. Akhiri sesi, isi RPE (1–10), nyeri (0–10), gejala, jarak opsional dan catatan. Simpan untuk memperbarui progres.
6. Centang persiapan lomba. Ekspor JSON dari Pengaturan secara berkala. Impor mengganti data hanya setelah validasi dan konfirmasi.
7. Instal melalui menu browser. Safari iOS: Bagikan → Tambahkan ke Layar Utama. Browser tertentu menawarkan tombol Instal di Pengaturan.
8. Gunakan satu tab. Web Locks, jika tersedia, mencegah tab kedua menimpa catatan; tutup tab aktif dan muat ulang tab lainnya untuk berpindah.

## Kalender & latihan konservatif

7 Oktober–8 November berjarak 32 hari tetapi mencakup 33 tanggal. Keputusan eksplisit:

- **7 Oktober = Hari 0/persiapan**; jalan santai opsional.
- **8 Oktober = Hari 1**; **8 November = Hari 32/lomba**.
- Countdown memakai tanggal kalender perangkat, bukan pembagian jam tersisa. Gunakan tanggal/zona waktu perangkat yang benar (WIB untuk lomba).
- Hari 1–7: tiga sesi 1:2 ringan dengan pemanasan/pendinginan.
- Hari 8–16: sekitar tiga sesi per minggu, contoh 2:2 dan 3:2.
- Hari 17–24: contoh 3:2 dan 4:2, sesi mudah dan pemulihan.
- Hari 25–28: latihan strategi, tidak ada simulasi 5K otomatis.
- Hari 29–31: satu sesi singkat dan hari pemulihan. Hari 32: ritme aman terakhir yang tercatat, fallback 1:2.
- Rencana dasar tersimpan terpisah dari rekomendasi adaptif. Tanpa sesi toleran tercatat, sesi latihan tetap sekitar 22 menit/1:2. Kenaikan durasi dibatasi hingga sekitar 5 menit dari sesi selesai toleran terakhir; jika rencana lebih panjang, ulangi ritme sebelumnya dengan durasi dibatasi.
- Tidak menggandakan sesi terlewat; hari pemulihan tetap pemulihan.
- Nyeri ≥4 atau gejala mengkhawatirkan: status merah, tombol latihan/Mager/lomba dinonaktifkan. RPE ≥7 atau nyeri ringan: beban lebih ringan.
- Check-in pemulihan hanya pernyataan pengguna, bukan izin medis. Riwayat nyeri tetap disimpan. Bila perlu, minta izin tenaga medis sebelum kembali.
- Simulasi 5K tidak ditawarkan dalam v1: pilihan aman paling sederhana tanpa penilaian kesiapan klinis. Aplikasi tidak menjanjikan finis di dalam COT.

## Timer & keselamatan

Timer memakai timestamp + elapsed tersimpan, bukan jumlah tick interval, sehingga DOM rerender dan throttling browser tidak menghilangkan waktu. Jeda menghentikan waktu aktif. Refresh memulihkan sesi lalu menjedanya otomatis agar pengguna dapat memeriksa angka sebelum melanjutkan. Waktu saat halaman tertutup dapat ikut dihitung sampai refresh; bukan pendeteksi aktivitas.

Race Day memakai timestamp start lomba tersendiri: **jeda interval tidak menghentikan sisa COT**. Angka tersebut hanya perkiraan sejak tombol mulai; waktu gun/panitia, start wave, rute dan COT aktual tetap mengikuti panitia. Tidak ada asumsi jam start 05:45 yang belum dikonfirmasi. Ulangi mereset sesi dan perkiraan jam start setelah konfirmasi.

Nyeri dada, pingsan, sesak berat tidak biasa, atau nyeri akut: berhenti dan cari bantuan medis sesuai kondisi. Jangan mengejar COT melalui nyeri. Aplikasi bukan perangkat medis.

## Data model & penyimpanan

Database IndexedDB `skybridge32`, schema 1:

- Object store `state`, key `app`: snapshot atomik `Data` dengan `version: 1`.
- `profile`: nama, BIB, raceDate, startDate, jarak dan COT.
- `plan`: 32 definisi `Workout`; day, stage, kind, title, array fase label/seconds.
- `logs`: UUID, tanggal kalender, judul, detik aktif, completed, RPE, pain, symptoms, jarak opsional dan catatan maks. 500 karakter.
- `checklist`: ID, kategori, label dan status.
- `preferences`: audio, vibration dan tema system/light/dark.
- `timer`: fase, elapsed, startedAt, status, mode, raceStartedAt opsional.
- Object store `recovery`, key `invalid`: snapshot rusak terakhir dipisahkan sebelum app membuat data default. Ekspor pemulihan tersedia jika kerusakan ditemukan pada load saat ini. Reset menghapus state dan recovery.

Validasi ekspor/impor: versi, profil lomba tetap, fase rencana yang didukung, tipe field, angka finite dan batas, tanggal valid, ID duplikat, catatan/array dibatasi, timer konsisten. File impor maksimal 5 MB. Notes/label di-escape saat dirender. Cadangan merupakan JSON teks biasa, tidak terenkripsi; simpan secara privat.

## Setup & pengembangan

Node.js **22.15+**, npm, browser modern dengan IndexedDB. Gunakan Linux/WSL/macOS untuk toolchain Cloudflare.

```sh
npm ci
npm run typecheck
npm run lint
npm test
npm run build
```

Build: esbuild membundel client TypeScript ke `public/static/app.js` (generated/diabaikan Git), Vite menghasilkan `dist/` dengan worker app shell dan aset offline. Kode sumber berada di `src/`, aset di `public/`, pengujian di `tests/`.

Preview sandbox menggunakan port 3000:

```sh
fuser -k 3000/tcp 2>/dev/null || true
npm run build
pm2 start ecosystem.config.cjs
curl http://localhost:3000/
pm2 logs webapp --nostream
```

`npm run dev` hanya server Vite pengembangan biasa; client bundle dihasilkan oleh build. Setelah mengubah client TS, jalankan build ulang sebelum menguji preview. `wrangler pages dev` memuat ulang dist.

## Pengujian & QA

```sh
npm test                            # 20 uji unit/repository
npx playwright install --with-deps chromium
npm run test:e2e                     # preview harus sudah hidup
TEST_URL=https://YOUR.pages.dev npm run test:e2e
npm audit
```

QA browser memakai profil browser terpisah; tidak menyentuh data pengguna nyata. Meliputi fresh install, dashboard, timer/Mager, jeda/lanjut, rerender, pemulihan refresh, log/progres, persistence checklist, ekspor/impor valid/invalid, reset, offline reload/save, COT tetap berjalan saat jeda, gate nyeri, tema, tampilan mobile/desktop, tab ganda, penyelesaian 10 menit dan zero countdown. Screenshot otomatis di `test-results/` (tidak di-Git). Uji unit mencakup data lokal rusak dan pemulihannya.

Hasil lokal: typecheck, lint, 20 unit tests, browser QA lengkap, production build lulus; audit dependency menemukan 0 kerentanan pada pemeriksaan 7 Oktober 2026. Pengujian audio/getar/instalasi native iOS dan Android tetap memerlukan perangkat fisik.

## Deployment BYOK Cloudflare Pages

Token Cloudflare **Pages: Edit** harus tersedia sebagai `CLOUDFLARE_API_TOKEN` di lingkungan deploy, tidak di client atau repo. Di Genspark masukkan token melalui Deploy panel. GitHub telah memakai repositori pengguna yang sama; direct deploy tidak otomatis menghubungkan Git provider atau memasang pipeline deploy.

```sh
npx wrangler whoami
# Hanya deploy pertama:
npx wrangler pages project create skybridge-32 --production-branch main
npm run deploy
```

Production branch: `main`. Output directory: `dist`. Tidak ada D1/KV/R2 binding atau secret runtime. Bila mengubah app shell/aset, **bump nama cache di `public/sw.js`** sebelum build/deploy; service worker lama menggunakan cache-first aset. Pengguna perlu membuka ulang halaman untuk memperoleh service worker baru. Instal dari URL produksi yang stabil; storage di preview, deployment URL dan produksi adalah origin berbeda.

## Batasan & langkah berikutnya

- Tidak ada GPS, pace real-time, sinkronisasi perangkat, notifikasi push, chat AI/cloud, analytics, autentikasi, atau penilaian medis.
- Audio/getar dan screen wake lock tergantung browser/perangkat; background/layar terkunci dapat menahan bunyi. Jangan mengandalkan alarm saat layar mati. Timestamp memperbaiki tampilan saat kembali, bukan menjamin notifikasi background.
- Perubahan jam sistem bisa memengaruhi timer; jaga jam otomatis aktif.
- IndexedDB dapat dibersihkan browser/OS. Permintaan persist adalah best-effort; ekspor cadangan rutin.
- Log pendek tetap tercatat, tetapi hanya sesi yang mencapai total fase ditandai selesai. Race Day dapat diakhiri dan dicatat sebelum total 90 menit; label selesai interval bukan sertifikasi finis lomba.
- Halaman hanya menampilkan 30 log terbaru, ekspor menyertakan semuanya. Batas impor 10.000 log; v1 ini ditujukan untuk uji 32 hari, bukan arsip bertahun-tahun.
- Lakukan uji fisik selama berjalan sebelum latihan, konfirmasi detail resmi race pack/start/COT ke panitia, lalu jalankan trial 32 hari. Tidak perlu menambah infrastruktur sebelum kebutuhan nyata terbukti.

Dokumen visi/PRD asli di `docs/` dipertahankan. Keputusan implementasi di README ini menjelaskan perbedaan V0, khususnya kalender dan simulasi opsional.
