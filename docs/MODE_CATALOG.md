# VOX — Initial Mode Catalog
**Version:** 0.1 — proposal for product validation  
**Date:** 2026-11-20

Modes are configurable behaviors on one shared conversation runtime. They are not independent chatbots. Each mode defines an objective, prompt template, interaction pattern, supported evidence and feedback contract. The user may add a custom prompt/context to any compatible mode.

| Mode | What it helps with | Example practice / interaction | Feedback evidence |
|---|---|---|---|
| Open conversation | Talk about any user-defined topic or context | User supplies a prompt, role or situation | Only when requested; grounded in conversation |
| Modulation & intonation | Vary pitch, emphasis and expressive delivery | Read or explain the same sentence with different intentions | Acoustic pitch/intonation measures only if validated |
| Pace, rhythm & pauses | Control speed, phrasing and silence | Explain a topic in 30–60 seconds with intentional pauses | Speaking rate and pause durations when measurable |
| Articulation & diction | Pronounce syllables and word endings clearly | Tongue twisters, minimal pairs, difficult phrases | Transcript/audio evidence; avoid unsupported phoneme claims |
| Pronunciation & vocalization | Improve intelligibility and word formation | Repeat phrases and explain a short idea | Language-specific ASR evidence and validated audio analysis |
| Clarity & structure | Organize ideas and explain them coherently | Explain a complex issue simply | Transcript structure, relevance and concision |
| Leadership & authority | Speak with calm authority, clarity and respect | Lead a meeting, set a boundary or give direction | Wording, structure, directness and role-play outcomes |
| Confidence in delivery | Communicate directly and reduce avoidable hesitation | Answer a difficult question without overexplaining | Transcript patterns; never diagnose internal confidence |
| Active listening | Understand, clarify and respond to another speaker | Summarize what the other person said before answering | Relevance and accuracy against conversation context |
| Improvisation | Build coherent answers under uncertainty | Respond to unexpected prompts with limited preparation | Relevance, structure and adaptability |
| Persuasion & argument | Make a reasoned case for an idea | Present a proposal and answer objections | Claim/evidence structure and audience relevance |
| Storytelling | Communicate through a clear narrative | Tell a short story with context, tension and conclusion | Narrative structure and clarity |
| Difficult conversations | Handle disagreement and objections constructively | Practice a conflict with a colleague/customer | Listening, clarity, boundaries and de-escalation |
| Interviews & presentations | Rehearse professional speaking situations | Interview Q&A, presentation opening and follow-up questions | Relevance, structure and completeness |
| Custom role-play | Practice any role or situation described by the user | "Act as a skeptical client..." | Configured per prompt and optional rubric |

## Initial release recommendation
Start with a small set that demonstrates both product pillars:
1. Open conversation with custom prompt/context.
2. Articulation & diction.
3. Modulation & intonation.
4. Clarity & structure.
5. Leadership & authority.
6. Custom role-play.

Pace/pauses can be included as part of the voice/delivery mode if measurement is reliable. Add more modes based on user demand and validation, not catalog size.

## Mode contract
Every mode must define:
- Stable ID, name, description and version.
- User objective and intended audience/context.
- System instruction template and allowed user customization.
- Suggested first prompt and interaction pattern.
- Input/output capabilities: text, voice input, spoken output.
- Whether it is conversation-only, practice-guided or role-play.
- What evidence can be observed and what cannot.
- Feedback rubric, examples and limitations.
- Exit, retry and save/discard behavior.

## Safety and evidence constraints
- A user prompt can set context and role but cannot override platform safety, privacy or system constraints.
- Never infer personality, mental health, honesty or true confidence from voice.
- Distinguish transcript-derived feedback from acoustic measurements.
- Do not display a score unless its rubric and reliability have been validated.
- If a provider cannot measure a vocal characteristic, do not pretend it can.
