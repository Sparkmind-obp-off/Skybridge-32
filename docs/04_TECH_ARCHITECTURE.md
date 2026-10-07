# Skybridge 32 — Technical Architecture

## V0 architecture

**Browser/PWA → local application state → IndexedDB**

Hosting:

**Cloudflare Pages**

No backend is required for V0.

## Stack

Recommended:

- TypeScript
- React or lightweight TypeScript UI
- CSS
- IndexedDB
- Service Worker
- Web App Manifest
- Web Speech API and/or Web Audio API
- Vibration API where supported

## Data persistence

Use IndexedDB for:

- race profile;
- workout definitions;
- workout logs;
- checklist state;
- app preferences.

Use localStorage only for tiny non-critical preferences if needed.

## Offline

Service worker should cache:

- app shell;
- static assets;
- core fonts/assets;
- required workout data.

Core coach timer must not depend on a network request.

## Privacy

V0 must not send training data to a server.

No:

- analytics;
- ad SDK;
- tracking pixel;
- account system;
- location upload.

Provide:

- JSON export;
- local data reset/delete.

## Optional later architecture

V1:

Browser → Cloudflare Worker → optional external APIs

V1 sync:

Browser → Worker → D1

V2 integrations:

- weather provider;
- GPS;
- Strava;
- optional AI provider.

Do not implement these until V0 usage demonstrates a need.

## Error handling

The app should fail locally and visibly:

- timer failure must not erase the log;
- malformed stored data should be recoverable;
- storage unavailable should trigger a clear fallback warning;
- export must remain possible whenever data is readable.

## Security

- no secrets in client bundle;
- no API keys in V0;
- validate imported JSON before storing;
- constrain free-text size;
- escape rendered user notes;
- do not trust imported race configuration blindly.

## Deployment

Target:

Cloudflare Pages connected to GitHub repository.

Recommended CI checks:

- typecheck;
- lint;
- unit tests;
- production build.

## Architecture rule

Do not introduce infrastructure simply because it is available.

Every dependency must earn its place by improving the user's actual preparation workflow.
