# VOX — MVP Product Architecture
Status: working baseline from repository audit, 2026-11-20.

## Product definition
VOX is a personal communication coach. The first useful release helps a user practice one real communication skill through a guided session, receive honest feedback grounded in observable evidence, and choose a next step. It is not a dashboard, transcription utility, generic chatbot or gamified course catalog.

## Primary user journey
1. Access: create account or sign in.
2. Set intention: choose a communication goal (clarity, confidence, calm authority).
3. Calibrate: short baseline prompt; explain microphone use and consent.
4. Practice: one guided exercise or role-play with context, objective and success criteria.
5. Respond: voice or text; show recording, processing and playback states.
6. Feedback: concise strengths, one priority improvement and transcript examples. Acoustic feedback only when actually measured.
7. Close: save or discard; explain exactly what is retained.
8. Continue: recommend the next practice using completed sessions, not invented scores.

## MVP navigation
Three destinations only:
- Practicar: active goal and one recommended session.
- Sesiones: saved practices and reports.
- Cuenta: profile, privacy, export and deletion.
Simulations are a practice type inside Practicar, not a separate top-level destination in MVP. Defer library and gamification.

## Screen contracts
### Practicar
Show active goal, one recommended exercise and a clear start action. Empty state asks the user to set a goal. No XP, streak, score or weekly chart until backed by real events.

### Session setup
Show scenario, role, objective, constraints, estimated duration only when configured, and what feedback can/cannot measure. Choose voice or text. Request microphone permission only after explicit voice action.

### Active session
One main action at a time. States: idle, permission request, recording, transcribing, generating, speaking, paused, recoverable error and completed. User can end at any time. Never record secretly.

### Feedback
Separate content observations from acoustic measurements. Use short examples as evidence. No numerical grade until a repeatable rubric exists. Give one actionable recommendation and optional retry.

### Sesiones
Show saved sessions only. Include date, exercise, duration when measured, report availability, loading/empty/error states and deletion.

### Cuenta
Show account, sign-out, privacy, data export/deletion path and voice engine availability only when relevant.

## Logical domain model (not a Supabase migration)
profiles, communication_goals, exercises, scenarios, sessions, optional session_turns, feedback_reports, user_preferences.
User-owned rows require RLS. Never put service-role credentials in client code. Audio is off by default; storage requires explicit opt-in and deletion semantics.

## Application boundaries
UI renders state and emits user intent; it does not call Supabase or local engine directly.
- Auth service owns session state.
- Session service owns lifecycle and persistence.
- Voice adapter abstracts local Termux prototype from future authenticated backend.
- Conversation service composes scenario instructions and context.
- Analysis service is deferred until evidence and measurement contracts are defined.

## Delivery phases
### P0 Audit and stabilize
- [x] Inspect full Git tree and Pages deployment path.
- [x] Identify active and legacy frontends.
- [x] Map published auth, conversation and voice path.
- [x] Identify fake navigation and metrics.
- [ ] Inspect Supabase schema, RLS, Storage policies and auth configuration.
- [ ] Run live Android/Chrome/Termux smoke test.

### P1 Product contract
- [x] Define primary user journey.
- [x] Propose MVP navigation and screen contracts.
- [ ] Finalize first target persona and initial goal set.
- [ ] Define acceptance criteria and success metrics.
- [ ] Approve transcript/audio retention policy.

### P2 UX prototype
- [ ] Wireflow for onboarding, setup, active session, feedback, history and account.
- [ ] Empty/loading/error/permission states.
- [ ] Verify every action has a destination and result.

### P3 Design system
- [ ] Brand and visual direction.
- [ ] Tokens and component states.
- [ ] Mobile-first screens and responsive rules.
- [ ] Accessibility and reduced-motion rules.

### P4 Technical foundation
- [ ] Choose module/build strategy and deployment layout.
- [ ] Define database schema, RLS and migrations.
- [ ] Define voice adapter contract and backend migration plan.
- [ ] Add tests and release checks.

### P5 MVP implementation
- [ ] Auth and onboarding.
- [ ] Guided session lifecycle.
- [ ] Voice/text input and error recovery.
- [ ] Evidence-based feedback.
- [ ] Saved sessions/history and user controls.
- [ ] QA and limited release.

## MVP acceptance criteria
- New user registers, sets a goal and completes a guided practice without dead ends.
- Returning user can resume the next recommended practice.
- Voice use is explicit, visible and stoppable.
- Text remains available when microphone/engine is unavailable.
- No unsupported analysis claims or scores.
- Save/discard is clear; saved data is isolated and deletable.
- Core flow works on Android Chrome at narrow mobile widths.
- Errors are actionable and do not silently lose user input.

## Architecture decisions
| ID | Decision | Status |
|---|---|---|
| A-001 | GitHub Pages active artifact is preview/; root frontend is legacy | Confirmed by workflow |
| A-002 | Retire current fake dashboard metrics and dead sections | Approved |
| A-003 | Session is the core product object | Working baseline |
| A-004 | MVP navigation: Practicar, Sesiones, Cuenta | Proposed |
| A-005 | Keep Termux voice bridge for development only | Confirmed constraint |
| A-006 | Do not persist audio by default | Strategic direction; retention policy to approve |

## Change control
Scope, data retention, voice architecture and navigation decisions must be recorded in the Notion Product & Engineering HQ before implementation. Every feature needs an end-to-end flow, states, acceptance criteria and test plan.
