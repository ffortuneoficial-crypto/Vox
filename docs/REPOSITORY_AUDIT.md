# VOX — Repository Audit
Audit date: 2026-11-20 | Branch: main | Method: static source inspection; no Android runtime, Supabase schema/RLS, or browser tests performed.

## Executive verdict
VOX is a prototype with a functioning but locally dependent, turn-based voice conversation path. The repository contains two divergent frontends. GitHub Pages deploys only preview/. Its dashboard contains dead navigation and hardcoded progress claims. The core session is the only coherent product capability worth carrying forward.

**Decision:** stop adding to the dashboard. Preserve auth and the voice loop as salvageable modules; rebuild the product shell around a guided practice session.

## Repository map
- Root: README.md, index.html, auth.html, manifest.webmanifest, sw.js
- Legacy root app: css/app.css, js/app.js
- Product docs: docs/PRODUCT_DIRECTION.md
- Local prototype bridge: local-engine/README.md, local-engine/server.mjs
- Published Pages app: preview/index.html, app.js, app.css, auth.html, auth.js, auth.css, sw.js, manifest.webmanifest, tokens.css, icon and mascot assets
- GitHub Pages workflow: .github/workflows/pages.yml
- Recursive tree: 28 paths. No package.json, lockfile, automated tests, lint/type checks or build step found.

## Deployment facts
- Pages workflow uploads the preview/ directory as the site artifact.
- Root index.html redirects to root auth.html; root auth.html redirects to preview/auth.html.
- Therefore preview/ is the active production-facing frontend. Root js/app.js and css/app.css are legacy/orphaned assets.
- Workflow deploys on pushes to main or feature/vox-app-interface when preview/** or workflow changes. It has no test/build gate.

## Feature reality matrix
| Feature | Source evidence | Verdict |
|---|---|---|
| Email/password auth | preview/auth.js uses Supabase Auth, validates fields, checks session and redirects | Implemented in source; runtime not tested |
| Protected app entry | preview/app.js checks getSession and handles sign-out | Implemented in source |
| Text conversation | POST /api/chat, context in memory, browser SpeechSynthesis | Implemented; requires local engine |
| Voice conversation | MediaRecorder → local Whisper → OmniRoute → browser speech | Implemented as push-to-talk/turn-based prototype |
| Full-duplex realtime voice | No streaming/session protocol | Not implemented |
| Training modules | data-focus buttons select one of four prompts | Partial prompt selection only |
| Simulations | Scenario cards select generic focus prompts; no scenario roles/rubrics | Not implemented |
| Dashboard navigation | HTML uses data-section; JS only registers data-go and screens=["home"] | Dead / inert |
| Progress metrics | XP, streak, levels, chart, session totals and score are literal HTML values | Mock data; remove |
| History and reports | Published app stores conversation in memory; no session/report persistence | Not implemented |
| Session counter | localStorage vox.sessionCount increments at session end | Local counter, not authenticated or reliable |
| Library | Visible nav destination, no route/content implementation | Not implemented |
| Account/settings | Auth and logout exist; no real settings surface | Partial |
| Audio persistence | Published preview does not save audio. Legacy root app uploads audio to Supabase Storage vox-audio and inserts vox_sessions | Conflicting implementations |
| PWA | Manifest and service worker in preview | Source exists; offline/runtime not tested |

## Critical findings
### P0 — Navigation is decorative
Sidebar and mobile nav expose Inicio, Entrenamiento, Simulaciones, Progreso, Historial and Biblioteca. Published JS does not implement these destinations. Only the single home screen is registered.

### P0 — Fake metrics destroy trust
Published markup hardcodes 120 XP, 4-day streak, 2/4 objectives, level 03, 12 sessions, 2.5 hours, 75%, 150 minutes, 18% improvement and 86/100. No data model or calculations back them.

### P0 — Product and interface mismatch
Product direction describes practice, simulations, analysis and evidence. Published UI is a static dashboard; its working core is a generic voice/text conversation. There is no defined exercise lifecycle, feedback report or next recommendation.

### P1 — Two incompatible app generations
Root js/app.js implements a separate recording/transcript/history flow and Supabase Storage/database writes. Preview app.js implements the local conversational engine and does not persist sessions. Do not merge blindly.

### P1 — Local bridge is not a production backend
local-engine/server.mjs binds to 127.0.0.1 and proxies Whisper/OmniRoute. It has no user auth or per-user authorization. It is suitable for personal Termux development only.

### P1 — Missing engineering guardrails
No automated tests, package manifest, lint/type checks, environment template or CI test gate were found.

### P1 — Cache release risk
preview/sw.js caches assets and removes prior caches at activation. Cache versions and asset references must be updated and tested on installed PWAs.

## Salvage / rebuild decisions
| Component | Decision |
|---|---|
| preview/auth.* | Preserve and regression-test |
| preview voice loop | Preserve as prototype adapter; refactor behind a service interface |
| local-engine | Keep for local development only |
| Current dashboard and fake progress | Retire and replace |
| Root legacy recorder/database flow | Audit separately; do not merge yet |
| Current tokens.css | Disposable draft; visual direction rejected |
| PRODUCT_DIRECTION.md | Keep as strategic input and reconcile with this audit |

## Proposed target architecture
PWA single frontend:
- App shell and route/state controller
- Auth boundary
- Onboarding and communication goal
- Practice home with one next action
- Guided session runtime: brief, voice/text input, conversation, states, completion
- Evidence-backed feedback
- Saved session history
- Account and privacy

Application services:
- Auth service
- Session lifecycle/persistence service
- Voice adapter (Termux prototype now; authenticated backend later)
- Conversation/scenario service
- Analysis service (deferred until evidence and measurement contract exist)

Logical data model (not existing migrations):
profiles, communication_goals, exercises, scenarios, sessions, optional session_turns, feedback_reports, user_preferences. All user-owned rows require RLS. Audio is off by default; storage requires explicit consent and deletion rules.

## Recommended source structure
preview/
- index.html, auth.html, manifest.webmanifest, sw.js
- assets/icons and fonts
- src/app (bootstrap, router, state)
- src/features (onboarding, training, session, simulations, feedback, history, account)
- src/services (auth, sessions, conversation, voice)
- src/shared (components, styles, utils)
- src/data (scenarios, exercises)

This is a target proposal, not the current tree. Do not migrate until contracts and deployment approach are agreed.

## Immediate work sequence
1. Freeze dashboard additions; remove mock metrics from the future shell.
2. Define journey: onboarding → goal → guided practice → feedback → save/discard → next practice.
3. Define route/state and feature contracts.
4. Decide transcript/audio retention before database writes.
5. Refactor voice loop behind an adapter without changing its behavior.
6. Build one end-to-end flow at a time.
7. Add smoke tests and Android QA.

## Audit limitations
- Supabase schemas, RLS, Storage policies and auth settings were not inspected.
- No live Android/Chrome/Termux tests were run.
- Microphone, speech synthesis, PWA offline and bridge connectivity were inspected statically only.
- No production backend exists in the inspected tree.

## Product decision
VOX MVP is a guided communication practice session, not a dashboard. The session is the primary product object; navigation, progress, reports and gamification are secondary and only appear when backed by real behavior and data.
