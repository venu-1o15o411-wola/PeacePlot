# PeacePlot Full Project Report

## Scope of this report

This report summarizes the current state of the PeacePlot app after a full repository-level analysis:

- architecture and major modules
- implemented user flows
- backend/data model status
- Discover and music pipeline status
- risks, gaps, and production readiness
- prioritized action plan

---

## 1) Product summary

PeacePlot is an AI-assisted wellness app with a React Native/Expo client and Supabase backend.  
Its intended core value is personalized stress support through:

- check-in and estimation flows
- adaptive recommendations (Discover)
- in-app content playback
- longitudinal user memory and feedback loops

Current state is strong in core scaffolding and backend orchestration, but still mixed between production-ready modules and staged/placeholder surfaces.

---

## 2) System architecture

### Frontend

- Expo Router app with drawer + tabs navigation.
- Theme/appearance provider + auth/session provider at app shell level.
- Main tabs: Home, Discover, Measure, Virtual Doctor, Profile.

Key files:

- `src/app/_layout.tsx`
- `src/app/(drawer)/_layout.tsx`
- `src/app/(drawer)/(tabs)/_layout.tsx`
- `src/providers/auth-session.tsx`

### Backend

- Supabase Edge Functions (Deno) for:
  - AI check-in flow (`checkin-chat`)
  - Discover feed orchestration (`discover-feed`)

Key files:

- `supabase/functions/checkin-chat/index.ts`
- `supabase/functions/discover-feed/index.ts`

### Database

- Postgres migrations define auth/profile, check-in, analysis, user memory, discover feedback, and cache tables.

Key files:

- `supabase/migrations/20260411120000_auth_profiles.sql`
- `supabase/migrations/20260417120000_checkin_question_estimation.sql`
- `supabase/migrations/20260420110000_discover_content_foundation.sql`
- `supabase/migrations/20260420120000_discover_cache_layers.sql`

---

## 3) Core feature status

### 3.1 Authentication and session

Status: **implemented and functional**

- Email/password sign in/up integrated with Supabase.
- Session bootstrap and listener logic exists in provider.
- Auth guard behavior is present.

Key files:

- `src/providers/auth-session.tsx`
- `src/lib/supabase.ts`
- `src/app/signin.tsx`
- `src/app/signup.tsx`

Notes:

- OAuth providers appear as UI placeholders, not fully wired.

### 3.2 Estimation and check-in

Status: **partially production, partially staged**

- Question-based check-in is end-to-end with backend persistence.
- Visual/fingerprint flows have substantial native implementation.
- Audio estimation currently still includes mock-style logic path.

Key files:

- `src/components/estimate/questions-measure-flow.tsx`
- `src/lib/checkin-chat.ts`
- `src/components/estimate/visual-measure-flow.tsx`
- `src/components/estimate/finger-measure-flow.native.tsx`
- `src/components/estimate/audio-measure-flow.tsx`
- `src/lib/mock-voice-estimation.ts`

### 3.3 Discover

Status: **feature-rich but operationally unstable in provider-dependent music path**

Implemented:

- chips, search, featured rail, library list
- item detail screen and media rendering
- infinite scroll behavior and feedback actions

Key files:

- `src/components/discover/discover-library.tsx`
- `src/app/(drawer)/(tabs)/discover/item/[id].tsx`
- `src/lib/discover-feed.ts`
- `supabase/functions/discover-feed/index.ts`

Observed issue trend:

- Music provider results can drop to zero in runtime despite fallback logic changes, causing empty/seed-only outcomes.

---

## 4) Data model overview

### Identity/Profile

- `profiles` table with user identity linkage.
- availability checks and trigger-driven profile creation.

### Check-in and memory

- `checkin_sessions`, `checkin_messages`, `checkin_analysis`
- `user_memory`, `memory_observations`
- `recommendation_feedback`

### Discover

- `discover_daily_featured`
- `discover_user_feedback`
- cache-layer tables exist:
  - `discover_raw_cache`
  - `discover_catalog_cache`
  - `discover_query_cache`

Important current mismatch:

- cache schema exists, but discover function behavior is mostly live-fetch oriented and does not fully exploit cache-layer architecture.

---

## 5) Integrations and provider status

### In active use

- Supabase Auth/DB/Functions
- Gemini usage in check-in function
- external content providers in Discover path

### Provider stability findings

- Music source strategy has changed multiple times (FMA/Openverse/Pixabay/Jamendo paths).
- Current runtime responses show provider music can still return zero in deployed environment.
- This indicates unresolved provider contract/data-shape/filter interaction in live edge execution.

Operational implication:

- direct runtime provider dependency for music remains high-risk for user-facing reliability.

---

## 6) Quality and delivery maturity

### Strengths

- Good modular file structure.
- Clear separation of frontend and backend responsibilities.
- Robust migration history and evolving schema.
- Strong velocity on iterative feature development.

### Gaps

- No comprehensive automated test suite detected.
- No strong CI signal on function contract stability.
- README/runbook/documentation still underdeveloped for team operations.
- Discover music path lacks deterministic reliability under live provider variability.

---

## 7) Current critical risk list

1. **Discover music reliability risk**
   - provider fetch returns zero in live runtime.
2. **Provider dependency risk**
   - runtime user experience coupled to external APIs.
3. **Cache architecture underutilized**
   - lower resilience than intended plan.
4. **Mock/partial flows mixed with production UX**
   - possible expectation mismatch for users.
5. **Testing/observability gap**
   - difficult root-cause resolution without stable diagnostics.

---

## 8) Recommended priority roadmap

### Priority 1 (Immediate)

- Stabilize music retrieval by moving to ingestion-and-serve model:
  - ingest provider tracks offline
  - filter/normalize/store in DB
  - serve Discover music from curated DB rows
- Add explicit provider debug telemetry in API response/logs:
  - HTTP status per provider
  - result counts before/after each filter stage

### Priority 2 (Short-term)

- Activate real cache-layer strategy for Discover (`raw/catalog/query`).
- Add contract tests for `discover-feed` and `checkin-chat`.
- Add smoke tests for paging (`15 first, +15 on next page`) per category.

### Priority 3 (Mid-term)

- Replace remaining mock estimation parts with real backend inference pipeline.
- Complete placeholder modules (Virtual Doctor/Profile/Journal/Notifications) into data-backed flows.
- Improve operational docs and deployment runbook.

---

## 9) Production readiness rating (current)

- Architecture: **Good**
- Core auth/session: **Good**
- Check-in core: **Moderate to Good**
- Discover general flow: **Moderate**
- Discover music reliability: **Needs stabilization**
- Testing/observability: **Needs improvement**

Overall: **Promising and substantial codebase, not yet fully production-hardened end-to-end.**

---

## 10) Final assessment

PeacePlot already has a meaningful foundation with real backend logic, personalization structure, and a strong product direction.  
The key blocker to “smooth production behavior” is not architecture quality, but reliability hardening in provider-dependent paths (especially Discover music) plus test/observability maturity.

If the team executes the priority roadmap above, PeacePlot can transition from iterative build mode to stable production mode quickly.

