# VOX — Product & Technical Architecture
**Version:** 0.2 — cloud conversational AI direction  
**Date:** 2026-11-20  
**Status:** target architecture proposal; provider and runtime choices require validation.

## 1. Product architecture
VOX has one shared conversational core and multiple behavior modes. It is a voice-first conversational AI that can follow a user-defined prompt/context and can also coach communication skills.

### Product surfaces
- Conversational AI: open-ended conversation, custom prompts, role-play and context.
- Coaching modes: voice delivery, articulation, clarity, leadership, listening, improvisation, persuasion, storytelling and difficult conversations.
- Sessions: saved conversations, practice reports and user-controlled history.
- Account: identity, preferences, privacy and data controls.

## 2. Core runtime
A session is not synonymous with a training exercise. It is a contextual interaction that may be open conversation, a guided practice or a simulation.

Each runtime request is composed from:
- Platform/system constraints.
- Selected mode instruction template (optional).
- User-provided prompt and context.
- Current session conversation history (within limits).
- User preferences explicitly enabled for the session.
- Optional coaching rubric and evidence contract.

User prompts customize the conversation but cannot override platform safety, privacy, authorization or data-retention controls.

## 3. Target cloud voice pipeline
**No local engine in the product path.**

1. PWA obtains microphone permission after explicit action.
2. Browser captures audio and sends it through an authenticated cloud endpoint.
3. Speech-to-text provider transcribes audio.
4. Conversation orchestrator combines transcript, mode instructions, user prompt and session context.
5. LLM generates a response.
6. Optional TTS provider converts response text to speech.
7. Browser plays audio and displays the text response.
8. Session service applies explicit save/discard choice.

The app owns the user experience and session state; cloud providers perform transcription, model inference and speech synthesis.

## 4. Service boundaries
- **AuthService:** Supabase Auth, identity and session renewal.
- **ConversationRuntime:** manages turns, prompt assembly, context window and cancellation.
- **ModeRegistry:** versioned mode definitions, system prompt templates, objectives, rubrics and supported capabilities.
- **SpeechToTextAdapter:** provider-neutral transcription API.
- **LanguageModelAdapter:** provider-neutral chat/generation API.
- **TextToSpeechAdapter:** provider-neutral speech synthesis API.
- **VoiceSessionController:** browser microphone lifecycle, permissions, playback, interruption and UI states.
- **SessionRepository:** save/discard/history/delete; never saves by default.
- **CoachingAnalyzer:** transcript and optional acoustic analysis, with evidence labels and confidence/limitations.
- **UsageGuard:** quotas, rate limits, cost controls and abuse prevention.

## 5. Transport strategy
Start with the simplest transport that can meet the product requirement:
- Baseline: explicit push-to-talk turns with cloud transcription, model response and optional TTS.
- Upgrade path: streaming transcription/response and interruption support where selected provider and browser APIs permit.
- Do not promise full-duplex natural conversation until latency, interruption, echo handling, browser compatibility and cost are measured.
- Keep text input available for permission denial, unsupported browsers and service outages.

## 6. Security and privacy
- Frontend contains only public Supabase configuration and no service-role/provider secrets.
- Provider secrets live in server-side environment secrets.
- Every cloud request authenticates the user and validates payload size, duration, mode and quotas.
- Enforce per-user rate limits and usage budgets.
- Do not persist raw audio by default.
- Do not persist transcripts or conversation history without explicit save consent.
- RLS protects every user-owned record; storage paths are user-scoped and private.
- Define provider retention/training settings and legal/privacy disclosures before external release.

## 7. Data model direction (not a migration)
- profiles / user_preferences
- modes (versioned definitions; may initially be static configuration)
- sessions (mode, custom prompt/context, status, timestamps, retention choice)
- session_turns (role, text, sequence, timestamps; only when user saves)
- feedback_reports (observations, evidence references, recommendations, rubric version)
- usage_events (provider, model, duration, token/audio usage, estimated cost, status)
- optional audio_assets only after explicit opt-in and defined deletion lifecycle

Existing `vox_sessions` is not assumed to be the final schema. Inspect and design a migration before changing it.

## 8. Failure and recovery states
Permission denied, no microphone, network unavailable, upload timeout, transcription failure, model timeout, TTS failure, quota exceeded, expired auth, user cancellation and partial response. Each state must preserve typed user input and explain the next action. If TTS fails, show the text response. If voice transcription fails, allow retry or text input.

## 9. Deployment and development
- Current GitHub Pages workflow publishes the root application assets through a curated `_site` directory.
- Current `local-engine/server.mjs` and Termux/Whisper/OmniRoute path are development artifacts only and must not be required by production.
- Target PWA calls authenticated cloud endpoints.
- Supabase Edge Functions are the first candidate broker; test streaming support, execution limits, payload constraints and latency before committing.
- If Edge Functions are unsuitable, deploy a dedicated authenticated backend; do not move provider secrets into the PWA.
- Add automated tests, lint/build checks, endpoint contract tests and Android Chrome smoke tests.

## 10. Design-to-implementation workflow
Mandatory sequence for every new screen or major redesign:
1. Product requirement and user flow.
2. Wireflow and all states.
3. Visual exploration in Canva, Figma, MagicPath or a justified alternative.
4. Review and approval of the visual direction.
5. Implementation in GitHub.
6. Responsive/accessibility/interaction QA.
7. Update docs and decision log.

Do not skip the design stage or treat a code mockup as approved visual design.

## 11. Architecture decisions
| ID | Decision | Status |
|---|---|---|
| A-001 | The root frontend is the sole GitHub Pages application; the separate preview frontend is removed | Owner-directed, implemented |
| A-002 | Remove fake dashboard metrics and dead sections | Approved |
| A-003 | VOX is a conversational AI plus communication-improvement modes | Owner-directed |
| A-004 | Modes are prompt/configuration presets over one shared runtime | Proposed |
| A-005 | Production voice transcription must be cloud-based in the app flow | Owner-directed |
| A-006 | No dependency on Termux, local Whisper or local OmniRoute in production | Owner-directed |
| A-007 | Keep STT, LLM and TTS provider adapters replaceable | Proposed |
| A-008 | Supabase Edge Functions are candidate broker, subject to validation | Proposed |
| A-009 | No audio/transcript persistence by default | Proposed privacy baseline |
| A-010 | Design tool exploration/review precedes interface implementation | Owner-directed |

## 12. Migration plan
1. Remove local engine requirement from production experience.
2. Select providers and validate cost, quality, language support and latency.
3. Prototype cloud STT from Android Chrome through an authenticated endpoint.
4. Add shared conversation runtime and prompt/mode registry.
5. Add optional TTS and interruption behavior.
6. Implement initial coaching modes and evidence-grounded feedback.
7. Define persistence and update Supabase schema/RLS only after data contract approval.
8. Run device, security, cost and reliability QA before public release.


## 13. Confirmed interaction and memory architecture
### Voice interaction preferences
- Support both natural conversational voice and push-to-talk.
- Store the user's interruption preference as an explicit setting and apply it in VoiceSessionController.
- Capability detection must distinguish turn-based, streaming and genuinely interruptible behavior. Never advertise a capability that the selected provider/browser combination cannot deliver.

### Memory architecture (target; not a migration)
Keep three layers separate:
1. **Session context:** short-lived context required to maintain the current conversation.
2. **Conversation history:** user-visible records retained only under the user's explicit save choice.
3. **Persistent selective memory:** useful facts/preferences/goals that VOX identifies as candidates, with transparent explanation and user control.

Requirements:
- A memory candidate is not automatically equivalent to an approved permanent memory.
- Provide inspect, correct, delete and disable controls.
- Support scoped memory (for example, by project or role) to prevent unrelated contexts from contaminating one another.
- Do not persist sensitive information by default.
- Define candidate generation, user notification/approval, retention, deletion propagation, export and provider data handling before implementation.
- Do not reuse saved conversation history as persistent memory without a separately defined and disclosed memory process.


## 14. Personality and behavior policy
VOX uses a stable base identity with context-sensitive expression.

- The base identity preserves honesty, respect, clarity, usefulness and coherence.
- A behavior profile may adjust tone, energy, formality, directness and conversational style based on user settings, mode, role and situation.
- The runtime composes these preferences with the selected mode and user prompt; user instructions cannot override safety, privacy, authorization or truthful capability claims.
- VOX may challenge assumptions and offer proactive guidance when useful, without humiliation, manipulation or artificial flattery.
- The base identity and adjustable dimensions should be represented as explicit, versioned behavior configuration rather than scattered prompt fragments.
- Exact default traits, allowed ranges and precedence rules remain to be specified before implementation.


## 15. Confirmed initiative behavior
VOX exposes three selectable initiative levels as an explicit user preference:

- **Reactive:** respond to the user's expressed request without unnecessary redirection.
- **Collaborative:** respond and ask useful questions or help expand the user's thinking.
- **Proactive:** surface meaningful opportunities, risks, contradictions, ideas and next steps without waiting for a direct request.

The proactive level is context-sensitive, not continuously interruptive. It must not inject advice into every turn or force coaching into ordinary conversation. The runtime should balance contribution with attentive listening and conversational flow.

Implementation direction:
- Store the selected initiative level in user preferences.
- Include it in runtime prompt/configuration assembly, with mode- and turn-level context able to narrow it when appropriate.
- Keep it subordinate to stable identity principles, safety, privacy, authorization and truthful capability representation.
- Provide a clear control so the user can change the level at any time.
