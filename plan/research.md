# SerenityAI — Research notes & design thoughts

Informal synthesis for **SerenityAI** planning. This is not medical advice and not a competitive teardown of any single product. Use it alongside **`plan/plan.md`** and the owner’s own designs.

---

## 1. What “successful” calm apps optimize for

Products in the mindfulness / sleep / stress space (e.g. patterns associated with Headspace, Calm, Insight Timer–class experiences) tend to converge on a few goals:

- **Emotional tone first** — Color, motion, and copy are tuned so the app does not feel like a generic utility. The objective is *approachability* and *safety*, not maximal information density.
- **Fewer decisions per session** — Stressed users have reduced bandwidth. Primary actions (play, breathe, short check-in) are easy to find; secondary features sit one level deeper.
- **Audio-first affordances** — Large controls, clear play/pause, and forgiving layouts for one-handed use (especially near the bottom of the screen on phones).

**Implication for SerenityAI:** Your custom visual language should lead; these patterns fill gaps where the design is silent (e.g. minimum tap size, loading states that do not spike anxiety).

---

## 2. Bottom navigation and the voice button

Industry habit: the **bottom bar** carries the most-used destinations; the **center** or a **floating** primary action is often used for the “main” behavior (create, play, check-in).

For **voice recording** as the flagship capture:

- Treat it as a **primary action** visually (size, contrast, optional subtle animation on idle—not noisy).
- Keep **state** obvious: idle vs recording vs paused vs saved vs error (mic permission denied is common; copy should be kind and actionable).
- **Future slots** (video, text prompt, fingerprint): plan the bar so adding an overflow, long-press menu, or adjacent icon does not require redesigning the whole shell. A common pattern is a **dominant center control** with **secondary actions** in the same “capture” family.

**Thought:** Fingerprint later is less about “navigation” and more about **unlock or quick check-in**—it may live in auth/settings rather than the tab bar unless your design says otherwise.

---

## 3. Stress estimation → recommendations

The loop “measure → personalize → recommend” matches how users *expect* wellness apps to behave, as long as:

- **Transparency** — Users understand *what* was measured (self-report vs sensor later) and *why* suggestions changed.
- **No false precision** — Avoid implying clinical diagnosis from a short questionnaire unless you have regulated claims and evidence workflows.

**Content mix** (video, book, image, audio, exercise) is strong if the UI makes **type** obvious at a glance (icons, duration, context: “2 min listen” vs “15 min read”). Mixed libraries fail when everything looks like the same list row.

---

## 4. Forums vs curated recommendations

“Forum” can mean **community discussion** or **a browsable library** or both.

- **Community** increases engagement but needs moderation, reporting, and clear community guidelines—especially for mental-health-adjacent topics.
- **Curated recommendations** after assessment can stay **editorial** at first (no user-generated threads), which is simpler to ship safely.

**Thought:** Ship **recommendations + structured content** first; add **true forum threads** when moderation scope is defined. The plan file can be updated when that decision is final.

---

## 5. Auth and profile

Trust is disproportionately earned on **first launch** and **account screens**.

- **Auth:** Clear value (“why sign up”), minimal fields up front, visible privacy posture (what you store, especially for voice).
- **Profile:** History of check-ins and saved items should feel **private and calm**—avoid clutter; use progressive disclosure for advanced settings.

---

## 6. Risks to watch

- **Ambiguous loading/error copy** — Generic spinners or “Something went wrong” can *increase* stress in a stress app. Prefer short, human lines and recovery steps.
- **Over-notification** — Defaults should respect sleep and boundaries unless the user opts in loudly.
- **Medical positioning** — Unless you have clinical/regulatory scope, frame the product as **wellness / self-help**, not treatment.

---

## 7. How this maps to SerenityAI

| Direction | Research takeaway |
|-----------|-------------------|
| Owner-led visual design | Industry patterns are defaults, not a second brand. |
| Voice in bottom nav | Aligns with audio-first, thumb-zone best practice; treat as primary. |
| Stress estimation | Frame as supportive check-in; pair with clear recommendations. |
| Forums + rich media | Differentiate content types in UI; sequence community vs curated deliberately. |
| Auth / profile | Invest in polish and trust; voice data demands clear consent UX. |

---

## 8. Suggested follow-up research (optional)

- Platform **Human Interface Guidelines** for health-adjacent and microphone permission flows (Apple/Google).
- Accessibility: **Dynamic type**, **VoiceOver** labels for recording states, **color contrast** for stress states (if color encodes intensity).

---

*Last updated: 2026-04-10*
