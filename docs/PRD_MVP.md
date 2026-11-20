# VOX — Product Requirements Document
**Version:** 0.2 — revised product direction  
**Date:** 2026-11-20  
**Status:** Working baseline; product direction updated by owner. Mode catalog and provider choice remain extensible.

## 1. Product definition
VOX is a voice-first conversational AI that can talk with the user in any context the user establishes. The user can choose a mode, provide a prompt, define a role or situation, or simply start an open conversation. VOX adapts its behavior to that instruction.

VOX also helps the user improve how they communicate. Communication development is a first-class capability integrated into dedicated modes, not the entire identity of the product.

**Two complementary product pillars**
1. **Talk:** a flexible conversational AI that can act as a companion, interlocutor, role-play partner, explainer, brainstorming partner, interviewer, customer, colleague or any other role established by the user's prompt.
2. **Improve:** deliberate practice modes that help users develop voice, speech and communication skills, with useful feedback based on evidence.

VOX is not restricted to workplace conversations, one persona, a fixed script or a closed course catalog.

## 2. Product principles
- Prompt-led flexibility: user instructions and selected mode establish the context, role, tone, boundaries and objective.
- Modes are behavior presets, not separate apps or hard-coded chatbots.
- Conversation first: natural back-and-forth, contextual follow-ups and continuity within a session.
- Improvement with evidence: feedback must distinguish transcript evidence from acoustic measurements and subjective coaching.
- User control: visible microphone state, explicit start/stop, text fallback and transparent data retention.
- No fake progress: no fabricated XP, streaks, scores, improvements or activity metrics.
- Cloud processing: transcription and AI conversation happen through remote services integrated into the app; no personal Termux/local engine dependency.
- Provider abstraction: speech-to-text, language model and text-to-speech services must be replaceable behind application interfaces.
- Mobile-first: optimize for Android Chrome/PWA first, without preventing later native clients.

## 3. Experience model
A user can:
- Open a free conversation and supply their own prompt/context.
- Select a communication mode and start a guided practice.
- Switch between voice and text where supported.
- Ask VOX for feedback, coaching or a retry.
- End a session and choose what, if anything, to save.

The conversation runtime is shared across modes. A mode supplies a system-instruction template, optional rubric, suggested interaction pattern and feedback contract. User prompt/context is layered into that configuration without allowing it to override platform safety, privacy or system constraints.

## 4. Initial modes (proposed v1 catalog)
Modes are initial product proposals, not a permanent limit.

### A. Conversational AI
Open conversation with a user-defined prompt, context, role and objective. VOX follows the requested conversational style and can answer, question, brainstorm, explain or role-play.

### B. Voice and delivery
- **Modulation:** variation in pitch, intonation and vocal emphasis.
- **Pace and pauses:** speaking speed, rhythm, breath-sized phrasing and intentional silence.
- **Articulation and diction:** clarity of consonants, syllables and word endings.
- **Projection and vocal energy:** audible presence and consistency, only where the audio pipeline can measure reliably.
- **Vocal expressiveness:** avoid flat delivery and use emphasis appropriately.

### C. Speaking and communication
- **Clear pronunciation / vocalization:** articulate words and phrases more clearly.
- **Clarity and structure:** organize ideas and explain them coherently.
- **Leadership and authority:** be concise, composed, assertive and respectful; avoid equating leadership with loudness or aggression.
- **Confidence in delivery:** reduce avoidable hesitation and communicate directly without diagnosing internal emotional states.
- **Active listening and response:** clarify, summarize and respond to what was actually said.
- **Improvisation:** formulate coherent responses to unexpected prompts.
- **Persuasion and storytelling:** structure arguments and narratives for a specific audience.
- **Difficult conversations:** practice disagreement, boundaries, objections and de-escalation.
- **Interviews and presentations:** rehearse answers, openings, explanations and Q&A.

### D. Role-play / simulation
User or mode chooses roles and context: interviewer, customer, supervisor, colleague, audience, negotiator, teacher, etc. Custom role-play is also possible from a prompt.

The initial release should ship a small curated selection, while keeping the mode model extensible. Do not build a giant catalog before validating use.

## 5. Shared session loop
1. **Intent:** open conversation, select a mode or enter a custom prompt.
2. **Context:** optionally set role, audience, situation, tone, objective and constraints.
3. **Input:** speak or type.
4. **Transcription:** voice is transcribed by a cloud service in the app's session flow; show processing state and recoverable errors.
5. **Conversation:** the language model receives transcript/text, mode instructions and permitted session context, then generates a response.
6. **Voice response:** text-to-speech speaks the response when voice output is enabled; text remains visible.
7. **Coaching:** on request or at an appropriate practice checkpoint, VOX provides feedback grounded in available evidence.
8. **Close:** user ends the session and chooses whether to save permitted content.

## 6. Voice and AI requirements
- Capture audio only after an explicit user action and browser permission.
- Show clear states: idle, requesting permission, recording/listening, uploading/processing, transcribing, thinking, generating speech, speaking, paused, recoverable error and completed.
- Provide a stop/cancel action and a text-input fallback.
- Transcribe in the app's user flow using a remote speech-to-text service. Do not require a local server, Termux, Whisper installation or local model.
- Do not expose provider secret keys in frontend code. Use an authenticated server-side broker (initial candidate: Supabase Edge Functions) or short-lived provider credentials where explicitly supported.
- Use streaming or chunked transport where provider and browser support it; otherwise clearly show turn-based processing. Do not label turn-based interaction as real-time.
- Separate speech-to-text, conversation model and text-to-speech adapters.
- Support interruptions and cancellation where technically supported; document any latency/duplex limitations.
- Keep text transcript visible and editable where appropriate.
- Provider selection, model selection, latency targets and cost controls must be validated before implementation.

## 7. Coaching and evidence contract
VOX can coach:
- Transcript-level behaviors: clarity of explanation, structure, concision, filler-word patterns, response relevance and argument organization.
- Audio-level behaviors only when measurable: speaking rate, pause duration, pitch variation, intensity/volume trends, articulation proxies, etc.
- Qualitative observations must be labeled as coaching interpretation, not objective measurement.
- Do not infer personality, confidence, mental health, honesty or leadership potential from voice.
- No numeric score until a defined rubric, repeatability, confidence calibration and validation exist.
- Feedback should include evidence, impact, one priority improvement and a practical retry.

## 8. Data and privacy (proposed default)
- Raw audio is processed transiently and not retained by default.
- Transcript, conversation history and feedback are not saved automatically.
- Before saving, explain exactly which fields will be stored and request an explicit user action.
- Allow users to delete saved sessions.
- Keep microphone permission distinct from consent to retain data.
- Apply authenticated ownership checks and RLS to all user-owned records.
- Define retention, deletion, export and provider data-processing terms before external release.

## 9. Navigation (proposed)
Keep navigation focused on user intent:
- **Conversar:** open conversation, custom prompt and recent context.
- **Modos:** discover and start communication-improvement modes and role-play templates.
- **Sesiones:** saved conversations/practices and feedback.
- **Cuenta:** profile, preferences, privacy and data controls.

The exact mobile navigation pattern is a design decision to validate in wireflow, not a pre-approved visual layout.

## 10. MVP boundaries
Include:
- Authentication and account basics.
- Open text conversation.
- Voice input with cloud transcription.
- AI responses and optional spoken output.
- Initial curated coaching modes.
- Custom prompt/context.
- Evidence-based feedback for selected practice modes.
- Explicit save/discard and session deletion.

Defer until validated:
- Full-duplex always-on voice if provider/browser support or cost makes it unsuitable.
- Background listening, wake-word behavior or passive recording.
- Voice cloning and custom voice identity.
- Public sharing, social feed, community and marketplace.
- Large course catalog, gamification and unsupported numerical grading.
- Advanced speaker diarization or emotion inference.

## 11. Success measures (product analytics, not decorative UI)
- First successful conversation completion.
- First successful voice turn completion.
- Completion rate and recoverable error rate by device/browser.
- Repeat usage of conversational and coaching modes.
- User-reported usefulness of feedback.
- Percentage of coaching observations linked to explicit evidence.
- Median time from end of user speech to visible response; track separately for transcription, model and speech synthesis.

## 12. Technical baseline and migration
Current published PWA is `preview/`; root frontend is legacy. Existing voice prototype depends on a local Termux bridge and must be removed from the production path.

Target logical pipeline:
Browser microphone → authenticated cloud voice endpoint → speech-to-text → conversation orchestrator → LLM → optional text-to-speech → browser playback.

Supabase is already connected and is the initial candidate for authentication, session metadata, RLS and Edge Functions. A dedicated backend/voice service may be preferable if Edge Function execution limits, streaming support, provider SDKs or latency require it. No provider or backend capability is assumed until tested.

Never place service-role keys or long-lived provider secrets in browser code. Add rate limits, quotas, request-size limits, abuse controls and cost visibility before public testing.

## 13. Open technical/product decisions
1. Choose speech-to-text, LLM and text-to-speech providers after a cost/latency/quality comparison.
2. Verify whether Supabase Edge Functions can safely broker the selected streaming/voice workflow; if not, choose a dedicated backend.
3. Decide whether first release uses push-to-talk turns or supports interruptible streaming conversation.
4. Define supported languages and voice-output options.
5. Approve retention, deletion and provider data handling.
6. Confirm first set of coaching modes and feedback rubric.
7. Define release audience, quotas and cost ceiling.

## 14. Ready-for-design rule
Before any interface design:
1. Product flow and screen responsibilities are documented.
2. Each mode has its objective, prompt structure, input/output behavior and feedback contract.
3. Loading, empty, error, permission and interruption states are mapped.
4. Wireflow is reviewed.
5. Visual exploration is performed in a design tool (Canva, Figma, MagicPath or another justified tool).
6. The selected direction is reviewed before implementation.

No direct redesign or code implementation of a new interface before this sequence is complete.
