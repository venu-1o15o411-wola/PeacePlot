# PeacePlot — Research notes & market landscape

Informal synthesis for **PeacePlot** planning, aligned with **`plan/plan.md`**. This is **not medical advice**, not an endorsement of any vendor, and not a substitute for legal or clinical review. Product names appear as **publicly documented examples** of patterns relevant to your scope (AI estimation, voice, libraries, community, wearables, location).

Companion: [`plan.md`](./plan.md) (IA, features, build phases).

---

## 1. How to use this document

- **§2–8** summarize **recent market and research directions** (roughly 2023–2026) that overlap PeacePlot’s pillars: **stress estimation**, **character/personalization**, **dataset libraries**, **Audio + voice AI**, **Relax Hub**, **Forum**, **trust content**, **wearables**, **location**.
- **§9** maps takeaways to **`plan.md`** explicitly.
- **§10** lists **risks, compliance, and moderation** pressures called out in research.

When building UI, **`design/`** (see `plan.md` §2) remains the visual reference; this file informs **behavior and positioning**, not pixels.

---

## 2. “Calm stack” apps — content libraries & habit (baseline)

Large meditation / sleep products (**Calm**, **Headspace**, **Insight Timer**) still define user expectations for **audio-first** UX, **sleep-friendly** defaults, and **huge** guided libraries.

**Recent direction (public updates, 2024–2025):**

- **Calm** expanded **Sleep Stories** and short **interactive** “tap” activities (e.g. summer 2024 blog: bite-sized grounding/gratitude-style interactions alongside passive listening).
- **Headspace** emphasizes **personalization** and **clinically informed** pathways; public-facing materials describe **assessment-informed** routing (e.g. validated screeners such as PHQ-9 / GAD-7–class tools in care contexts) toward **skills vs clinical services**—a pattern PeacePlot can echo at a **wellness** tier with **transparent** “what we measured.”
- **Insight Timer** has leaned into **AI-assisted recommendation** from a very large catalog (public blog: intention-setting and resolution flows with AI-suggested content from hundreds of thousands of tracks) and **professional-facing** hubs (e.g. therapist resource surfaces)—relevant if PeacePlot later surfaces **credentialed** content (`plan.md` §3.1, §5.4).

**Implications for PeacePlot**

- **Mixed media libraries** fail when every row looks the same: differentiate **books vs video vs audio vs movement** with duration, modality icons, and context (“2 min listen”, “15 min read”)—already aligned with your **Relax Hub** and **dataset-type gating** (`plan.md` §3.1, §4.3).
- **AI recommendation** is now a **table-stakes expectation** among heavy users of meditation apps; your differentiator is **stress estimation + character + explicit dataset preferences**, not “generic For You.”

---

## 3. AI chatbots & conversational CBT (estimation, chatbot, Forum)

**Wysa**, **Youper**, and similar products combine **mood check-ins**, **CBT-style** exercises, and **chatbot** delivery. Public positioning stresses **anonymity**, **crisis routing**, and **not replacing** human care.

**Patterns relevant to `plan.md`:**

- **Structured check-ins** + **conversation** as the “front end” for skills (maps to your **stress estimation** + **chatbot** in **Forum**).
- **Insights over time** from repeated interactions (maps to **Insight** tab and **character** summaries).
- **Wearable sync** appears in some products (e.g. Youper’s public materials mention **Apple Health / Fitbit**-class integrations)—relevant to your **smart watch** modality (`plan.md` §5.1, §7).

**Clinical / regulatory note:** **Woebot Health** has pursued **FDA Breakthrough Device Designation** for specific **prescription digital therapeutic** programs (e.g. postpartum-focused WB001, per public press and trial listings). That path is **not** required for a general wellness app, but it shows how **serious** AI + CBT products separate **marketing claims** from **evidence and oversight**.

**Implications for PeacePlot**

- **Crisis safety:** Any AI chat or forum-adjacent feature should assume **self-harm / crisis** protocols (escalation copy, hotlines, optional blocking)—industry baseline for mental-health-adjacent chat.
- **Transparency:** Users should see **what inputs** changed recommendations (check-in vs wearable vs questionnaire)—matches your **gating** step and **Insight** history (`plan.md` §3).

---

## 4. Voice-first mental wellness (Audio tab, voice AI agent)

Commercial and research directions show **voice** as viable for **coaching** and **skills**, with caveats on **privacy**, **robotic voice quality**, and **installation friction**.

**Examples / evidence:**

- **Ember Health** (App Store listing) markets a **voice-first AI coach** for anxiety, sleep, and daily stress with **real-time** conversation—illustrates user-facing positioning for **voice-primary** wellness (not an endorsement).
- Research prototypes such as **Lumen** (voice-only virtual coach for problem-solving treatment) report **high usability** with needs for **pacing** and **personalization**—useful when designing your **voice AI** turn-taking and fallbacks (`plan.md` §5.5).
- Studies on **Alexa-class** assistants for parenting support (e.g. 2024 feasibility work) highlight **trust**, **privacy**, and **voice quality** as adoption barriers—relevant to mic permission and **offline** disappointment handling.
- Comparative evaluations of **Siri / Alexa / Google Assistant** answers to mental-health queries (academic literature) find **uneven quality** by condition—motivation for **in-app** curated responses rather than delegating to the OS assistant.

**Implications for PeacePlot**

- Treat **voice AI** as **optional** alongside touch: clear **mic** consent, **visual** state for recording/listening, and **recovery** when ASR fails.
- **Audio** tab (`plan.md` §4.2) is the natural **home** for voice sessions; **deep links** from **Home** / **Forum** avoid hiding voice behind multiple taps.

---

## 5. Mood tracking, CBT journeys, gamification (Insight, character, Relax Hub)

**Sanvello** historically exemplified **mood tracking**, **guided journeys**, **journaling**, and **community boards**; public reviews note transitions under **AbleTo** branding for some offerings—illustrates **M&A** and **payer** paths, not a feature template.

**Happify**-style products use **tracks**, **short games**, and **AI coach** characters (e.g. public reviews name guided coach experiences) to sustain engagement—parallel to your **character analysis** + **activities** mix, without requiring gamification unless you want it.

**Finch** (self-care pet) shows how **low-friction mood check-ins** + **rewards** drive retention for stress-prone users; large user numbers in store listings suggest **non-clinical** framing works when **kind** and **predictable**.

**Implications for PeacePlot**

- **Character / personality** outputs should avoid **overfitting labels** (“you are X type”) unless you want that UX; trend is **soft** profiles used for **routing** content.
- **Insight** should prioritize **clarity** over charts-for-charts’-sake: stressed users abandon dense dashboards.

---

## 6. Wearables & biometric “stress” (smartwatch modality)

Apple Watch–adjacent stress apps (**StressWatch**, **RelaxWatch**, **Stressly**, **StressPal**, etc.—per store listings and marketing pages) commonly combine:

- **HRV / RHR**-derived **stress scores**
- **Trends** (hourly / daily / weekly)
- **Alerts** when stress rises
- **Breathing** or **micro-interventions**

**Implications for PeacePlot**

- If you ingest **HealthKit / Health Connect** data, align UI with **sensor confidence**: avoid presenting **biometric stress** and **self-report stress** as the same number unless the model merges them with **explicit** explanation.
- **Battery and privacy:** continuous background access triggers stricter **App Store** scrutiny; document **why** you need each permission (`plan.md` §5.1).

---

## 7. Location & “places” (Relax Hub, Home)

Dedicated **nature / walking** apps (**Wildling**, **Go Jauntly**, **Rewyld**, **NatureDose**, etc.) demonstrate **permission-gated** discovery of **green space**, **walks**, and **time-in-nature** goals—close to your **location-based famous places** idea (`plan.md` §3.1, §4.3).

**Implications for PeacePlot**

- **Curate** place suggestions (safety, accessibility, hours) rather than raw POI dumps; **country/locality** scoping matches how travel and nature apps filter content.
- **Map + calm UX** is hard: prefer **list + detail** patterns from **`design/`** before heavy map chrome.

---

## 8. Community, forums, articles, moderation (Forum tab)

Peer support products historically combine **discussion boards**, **groups**, and **guided content**. Academic work (2025–2026, **JMIR** family) stresses:

- **Moderator** well-being and **training**
- **Safety** vs openness tradeoffs
- **Clear community guidelines** and **reporting**

**Implications for PeacePlot**

- **Tree comments + likes only** (`plan.md` §4.3) is a **simpler** moderation surface than full reactions—good for v1.
- **User search by email / userid** increases **harassment and stalking** risk; industry norm is **opt-in discoverability**, **blocking**, and **rate limits**—plan policy before shipping.

---

## 9. Mapping research → `plan.md` (quick matrix)

| `plan.md` topic | What market/research suggests |
|-----------------|-------------------------------|
| **§4.2 Five tabs** | Splitting **library** (Relax Hub), **social** (Forum), **trends** (Insight), and **audio/voice** (Audio) matches how large apps **separate** concerns to reduce overload. |
| **§3.1 Dataset gating before recommendations** | Aligns with **preference elicitation** before **AI for You** flows (Insight Timer–style intention flows; streaming “taste picker” metaphors). |
| **§5.5 Voice AI agent** | Voice wellness products and studies emphasize **trust**, **fallbacks**, and **privacy**; **Audio** tab as hub matches **voice-first** apps’ entry points. |
| **§5.1 Multi-modal estimation** | Wearable stress apps show **HRV** UX norms; **camera / fingerprint** need **consent** clarity distinct from **questionnaires**. |
| **§5.3 Communities** | Moderation research supports **phased** community rollout and **investment** in moderator tooling if UGC scales. |
| **§5.4 Trust / doctors’ content** | Headspace / Insight Timer show **professional** and **teacher** brands as trust anchors; your **famous doctors** lane should **cite credentials** and avoid **implied endorsement**. |

---

## 10. Risks, compliance, and product hygiene

- **Medical claims:** Wellness framing (“support,” “skills,” “self-help”) vs **treatment** claims—especially with **AI** and **biometrics**.
- **Crisis handling:** Chatbot + forum require **escalation** paths; copy should be **tested** with clinical advisors if scope grows.
- **Data minimization:** Voice audio, **face** video, **location**, and **email discoverability** are **high-sensitivity** combos—align **retention**, **deletion**, and **consent** with your backend design (`plan.md` §6).
- **Accessibility:** **Dynamic type**, **VoiceOver** / TalkBack for **voice states**, **contrast** on dark blue surfaces (`plan.md` §2.2)—non-negotiable for stress apps if you want broad adoption.
- **Notification fatigue:** Calm-class apps succeed partly by **respecting sleep**; default **quiet** notifications unless users opt into nudges.

---

## 11. Suggested follow-up (technical / policy)

- Apple **Human Interface Guidelines** and Google **Material** guidance for **health**, **microphone**, **camera**, **location**, and **Health Connect / HealthKit** disclosure screens.
- **OWASP** / platform guidance for **chat** abuse and **PII** in search (email lookup).
- **FDA / MHRA / EU MDR** boundaries if you ever ship **regulated** digital therapeutics—likely **out of scope** until explicitly chosen (`plan.md` §8).

---

## 12. Prior research retained (UX fundamentals)

These points remain valid regardless of competitor churn:

- **Emotional tone first** — Stressed users need **approachability** and **safety**, not dense dashboards.
- **Fewer decisions per session** — Primary actions (check-in, play, breathe) stay **shallow**; secondary features one level down.
- **Audio-first affordances** — Large controls, clear play/pause, **thumb-zone** layouts (`plan.md` **Audio** tab).
- **Loading / error copy** — Avoid generic “Something went wrong”; prefer **short**, **actionable** lines that do not **increase** anxiety.
- **Fingerprint** — Often fits **auth** or **settings** better than primary navigation unless product intent is **biometric check-in** (`plan.md` §5.1).

---

_Last updated: 2026-04-11_
