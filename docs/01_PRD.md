# Skybridge 32 — Product Requirements Document

## 1. Product goal

Build a mobile-first PWA that turns a 32-day countdown into a simple daily training workflow for a beginner preparing for a 5K.

## 2. MVP modules

### Dashboard / Today

Must show:

- days remaining;
- race date;
- BIB;
- distance;
- today's workout;
- next scheduled session;
- quick start;
- recent completion state.

### Run/Walk Coach

Must provide:

- large current phase;
- countdown;
- elapsed time;
- next phase;
- pause/resume;
- finish;
- restart;
- audio/vibration cues where supported.

### Workout Log

Capture:

- date;
- session type;
- planned duration;
- actual duration;
- optional distance;
- optional pace;
- RPE 1–10;
- soreness/pain flag;
- notes.

### Progress

Show:

- sessions completed;
- active minutes;
- longest session;
- optional longest distance;
- recent RPE;
- readiness milestones.

### Race Prep

Checklist for:

- BIB/race pack;
- shoes;
- socks;
- clothing;
- phone;
- ID;
- transport;
- hydration;
- pre-race timing;
- organizer instructions.

### Mager Mode

A 10-minute minimum session for low-motivation days.

Rules:

- start immediately;
- easy intensity;
- stopping after 10 minutes is acceptable;
- completing Mager Mode counts as a useful movement session, not as a full planned workout.

### Race Day

A stripped-down interface with:

- race distance;
- elapsed time;
- run/walk cue;
- manual checkpoints;
- hydration reminder;
- finish action.

## 3. MVP acceptance criteria

- App loads on a mobile browser.
- App is installable as a PWA.
- Core shell can be used offline after initial load.
- Workout logs survive refresh and browser restart.
- Timer works without network access.
- User can pause/resume/end a workout.
- Data remains on-device.
- User can export or delete local data.
- No login is required.
- No third-party API is required.

## 4. UX requirements

- One-handed use.
- Large tap targets.
- High contrast.
- Minimal typing.
- Calm language.
- No shame for missed workouts.
- No competitive language.
- Current action always obvious.

## 5. Functional safety

The app must never instruct the user to ignore concerning symptoms or push through pain.

If the user records significant pain, illness, dizziness, chest symptoms, or another concerning condition, the app should recommend stopping/resting and seeking appropriate medical advice rather than increasing load.

## 6. Future features

Only after V0 is proven useful:

- adaptive plan engine;
- 5K simulation;
- race strategy card;
- weather;
- GPS;
- export;
- cloud sync;
- optional Strava import;
- optional AI coaching.
