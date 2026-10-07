# Skybridge 32 — Data Model

## RaceProfile

```ts
type RaceProfile = {
  name: string
  bib: string
  distanceKm: number
  raceDate: string
  cutoffMinutes: number
  eventName: string
  location?: string
}
```

Example:

```json
{
  "name": "Haidar",
  "bib": "6",
  "distanceKm": 5,
  "raceDate": "2026-11-08",
  "cutoffMinutes": 90,
  "eventName": "Skybridge Run 2026",
  "location": "Purwokerto"
}
```

## Workout

```ts
type Workout = {
  id: string
  date: string
  phase: string
  type: "easy" | "run-walk" | "long-easy" | "recovery" | "simulation" | "race"
  plannedMinutes: number
  intervals?: {
    workSeconds: number
    recoverySeconds: number
    repeats: number
  }
  rationale: string
}
```

## WorkoutLog

```ts
type WorkoutLog = {
  id: string
  workoutId?: string
  startedAt: string
  endedAt: string
  actualMinutes: number
  distanceKm?: number
  paceMinPerKm?: number
  rpe?: number
  soreness?: "none" | "mild" | "moderate" | "high"
  painFlag: boolean
  notes?: string
}
```

## ChecklistItem

```ts
type ChecklistItem = {
  id: string
  category: "race-pack" | "equipment" | "transport" | "nutrition" | "other"
  label: string
  checked: boolean
}
```

## Preferences

```ts
type Preferences = {
  audioEnabled: boolean
  vibrationEnabled: boolean
  reducedMotion: boolean
}
```

## Storage

Suggested object stores:

- `raceProfile`
- `workouts`
- `workoutLogs`
- `checklist`
- `preferences`

## Data lifecycle

- Data is local by default.
- Export is user initiated.
- Delete is user initiated.
- No remote retention in V0.

## Migration

Use a schema version in IndexedDB.

Example:

```ts
const DB_VERSION = 1
```

Future versions must migrate rather than silently discard existing logs.
