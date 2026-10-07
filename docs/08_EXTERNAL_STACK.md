# Skybridge 32 — External Stack

## Required for V0

None beyond hosting.

### Hosting

Cloudflare Pages.

### Browser capabilities

- IndexedDB
- Service Worker
- Web App Manifest
- Web Audio / SpeechSynthesis
- Vibration API where available

## Optional later

### Weather

Open-Meteo can be considered for race-day context.

Requirement: weather must be advisory, not a source of training certainty.

### Sync

Cloudflare Worker + D1 if multi-device continuity becomes necessary.

### Strava

Consider only if the user already wants activity import. It is not necessary for the core product.

### AI

An LLM is optional and should not control core safety logic.

## Explicitly avoid in V0

- Firebase;
- Supabase;
- paid fitness APIs;
- auth providers;
- analytics platforms;
- third-party tracking;
- LLM APIs;
- wearable SDKs.

## External authority

Organizer communications override any assumptions encoded in the app.

## Dependency principle

A provider is added only when it solves a demonstrated problem that local browser capabilities cannot solve cleanly.
