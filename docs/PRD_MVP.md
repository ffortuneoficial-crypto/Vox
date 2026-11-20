# VOX — MVP Product Requirements Document
**Version:** 0.1 — working draft  
**Date:** 2026-11-20  
**Status:** Product baseline proposed; validate with owner before visual design.

## 1. Product statement
VOX helps people improve spoken communication by letting them practice realistic situations, receive direct feedback grounded in their words, and repeat with a clear improvement target.

## 2. Initial user and job to be done
**Proposed first segment:** people who need to communicate clearly and confidently in work conversations (customer support, interviews, team discussions, explaining a problem, handling objections).

**Job to be done:** When I have an important conversation or want to improve how I speak, help me rehearse safely, notice one concrete weakness and practice again with useful feedback.

This segment is deliberately narrow enough to design a coherent first release but broad enough not to lock VOX into a single employer or industry.

## 3. MVP problem statement
Current alternatives often provide generic speaking tips, passive transcription, or open-ended AI chat. They do not reliably connect a user's goal to a structured practice, observable feedback and a next action.

## 4. Value proposition
A practical communication coach that turns a short practice into one clear learning loop:
**Goal → Practice → Evidence → Feedback → Retry / Next practice.**

## 5. MVP goals
- Help a new user complete a first guided practice without needing to configure technical tools.
- Make voice practice understandable and controllable, with text fallback.
- Give specific feedback grounded in transcript evidence.
- Let users deliberately save or discard a session.
- Make the next practice relevant to the user's goal and prior saved practice.

## 6. Non-goals
- No fake scores, XP, streaks, levels, rankings or badges.
- No generic content library or large course catalog.
- No social feed, multiplayer or creator marketplace.
- No emotion/personality diagnosis from voice.
- No claims of measuring confidence, leadership, charisma or vocal health without validated measures.
- No production reliance on a personal Termux server.
- No full-duplex real-time voice in the first MVP.

## 7. Core experience and functional requirements

### FR-01 — Account access
The user can create an account, sign in, sign out and recover from an expired session. The app must not reveal private session data before authentication.

### FR-02 — Goal selection
The user chooses one primary goal:
- Clarity: organize and explain ideas.
- Confidence: speak directly and reduce verbal hesitation.
- Calm authority: communicate firmly without aggression.
- Listening and response: understand, clarify and answer.
- Interview and professional conversations: structure responses in work contexts.

Only one goal is required to start; changing it later must not erase history.

### FR-03 — First practice recommendation
After goal selection, VOX presents one recommended exercise with a clear purpose, expected time, scenario and success criteria. No empty module catalog.

### FR-04 — Session setup
Before starting, show:
- What will be practiced.
- The role/context if it is a simulation.
- The user's objective.
- What VOX can evaluate (content/transcript) and what it cannot evaluate.
- Voice or text input choice.

### FR-05 — Session runtime
The session supports text and push-to-talk voice in the prototype. Voice states must be visible: idle, permission request, recording, transcribing, generating, speaking, recoverable error and finished. The user can stop recording and end the session.

### FR-06 — Conversation behavior
VOX acts as a coach/interlocutor, not a static questionnaire. It keeps context during the current session, asks relevant follow-up questions and adapts to the chosen objective. It must not claim to hear vocal qualities that the current pipeline does not measure.

### FR-07 — Feedback
At completion, VOX gives:
- One or two observed strengths with transcript examples.
- One priority improvement with a specific example.
- One concrete technique to retry.
- A clear limitation note when evidence is insufficient.

No numeric score in the first MVP. A future score requires a defined rubric, repeatability and confidence calibration.

### FR-08 — Save or discard
The user chooses whether to save the session. The default is not to retain raw audio. Transcript retention must be explicit and explained. A discarded session must not appear in history.

### FR-09 — Session history
Only saved sessions appear. The user can open and delete a saved session. A session without a completed feedback report must not pretend to have one.

### FR-10 — Account and privacy
The user can sign out and find clear information about microphone permissions, retained data and deletion. Account deletion/export may initially be handled through a clearly documented request path if self-service flows are not yet implemented.

## 8. Content and exercise model
Every exercise definition must include:
- id, title, skill/goal, difficulty, estimated duration
- context and role (if simulation)
- user objective
- coach instructions
- success criteria
- feedback rubric
- supported input modes
- limitations

Initial exercise set should be small: one clarity exercise, one calm-authority exercise and one work-conversation simulation. Content quality matters more than quantity.

## 9. Data and privacy requirements
**Recommended default:**
- Raw audio: process for transcription/conversation and discard after processing; never persist by default.
- Transcript: do not save automatically. Ask before saving a session that contains transcript text.
- Feedback: save only with the user's explicit save action and make it deletable.
- Session metadata: store the minimum needed for history and continuity.
- Consent: distinguish microphone permission from consent to retain data.
- Isolation: all user-owned database records protected by RLS using ownership checks.
- Provider secrets: never expose service-role or private model keys in browser code.

Before database implementation, decide retention duration, transcript deletion behavior, and whether reports can exist without transcripts.

## 10. UX acceptance criteria
- Every visible control has a defined action, destination and result.
- No dashboard section exists solely as a visual placeholder.
- Each screen has loading, empty, error and permission-denied states where relevant.
- Voice and text are both usable paths.
- A user can complete the main loop in a short session without dead ends.
- Mobile-first layout works on Android Chrome with one-handed controls.
- The app clearly distinguishes practice completion from saved history.

## 11. Product success measures (initial hypotheses)
These are product metrics to validate, not UI counters:
- Activation: percentage of new accounts that complete one guided practice.
- Completion: percentage of started practices that reach feedback.
- Repeat practice: percentage of users who complete a second practice within seven days.
- Perceived usefulness: short post-session user rating plus qualitative feedback.
- Reliability: voice-session completion/error rate by device and engine state.
Do not display these as user-facing progress until definitions and collection are implemented.

## 12. Technical constraints
- Current published app is a static PWA deployed from preview/.
- Current voice adapter depends on a local Termux bridge, local Whisper and OmniRoute.
- This local path is for personal prototyping only.
- Supabase project currently has one table, vox_sessions, and private bucket vox-audio; published frontend does not use them for session persistence.
- No Edge Functions are deployed.
- A public multi-user product requires an authenticated backend/voice service and rate limiting before general release.

## 13. Open decisions before design
1. Confirm or adjust the initial user segment.
2. Confirm which three initial exercises/scenarios should ship.
3. Confirm transcript retention: never save, explicit save only, or save text-only by default.
4. Decide whether MVP is initially personal/local for the owner or intended for external testers from day one.
5. Decide how voice availability should be communicated when the Termux engine is offline.

## 14. Definition of ready for UX
The PRD is ready for wireframes when goals, exercise set, retention policy, target test group and success measures are agreed. The visual design phase remains blocked until then.
