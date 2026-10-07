export type Phase = { label: string; seconds: number };
export type Workout = {
  day: number;
  title: string;
  stage: string;
  phases: Phase[];
  kind: "rest" | "run" | "race";
};
export type Log = {
  id: string;
  date: string;
  title: string;
  seconds: number;
  rpe: number;
  pain: number;
  symptoms: boolean;
  distance?: number;
  notes: string;
  completed: boolean;
};
export type TimerState = {
  title: string;
  phases: Phase[];
  elapsed: number;
  startedAt: number | null;
  status: "running" | "paused" | "ended";
  mode: "training" | "mager" | "race";
  raceStartedAt?: number;
};
export type Data = {
  version: 1;
  profile: {
    name: string;
    bib: string;
    raceDate: string;
    startDate: string;
    distance: number;
    cot: number;
  };
  plan: Workout[];
  logs: Log[];
  checklist: { id: string; group: string; label: string; done: boolean }[];
  preferences: {
    audio: boolean;
    vibration: boolean;
    theme: "light" | "dark" | "system";
  };
  timer: TimerState | null;
};
export const RACE = "2026-11-08";
export function dateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function epoch(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}
export function countdown(now: string, race = RACE): number {
  return Math.max(0, Math.round((epoch(race) - epoch(now)) / 86400000));
}
export function trainingDay(now: string): number {
  return Math.max(
    0,
    Math.min(33, 32 - Math.round((epoch(RACE) - epoch(now)) / 86400000)),
  );
}
export function stage(day: number): string {
  return day <= 7
    ? "Bangun kebiasaan"
    : day <= 16
      ? "Fondasi nyaman"
      : day <= 24
        ? "Tambah waktu perlahan"
        : day <= 28
          ? "Latihan strategi lomba"
          : day <= 31
            ? "Taper & pemulihan"
            : "Hari lomba";
}
export function intervals(run: number, walk: number, rounds: number): Phase[] {
  return [
    { label: "Pemanasan · jalan", seconds: 300 },
    ...Array.from({ length: rounds }, () => [
      { label: "Lari ringan", seconds: run * 60 },
      { label: "Jalan & pulihkan", seconds: walk * 60 },
    ]).flat(),
    { label: "Pendinginan · jalan", seconds: 300 },
  ];
}
export const magerPhases: Phase[] = [{ label: "Gerak santai", seconds: 600 }];
export function makePlan(): Workout[] {
  const sessions: Record<number, [number, number, number]> = {
    1: [1, 2, 4],
    3: [1, 2, 5],
    6: [1, 2, 6],
    8: [2, 2, 5],
    11: [2, 2, 6],
    14: [3, 2, 5],
    16: [3, 2, 5],
    18: [3, 2, 6],
    21: [4, 2, 5],
    24: [2, 2, 5],
    26: [3, 2, 6],
    29: [1, 2, 3],
  };
  return Array.from({ length: 32 }, (_, i) => {
    const day = i + 1,
      s = sessions[day];
    return {
      day,
      stage: stage(day),
      kind: day === 32 ? "race" : s ? "run" : "rest",
      title:
        day === 32
          ? "Saatnya menikmati 5K"
          : s
            ? "Run / walk santai"
            : "Istirahat juga latihan",
      phases:
        day === 32
          ? Array.from({ length: 30 }, () => [
              { label: "Lari ringan", seconds: 60 },
              { label: "Jalan & pulihkan", seconds: 120 },
            ]).flat()
          : s
            ? intervals(...s)
            : [],
    };
  });
}
export function defaults(): Data {
  return {
    version: 1,
    profile: {
      name: "Haidar",
      bib: "6",
      raceDate: RACE,
      startDate: "2026-10-07",
      distance: 5,
      cot: 90,
    },
    plan: makePlan(),
    logs: [],
    checklist: [
      ["Perlengkapan", "Sepatu yang sudah dicoba"],
      ["Perlengkapan", "Kaos, celana & kaus kaki nyaman"],
      ["Race pack", "Ambil race pack & BIB #6"],
      ["Race pack", "Peniti BIB & identitas"],
      ["Transportasi", "Konfirmasi lokasi, rute & transportasi"],
      ["Transportasi", "Cek jam start resmi & waktu berangkat"],
      ["Persiapan diri", "Isi baterai ponsel"],
      ["Persiapan diri", "Siapkan minum & sarapan yang familiar"],
      ["Persiapan diri", "Atur alarm & tidur cukup"],
      ["Persiapan diri", "Cek instruksi terbaru penyelenggara"],
    ].map(([group, label], i) => ({
      id: String(i),
      group,
      label,
      done: false,
    })),
    preferences: { audio: false, vibration: false, theme: "system" },
    timer: null,
  };
}
export function total(phases: Phase[]): number {
  return phases.reduce((sum, p) => sum + p.seconds, 0);
}
export function elapsed(timer: TimerState, now = Date.now()): number {
  return Math.min(
    total(timer.phases),
    Math.max(
      0,
      timer.elapsed +
        (timer.startedAt === null
          ? 0
          : Math.max(0, (now - timer.startedAt) / 1000)),
    ),
  );
}
export function position(timer: TimerState, now = Date.now()) {
  const spent = elapsed(timer, now);
  let remaining = spent;
  for (let i = 0; i < timer.phases.length; i++) {
    const p = timer.phases[i];
    if (remaining < p.seconds)
      return {
        index: i,
        label: p.label,
        remaining: Math.max(0, Math.ceil(p.seconds - remaining)),
        next: timer.phases[i + 1]?.label ?? "Sesi selesai",
        elapsed: spent,
        finished: false,
      };
    remaining -= p.seconds;
  }
  return {
    index: timer.phases.length,
    label: "Sesi selesai",
    remaining: 0,
    next: "Waktunya pulih",
    elapsed: spent,
    finished: true,
  };
}
export function pause(timer: TimerState, now = Date.now()): TimerState {
  return {
    ...timer,
    elapsed: elapsed(timer, now),
    startedAt: null,
    status: "paused",
  };
}
export function resume(timer: TimerState, now = Date.now()): TimerState {
  return { ...timer, startedAt: now, status: "running" };
}
export function format(seconds: number): string {
  const n = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
}
export function safety(logs: Log[]): "red" | "yellow" | "green" {
  const last = logs.at(-1);
  return !last
    ? "green"
    : last.symptoms || last.pain >= 4
      ? "red"
      : last.rpe >= 7 || last.pain > 0
        ? "yellow"
        : "green";
}
function practicedRatio(title: string): [number, number] {
  const match = title.match(/\b([1-4]):([1-3])\b/);
  return match ? [+match[1], +match[2]] : [1, 2];
}
export function recommendation(
  day: number,
  logs: Log[],
  plan = makePlan(),
): Workout {
  const w = plan[Math.max(0, Math.min(31, day - 1))];
  const risk = safety(logs);
  if (day === 0 || day > 32)
    return {
      day,
      stage: day === 0 ? "Hari persiapan" : "Setelah lomba",
      kind: "rest",
      title:
        day === 0 ? "Mulai dari langkah kecil" : "Pulih & nikmati pencapaian",
      phases: [],
    };
  if (risk === "red")
    return {
      ...w,
      kind: "rest",
      title: "Utamakan pemulihan & keselamatan",
      phases: [],
    };
  if (w.kind === "race") {
    const previous = logs
      .filter((l) => l.completed && l.pain === 0 && !l.symptoms && l.rpe <= 6)
      .at(-1);
    const [run, walk] = practicedRatio(previous?.title || "");
    return {
      ...w,
      phases: Array.from({ length: Math.ceil(90 / (run + walk)) }, () => [
        { label: "Lari ringan", seconds: run * 60 },
        { label: "Jalan & pulihkan", seconds: walk * 60 },
      ]).flat(),
    };
  }
  if (w.kind === "rest") return w;
  const last = logs
    .filter(
      (l) =>
        l.completed &&
        l.seconds >= 600 &&
        l.pain === 0 &&
        !l.symptoms &&
        l.rpe <= 6,
    )
    .at(-1);
  if (risk === "yellow" || !last)
    return { ...w, title: "Tetap ringan · 1:2", phases: intervals(1, 2, 4) };
  const proposed = total(w.phases),
    cap = Math.min(proposed, last.seconds + 300);
  let phases = w.phases;
  if (cap < proposed) {
    const [run, walk] = practicedRatio(last.title);
    phases = intervals(
      run,
      walk,
      Math.max(1, Math.floor((cap - 600) / ((run + walk) * 60))),
    );
  }
  const run = phases.find((p) => p.label === "Lari ringan")!.seconds / 60,
    walk = phases.find((p) => p.label === "Jalan & pulihkan")!.seconds / 60;
  return { ...w, title: `Run / walk santai · ${run}:${walk}`, phases };
}
export function createLog(
  timer: TimerState,
  input: Pick<Log, "rpe" | "pain" | "symptoms" | "notes" | "distance">,
  now = Date.now(),
): Log {
  return {
    id: crypto.randomUUID(),
    date: dateKey(new Date(now)),
    title: timer.title,
    seconds: Math.floor(elapsed(timer, now)),
    completed: elapsed(timer, now) >= total(timer.phases),
    ...input,
  };
}
const object = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;
const finite = (v: unknown, min: number, max: number) =>
  typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
const text = (v: unknown, max = 200) =>
  typeof v === "string" && v.length <= max;
const validDate = (v: unknown) =>
  typeof v === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  Number.isFinite(epoch(v)) &&
  new Date(epoch(v)).toISOString().slice(0, 10) === v;
const phasesValid = (v: unknown) =>
  Array.isArray(v) &&
  v.length <= 200 &&
  v.every((p) => object(p) && text(p.label, 80) && finite(p.seconds, 1, 5400));
export function validateData(raw: unknown): Data {
  if (
    !object(raw) ||
    raw.version !== 1 ||
    !object(raw.profile) ||
    !Array.isArray(raw.logs) ||
    raw.logs.length > 10000 ||
    !Array.isArray(raw.plan) ||
    raw.plan.length !== 32 ||
    !Array.isArray(raw.checklist) ||
    raw.checklist.length > 100 ||
    !object(raw.preferences)
  )
    throw new Error("Format cadangan tidak valid (versi 1 diperlukan).");
  const p = raw.profile,
    pref = raw.preferences;
  if (
    !text(p.name, 80) ||
    !text(p.bib, 20) ||
    p.raceDate !== RACE ||
    p.startDate !== "2026-10-07" ||
    p.distance !== 5 ||
    p.cot !== 90 ||
    typeof pref.audio !== "boolean" ||
    typeof pref.vibration !== "boolean" ||
    !["light", "dark", "system"].includes(String(pref.theme))
  )
    throw new Error("Profil atau preferensi tidak valid.");
  if (
    !raw.plan.every(
      (w, i) =>
        object(w) &&
        w.day === i + 1 &&
        text(w.title) &&
        text(w.stage) &&
        ["rest", "run", "race"].includes(String(w.kind)) &&
        phasesValid(w.phases) &&
        (w.kind === "rest" || (w.phases as Phase[]).length > 0),
    )
  )
    throw new Error("Rencana tidak valid.");
  if (
    !raw.logs.every(
      (l) =>
        object(l) &&
        text(l.id, 80) &&
        validDate(l.date) &&
        text(l.title) &&
        finite(l.seconds, 0, 86400) &&
        finite(l.rpe, 1, 10) &&
        finite(l.pain, 0, 10) &&
        typeof l.symptoms === "boolean" &&
        typeof l.completed === "boolean" &&
        text(l.notes, 500) &&
        (l.distance === undefined || finite(l.distance, 0, 100)),
    )
  )
    throw new Error("Catatan latihan tidak valid.");
  if (
    new Set(raw.logs.map((l) => l.id)).size !== raw.logs.length ||
    new Set(raw.checklist.map((c) => (object(c) ? c.id : null))).size !==
      raw.checklist.length ||
    !raw.checklist.every(
      (c) =>
        object(c) &&
        text(c.id, 80) &&
        text(c.group, 80) &&
        text(c.label) &&
        typeof c.done === "boolean",
    )
  )
    throw new Error("Checklist atau ID tidak valid.");
  const canonical = makePlan();
  if (
    !raw.plan.every(
      (w, i) =>
        w.kind === canonical[i].kind &&
        w.phases.length === canonical[i].phases.length &&
        w.phases.every(
          (p: Phase, j: number) =>
            p.label === canonical[i].phases[j].label &&
            p.seconds === canonical[i].phases[j].seconds,
        ),
    )
  )
    throw new Error(
      "Rencana latihan tidak didukung. Gunakan cadangan Skybridge 32 asli.",
    );
  const t = raw.timer;
  if (
    t !== null &&
    (!object(t) ||
      !text(t.title) ||
      !phasesValid(t.phases) ||
      (t.phases as Phase[]).length === 0 ||
      total(t.phases as Phase[]) > 86400 ||
      !finite(t.elapsed, 0, total(t.phases as Phase[])) ||
      !["running", "paused", "ended"].includes(String(t.status)) ||
      !["training", "mager", "race"].includes(String(t.mode)) ||
      !(t.startedAt === null || finite(t.startedAt, 0, 8640000000000000)) ||
      (t.status === "running" && t.startedAt === null) ||
      (t.status !== "running" && t.startedAt !== null) ||
      (t.raceStartedAt !== undefined &&
        !finite(t.raceStartedAt, 0, 8640000000000000)) ||
      (t.mode === "race" && t.raceStartedAt === undefined))
  )
    throw new Error("Timer tidak valid.");
  return structuredClone(raw) as unknown as Data;
}
