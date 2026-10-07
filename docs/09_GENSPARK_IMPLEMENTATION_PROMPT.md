# Skybridge 32 — Genspark Implementation Prompt

You are implementing a production-quality mobile-first PWA named **Skybridge 32 — Personal 5K Race Coach**.

## Mission

Build a focused 32-day preparation companion for a beginner preparing for Skybridge Run 2026 5K.

User profile:

- Name: Haidar
- BIB: #6
- Distance: 5K
- Race date: 2026-11-08
- COT: 90 minutes
- Preparation starts: 2026-10-07

Primary outcome:

**Help the user finish the 5K within the official COT safely and confidently.**

Do not optimize for podium performance.

## Implementation rules

1. Use the existing repository conventions if present.
2. Prefer TypeScript.
3. Build a mobile-first responsive PWA.
4. Make the core workflow work offline after first load.
5. Use IndexedDB for persistent local data.
6. Do not require authentication.
7. Do not require a backend.
8. Do not require external APIs.
9. Do not add analytics or tracking.
10. Do not place secrets in the client.
11. Keep the architecture simple enough to maintain during a 32-day real-world trial.

## Required screens

### Today

Display:

- Skybridge 32;
- BIB #6 — Haidar;
- 5K;
- race date;
- countdown;
- today's workout;
- primary Start button;
- Mager Mode.

### Coach

Build a robust run/walk timer:

- current phase;
- countdown;
- elapsed time;
- next phase;
- pause;
- resume;
- end;
- restart;
- optional audio;
- optional vibration.

Timer state must survive ordinary UI rerenders and must not depend on network access.

### Progress

Show:

- completed sessions;
- active minutes;
- longest session;
- optional distance;
- recent RPE;
- current training phase.

### Race Prep

Create a persistent checklist for equipment, race pack, transport and personal preparation.

### Race Day

Build a minimal interface optimized for quick glance use.

## Training engine

Implement a conservative 32-day plan.

Days 1–7:

- establish consistency;
- 3 easy sessions;
- discover comfortable run/walk rhythm.

Days 8–16:

- 3 sessions/week;
- gradually extend easy activity;
- examples: 2:2, 3:2, 4:2 run/walk.

Days 17–24:

- longer easy;
- controlled run/walk;
- recovery.

Days 25–28:

- race-specific rehearsal;
- optional 5K simulation only if readiness supports it.

Days 29–31:

- taper.

Day 32:

- race day.

Never double a missed workout.

Never instruct the user to push through pain.

If the user records concerning symptoms or high pain, switch to recovery/safety messaging rather than progression.

## Mager Mode

Add a highly visible low-friction mode:

> Cuma 10 menit dulu.

It starts a 10-minute easy movement timer.

Stopping at 10 minutes is allowed.

The purpose is consistency, not punishment.

## Visual direction

Use a calm, practical, modern interface.

Avoid:

- excessive neon;
- leaderboard aesthetics;
- fake athlete imagery;
- aggressive motivational language;
- clutter.

Prioritize:

- large typography;
- clear hierarchy;
- large controls;
- one-handed use;
- dark/light readability;
- reduced-motion support.

## Persistence

Implement an IndexedDB repository layer.

Store:

- race profile;
- workout plan;
- workout logs;
- checklist;
- preferences.

Add export and delete/reset controls.

Validate imported data.

## PWA

Include:

- manifest;
- icons/placeholders as appropriate;
- service worker;
- installability;
- offline app shell.

## Testing

At minimum test:

- countdown calculation;
- race date countdown;
- interval transitions;
- pause/resume;
- local persistence;
- log creation;
- export/import validation;
- Mager Mode;
- no negative countdown display;
- malformed local data recovery.

Run typecheck, lint and production build.

## Delivery

Do not stop at a mockup.

Implement the working product.

Document:

- setup;
- development;
- build;
- deployment;
- data model;
- limitations.

If a decision is not specified, choose the simplest safe option and document it. Do not block implementation over minor aesthetic decisions.

## Final QA

Before declaring complete, verify:

1. fresh install works;
2. dashboard renders;
3. timer starts;
4. timer pauses/resumes;
5. workout can be saved;
6. saved workout survives refresh;
7. progress updates;
8. checklist persists;
9. app shell works offline;
10. export works;
11. delete/reset works;
12. production build succeeds.

Organizer rules remain authoritative over app assumptions.
