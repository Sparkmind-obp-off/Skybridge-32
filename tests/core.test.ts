import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";
import {
  countdown,
  trainingDay,
  dateKey,
  makePlan,
  defaults,
  total,
  magerPhases,
  position,
  pause,
  resume,
  elapsed,
  format,
  createLog,
  validateData,
  safety,
  recommendation,
  type TimerState,
  type Log,
} from "../src/core";
import { Repository } from "../src/repository";
const timer = (): TimerState => ({
  title: "Test · 1:2",
  phases: [
    { label: "Lari", seconds: 60 },
    { label: "Jalan", seconds: 120 },
  ],
  elapsed: 0,
  startedAt: 1000,
  status: "running",
  mode: "training",
});
const log = (extra: Partial<Log> = {}): Log => ({
  id: "one",
  date: "2026-10-08",
  title: "Run / walk · 1:2",
  seconds: 1320,
  rpe: 3,
  pain: 0,
  symptoms: false,
  notes: "",
  completed: true,
  ...extra,
});
describe("dates and plan", () => {
  it("32 day countdown and local calendar", () => {
    expect(countdown("2026-10-07")).toBe(32);
    expect(countdown("2026-11-08")).toBe(0);
    expect(countdown("2026-11-10")).toBe(0);
    expect(dateKey(new Date(2026, 9, 7))).toBe("2026-10-07");
  });
  it("day zero and race day line up", () => {
    expect(trainingDay("2026-10-07")).toBe(0);
    expect(trainingDay("2026-10-08")).toBe(1);
    expect(trainingDay("2026-11-08")).toBe(32);
    expect(trainingDay("2026-11-09")).toBe(33);
  });
  it("32 days including recovery and taper", () => {
    const plan = makePlan();
    expect(plan).toHaveLength(32);
    expect(plan.slice(0, 7).filter((w) => w.kind === "run")).toHaveLength(3);
    expect(plan[31].kind).toBe("race");
    expect(total(plan[28].phases)).toBeLessThan(total(plan[25].phases));
    expect(plan[29].kind).toBe("rest");
  });
  it("missing sessions are never doubled", () => {
    expect(total(recommendation(21, []).phases)).toBe(1320);
    expect(recommendation(22, []).kind).toBe("rest");
    expect(total(recommendation(21, [log()]).phases)).toBeLessThanOrEqual(1620);
  });
  it("red flags stop progression", () => {
    for (const l of [log({ pain: 4 }), log({ symptoms: true })]) {
      expect(safety([l])).toBe("red");
      expect(recommendation(21, [l]).kind).toBe("rest");
      expect(recommendation(32, [l]).phases).toEqual([]);
    }
  });
  it("yellow reduces workload", () => {
    expect(safety([log({ rpe: 8 })])).toBe("yellow");
    expect(total(recommendation(21, [log({ rpe: 8 })]).phases)).toBe(1320);
  });
  it("race uses practiced ratio, never arbitrary dangerous title", () => {
    const phases = recommendation(32, [log({ title: "Test 0:0" })]).phases;
    expect(total(phases)).toBe(5400);
    expect(phases[0].seconds).toBe(60);
  });
});
describe("timer", () => {
  it("transitions at exact boundaries", () => {
    expect(position(timer(), 60999).label).toBe("Lari");
    expect(position(timer(), 61000).label).toBe("Jalan");
    expect(position(timer(), 61000).remaining).toBe(120);
    expect(position(timer(), 181000).finished).toBe(true);
  });
  it("pause and resume exclude paused time", () => {
    const paused = pause(timer(), 31000);
    expect(elapsed(paused, 999000)).toBe(30);
    const running = resume(paused, 1000000);
    expect(elapsed(running, 1010000)).toBe(40);
  });
  it("format and elapsed never negative and end bounded", () => {
    expect(format(-4)).toBe("00:00");
    expect(position(timer(), -1000).remaining).toBe(60);
    expect(position(timer(), 99999999).remaining).toBe(0);
    expect(elapsed(timer(), 99999999)).toBe(180);
  });
  it("Mager stops at ten minutes without extra intervals", () => {
    const t = { ...timer(), phases: magerPhases, mode: "mager" as const };
    expect(total(t.phases)).toBe(600);
    expect(position(t, 601000).finished).toBe(true);
    expect(position(t, 600000).remaining).toBe(1);
  });
  it("creates finished or partial log", () => {
    const input = { rpe: 3, pain: 0, symptoms: false, notes: "Santai" };
    expect(createLog(timer(), input, 181000).completed).toBe(true);
    expect(createLog(timer(), input, 61000).seconds).toBe(60);
    expect(createLog(timer(), input, 61000).completed).toBe(false);
  });
  it("survives snapshots and ordinary renders", () => {
    const copy = JSON.parse(JSON.stringify(timer()));
    expect(position(copy, 91000)).toEqual(position(timer(), 91000));
  });
});
describe("import/export", () => {
  it("roundtrips valid data", () => {
    const d = defaults();
    d.logs.push(log());
    expect(validateData(JSON.parse(JSON.stringify(d)))).toEqual(d);
  });
  it("rejects malformed payloads", () => {
    for (const value of [null, {}, [], { version: 2 }, "hello"])
      expect(() => validateData(value)).toThrow();
  });
  it("rejects invalid logs and timer states", () => {
    const d = defaults();
    d.logs = [log({ rpe: NaN })];
    expect(() => validateData(d)).toThrow();
    d.logs = [log({ date: "2026-02-31" })];
    expect(() => validateData(d)).toThrow();
    d.logs = [];
    d.timer = { ...timer(), elapsed: -1 };
    expect(() => validateData(d)).toThrow();
    d.timer = { ...timer(), status: "paused" };
    expect(() => validateData(d)).toThrow();
  });
  it("rejects excessive text, duplicate IDs, foreign profile", () => {
    const d = defaults();
    d.logs = [log({ notes: "x".repeat(501) })];
    expect(() => validateData(d)).toThrow();
    d.logs = [log(), log()];
    expect(() => validateData(d)).toThrow();
    d.logs = [];
    d.profile.cot = 100;
    expect(() => validateData(d)).toThrow();
  });
});
describe("IndexedDB repository", () => {
  beforeEach(() => {
    globalThis.indexedDB = new IDBFactory();
  });
  it("fresh install persists all data and survives reopening", async () => {
    const repo = new Repository();
    await repo.open();
    const d = await repo.load();
    d.logs = [log()];
    d.checklist[0].done = true;
    d.preferences.theme = "dark";
    d.timer = pause(timer(), 31000);
    await repo.save(d);
    repo.close();
    const reopened = new Repository();
    await reopened.open();
    expect(await reopened.load()).toEqual(d);
    reopened.close();
  });
  it("quarantines malformed local data without losing raw recovery", async () => {
    const repo = new Repository();
    await repo.open();
    await repo.load();
    const db = await new Promise<IDBDatabase>((resolve) => {
      const request = indexedDB.open("skybridge32", 1);
      request.onsuccess = () => resolve(request.result);
    });
    await new Promise<void>((resolve) => {
      const tx = db.transaction("state", "readwrite");
      tx.objectStore("state").put({ broken: true }, "app");
      tx.oncomplete = () => resolve();
    });
    expect(await repo.load()).toEqual(defaults());
    expect(repo.recovered).toBe(true);
    expect(await repo.recovery()).toEqual({ broken: true });
    db.close();
    repo.close();
  });
  it("reset clears logs, preferences, checklist and timer", async () => {
    const repo = new Repository();
    await repo.open();
    const d = defaults();
    d.logs = [log()];
    d.checklist[0].done = true;
    await repo.save(d);
    expect(await repo.reset()).toEqual(defaults());
    expect(await repo.load()).toEqual(defaults());
    repo.close();
  });
});
