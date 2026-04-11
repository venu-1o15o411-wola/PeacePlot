# SerenityAI — Product & build plan

This document is the **project-level plan** for the SerenityAI healthcare app (stress reduction). **Implementation work should follow this plan and the owner’s design files.** Detailed UI implementation waits until design assets are locked and the owner approves starting build tasks.

Companion document: [`research.md`](./research.md) (industry notes and design rationale).

---

## 1. Vision

Help users **understand and reduce stress** through assessment, personalized recommendations, and multimodal content—delivered in a **calm, trustworthy** mobile-first experience. Visual and interaction design follows **the owner’s provided designs**; industry patterns from leading wellness apps inform defaults only where the design does not specify otherwise.

---

## 2. Design source of truth

- **Primary:** Owner-supplied designs (style, layout, components).
- **Secondary:** Best-practice patterns from established calm/mindfulness apps (e.g. soft hierarchy, low decision fatigue, audio-friendly controls, accessible touch targets)—**without** copying proprietary branding.

---

## 3. Core user loop

1. User completes a **stress estimation** flow (exact mechanics per design).
2. App surfaces **recommendations** aligned to that result.
3. User can engage with content, return later, and see **profile** history/preferences as specified.

---

## 4. Scope (features)

### 4.1 Stress estimation

- Dedicated flow/screen(s) for assessing stress level.
- **Terminology note:** Requirements referenced a “stressful” page—interpret as **stress assessment / check-in** (user reflects on or reports stress) unless the owner specifies a different intent. The UI should remain appropriate for a healthcare-adjacent, calming product.

### 4.2 Capture & input (phased)

| Phase | Capability | Notes |
|--------|------------|--------|
| **Now (design + build)** | **Voice recording** | Primary capture. **Professional voice affordance** in the **bottom mobile navigation bar** (prominent, thumb-friendly). |
| **Later** | Video recording | Reserve navigation/IA so it can be added without a full rework. |
| **Later** | Text prompt / journaling | Same as above. |
| **Later** | Biometric / fingerprint | Same as above; align with platform APIs and privacy policy when implemented. |

### 4.3 Profile

- Profile area for account, preferences, history (stress check-ins, saved items)—**exact fields per design**.

### 4.4 Authentication

- **High-quality auth experience** (sign-up, sign-in, recovery as needed): clear trust, accessibility, and visual polish per **owner designs** (not generic placeholders).

### 4.5 Forums & recommendations

- **Forums** (or community/content area) that can surface **multiple content types** as data sources for stress reduction, for example:

  - Video  
  - Books  
  - Images  
  - Audio  
  - Exercise / movement  

- **Post–assessment:** After stress estimation, show **recommendations** drawn from these categories (rules and ranking: product/design decision; can evolve).

---

## 5. Technical context (repository)

- **Stack:** Expo (~55), React Native, **expo-router** for navigation.
- **Platforms:** iOS, Android, Web (per Expo config).
- New screens and tabs should stay consistent with existing app structure (`app/` routes, shared components).

---

## 6. Build phases (suggested)

1. **Design lock** — Finalize flows and visual specs from owner designs.  
2. **Shell & navigation** — Routes, bottom bar (including **voice** slot), safe areas, theming.  
3. **Auth** — Screens and flows per design.  
4. **Stress estimation** — Flow + persistence strategy as agreed.  
5. **Recommendations & forums/content** — Lists/detail patterns per content type.  
6. **Profile** — Account and history.  
7. **Voice** — Recording UX in navbar + recording screen/modal per design; native permissions and error states.  
8. **Polish** — Accessibility, loading/empty states, performance.

Later phases add video, text prompt, and fingerprint without redoing the shell if IA is respected up front.

---

## 7. Out of scope until explicitly scheduled

- Backend choice, analytics, and medical claims (unless added to this plan).  
- Full forum moderation tooling (unless specified).  
- Features listed as **Later** in §4.2 until approved.

---

## 8. Change control

Updates to scope or phases should be recorded **in this file** (dated notes or version history) so the repo stays the single plan reference.

---

*Last updated: 2026-04-10*
