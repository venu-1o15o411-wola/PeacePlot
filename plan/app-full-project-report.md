# PeacePlot Full Requirements & Implementation Specification

## Document purpose

This document defines the **full project requirements** for PeacePlot and records the **current implementation status** across architecture, product structure, features, UX style, backend, and data model.

It is intended to be the broad project-level reference for:

- what the app is designed to do
- how the system is structured
- what has already been implemented
- what remains to complete

---

## 1) Product vision and target experience

PeacePlot is a wellness-focused AI application that supports users through stress-awareness and personalized relief experiences.  
The product is designed to feel like a daily companion rather than a one-time tool.

### Core value objectives

1. Help users estimate stress through multiple modalities (question/audio/visual/finger).
2. Convert estimation insights into personalized next steps (content, advice, routines).
3. Provide a rich Discover system that surfaces calming and useful media in-app.
4. Keep user interactions secure, private, and smooth across mobile experiences.
5. Build toward an AI-supported virtual care flow (human-feeling conversations and guidance).

---

## 2) System architecture requirements

### 2.1 Frontend architecture

Required:

- Expo/React Native app using route groups with drawer + tabs.
- App-wide providers for theme/appearance and auth session.
- In-app media rendering for discover items (video/audio/image/book).

Current implementation:

- Implemented with `expo-router` layouts and provider composition.
- Tab/drawer shell is active.
- Media detail screen and modal viewer exist.

Key files:

- `src/app/_layout.tsx`
- `src/app/(drawer)/_layout.tsx`
- `src/app/(drawer)/(tabs)/_layout.tsx`
- `src/providers/auth-session.tsx`
- `src/app/(drawer)/(tabs)/discover/item/[id].tsx`

### 2.2 Backend architecture

Required:

- Supabase Edge Functions as controlled backend gateway for AI and provider APIs.
- No direct external provider key use from frontend.
- Personalized ranking and retrieval handled server-side.

Current implementation:

- `checkin-chat` and `discover-feed` edge functions implemented.
- Provider requests and normalization logic are backend-side.

Key files:

- `supabase/functions/checkin-chat/index.ts`
- `supabase/functions/discover-feed/index.ts`

### 2.3 Data architecture

Required:

- Profile/auth linkage.
- Check-in session, messages, analysis, memory, and feedback persistence.
- Discover featured/feed and user-feedback persistence.
- Optional cache layers for raw provider payloads and query outputs.

Current implementation:

- Core tables and policies created via migrations.
- Discover cache tables exist in schema.

Key files:

- `supabase/migrations/20260411120000_auth_profiles.sql`
- `supabase/migrations/20260417120000_checkin_question_estimation.sql`
- `supabase/migrations/20260420110000_discover_content_foundation.sql`
- `supabase/migrations/20260420120000_discover_cache_layers.sql`

---

## 3) Product structure and navigation requirements

### Required app sections

- Home
- Discover
- Measure
- Virtual Doctor
- Profile
- Drawer-level secondary pages (journal, notifications, etc.)

Current implementation:

- Core tab and drawer pages exist.
- Some sections are full-featured; others remain scaffold/placeholder-heavy.

Key files:

- `src/app/(drawer)/(tabs)/index.tsx`
- `src/app/(drawer)/(tabs)/discover/index.tsx`
- `src/app/(drawer)/(tabs)/measure.tsx`
- `src/app/(drawer)/(tabs)/virtual-doctor.tsx`
- `src/app/(drawer)/(tabs)/profile.tsx`
- `src/app/(drawer)/journal.tsx`
- `src/app/(drawer)/notifications.tsx`

---

## 4) Full feature requirements and current implementation status

## 4.1 Authentication and account

Requirements:

- email/password sign up and sign in
- persistent session
- guarded navigation for unauthenticated users
- password reset flow

Current status:

- Implemented and functional through Supabase.
- Session provider controls auth lifecycle.

Key files:

- `src/providers/auth-session.tsx`
- `src/lib/supabase.ts`
- `src/app/signin.tsx`
- `src/app/signup.tsx`

## 4.2 Estimation flows

Requirements:

- question-based estimation
- audio-based estimation
- visual/camera estimation
- finger/camera estimation
- result view and transition into recommendations

Current status:

- Question estimation is integrated end-to-end with backend.
- Visual and finger flows have substantial native logic.
- Audio path includes mock-scoring behavior in current state.
- Result screen flow exists.

Key files:

- `src/components/estimate/questions-measure-flow.tsx`
- `src/components/estimate/audio-measure-flow.tsx`
- `src/components/estimate/visual-measure-flow.tsx`
- `src/components/estimate/finger-measure-flow.native.tsx`
- `src/lib/mock-voice-estimation.ts`
- `src/app/estimate/result.tsx`

## 4.3 Discover system

Requirements:

- featured slider with mixed content
- category chips with server retrieval
- at least 15 items on first category page
- infinite scroll for additional pages
- search/filter behavior
- no duplicates across pages
- personalized ordering where signals exist
- item detail playback in-app

Current status:

- Full UI/UX framework implemented (chips, featured, list, detail, actions).
- Edge-function feed orchestration and personalization scoring implemented.
- Pagination logic and dedupe logic implemented.
- Active music-provider iteration ongoing.

Key files:

- `src/components/discover/discover-library.tsx`
- `src/lib/discover-feed.ts`
- `src/app/(drawer)/(tabs)/discover/item/[id].tsx`
- `supabase/functions/discover-feed/index.ts`
- `plan/discover-plan.md`

## 4.4 AI conversational support

Requirements:

- conversational check-in
- high-quality but efficient AI responses
- storing useful session outcomes into user memory signals

Current status:

- AI chat edge function implemented with analysis persistence path.
- Personalization signal integration exists for Discover weighting.

Key files:

- `supabase/functions/checkin-chat/index.ts`
- `supabase/migrations/20260417120000_checkin_question_estimation.sql`

## 4.5 Feedback loop and personalization

Requirements:

- capture user reaction signals (`save`, `hide`, `not_for_me`, `complete`, etc.)
- use feedback to adjust recommendations over time

Current status:

- Discover feedback write path implemented.
- Hidden/suppressed local behavior and UI controls present.

Key files:

- `src/lib/discover-feed.ts`
- `src/components/discover/discover-library.tsx`
- `supabase/functions/discover-feed/index.ts`

---

## 5) UX, visual style, and interaction requirements

### 5.1 UX principles

- calm, low-cognitive-load presentation
- clear category controls and quick content scanning
- in-app media experience (avoid external app jumps)
- meaningful loading/empty/error states
- resilient behavior during provider/API instability

### 5.2 Current style implementation

- consistent card/list/chip patterns implemented in Discover
- custom audio player UI exists for music modal playback
- source/type tags and control elements are present
- app shell visual identity and tab structure are established

Key files:

- `src/components/discover/discover-library.tsx`
- `src/app/(drawer)/(tabs)/discover/item/[id].tsx`
- `src/theme/peaceplot-theme.ts`

---

## 6) Integrations and provider requirements

### Required integration model

- backend-mediated provider access only
- strict filtering/normalization before user-facing response
- deterministic fallback path when provider returns empty

### Current integration set

- Supabase (Auth/DB/Functions)
- Gemini (check-in)
- content providers in Discover pipeline (images/videos/books/music sources)

Relevant documents and files:

- `supabase/functions/discover-feed/index.ts`
- `plan/discover-plan.md`
- `plan/fma-usage-master.md`
- `plan/pixabay-music-usage-master.md`

---

## 7) Data model requirements (functional)

### Identity + profile

- one profile per auth user
- unique user id fields
- own-row access policies

### Estimation + memory

- check-in sessions/messages
- analysis snapshots
- memory observations
- feedback tracking

### Discover

- daily featured persistence
- user feedback persistence
- optional provider/query cache layers

Current status:

- all above domains have migration-level schema foundations.

---

## 8) Operational and engineering requirements

### Required engineering standards

- environment-based secret handling
- no provider key exposure in client
- structured error handling and fallback behavior
- deploy-safe edge function updates
- iterative observability improvements for provider failures

### Current status

- secret handling architecture is in place.
- major functions are modularized and maintainable.
- automated test and CI depth still limited and should be expanded.

---

## 9) What is implemented now (consolidated)

Implemented now across the project:

1. Auth/session base is active and functional.
2. Main navigation architecture is active (drawer + tabs).
3. Check-in + analysis backend is implemented.
4. Measure screens exist for question/audio/visual/finger (mixed real + staged depth).
5. Discover UI and API integration are comprehensive and actively iterated.
6. Discover feedback capture and suppression UX exist.
7. Media item detail rendering and in-app playback flows are implemented.
8. Database migrations establish core product domains.
9. Planning artifacts are extensive and include provider strategy research.

---

## 10) What remains to complete full target state

1. Finalize and stabilize production music-provider path with deterministic quality and availability.
2. Fully operationalize Discover cache strategy and background refresh design (if re-enabled by product direction).
3. Replace remaining mock estimation sections with true inference/evaluation services.
4. Expand feature depth for currently light modules (Virtual Doctor/Profile/Journal/Notifications).
5. Add stronger automated tests and operational runbook coverage.

---

## 11) Final project-level statement

PeacePlot is a broad and ambitious wellness platform with a strong implemented foundation in architecture, auth/session, check-in intelligence, and Discover system design.  
The project now has both extensive code implementation and planning depth.  
To reach complete production maturity, remaining work is focused on reliability hardening, provider stabilization, and completion depth for all product surfaces.

