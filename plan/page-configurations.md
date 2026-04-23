# PeacePlot Page Configuration Specification

## Scope

This document defines page-level configuration for the full PeacePlot app (excluding landing page by request), including:

- page inventory (implemented + required)
- navigation structure
- UI/UX composition
- core functions per page
- required states (loading/empty/error/offline)
- key interactions and data dependencies

This is a design + product configuration blueprint for implementation alignment.

---

## 1) Global App Navigation Configuration

## 1.1 Primary shell

- **Root mode**: Auth-gated app shell
- **Main navigation**: Drawer + Bottom Tabs hybrid
- **Primary tabs**:
  - Home
  - Discover
  - Measure
  - Virtual Doctor
  - Profile

## 1.2 Drawer section

- Journal
- Notifications
- Settings
- Help/Support
- About/Terms/Privacy

## 1.3 Route principles

- Keep tab identity persistent; avoid deep stack resets between tabs.
- Child pages open as stack screens from their parent tab context.
- Back behavior should return to parent context, not app root.

---

## 2) Global UX Rules (All Pages)

1. **Calm-first UI**
   - low visual noise
   - clear hierarchy
   - breathing space between controls

2. **Single primary action**
   - each page has one clear next step (CTA)

3. **State completeness**
   - every data page must define:
     - loading state
     - empty state
     - error state
     - retry behavior

4. **No dead controls**
   - if feature not available, show disabled reason with guidance

5. **Accessibility baseline**
   - 44px touch targets minimum
   - high-contrast text and controls
   - semantic labels for all interactive components

6. **In-app media behavior**
   - no forced external browser for core content experiences

---

## 3) Auth & Account Pages

## 3.1 Sign In

**Purpose**
- Authenticate returning users.

**Core sections**
- email input
- password input
- forgot password
- sign in button
- link to sign up

**Functions**
- email/password auth
- validation messaging
- auth error feedback

**States**
- submitting
- invalid credentials
- network error

## 3.2 Sign Up

**Purpose**
- Onboard new users with account creation.

**Core sections**
- user id / display id
- email
- password
- confirm password
- sign up CTA

**Functions**
- unique user-id check
- account creation
- post-signup redirect

## 3.3 Password Reset

**Purpose**
- Recover account access.

**Core sections**
- email field
- send reset link
- success confirmation

---

## 4) Home Tab Pages

## 4.1 Home Dashboard

**Purpose**
- Daily overview and entry point to key wellness actions.

**Core sections**
- greeting + date context
- quick stress status card
- today’s recommendation highlights
- shortcuts:
  - start check-in
  - open discover
  - talk to virtual doctor

**Functions**
- show latest analysis summary
- show personalized quick actions

## 4.2 Daily Summary Detail (Required)

**Purpose**
- Expanded daily trend and suggestions.

**Core sections**
- stress trend snippet
- recommended actions
- completion checklist

---

## 5) Measure Tab Pages

## 5.1 Measure Hub

**Purpose**
- Let users select stress estimation modality.

**Core sections**
- method cards:
  - Questions
  - Voice
  - Camera/Visual
  - Finger (PPG-style)
- method requirements note

## 5.2 Questions Measure Flow

**Purpose**
- Guided self-report estimation.

**Core sections**
- progress indicator
- one question block per step
- next/back controls
- submit

**Functions**
- compute stress inference input
- store session data

## 5.3 Audio Measure Flow

**Purpose**
- Voice-input based stress estimation.

**Core sections**
- permission gate
- record control
- waveform/timer
- upload/process state
- result transition

## 5.4 Visual Measure Flow

**Purpose**
- Camera-based visual stress signal estimation.

**Core sections**
- camera permission
- calibration/positioning
- capture/processing
- confidence indicator

## 5.5 Finger Measure Flow

**Purpose**
- Finger-on-camera pulse/variation estimation.

**Core sections**
- instruction panel
- capture status
- quality signal indicator

## 5.6 Dataset/Method Confirmation

**Purpose**
- Confirm selected evidence type before result finalization.

## 5.7 Measure Result Page

**Purpose**
- Show estimated stress result and actionable next steps.

**Core sections**
- score summary
- interpretation text
- recommended next actions
- CTA to Discover / Doctor

---

## 6) Discover Tab Pages

## 6.1 Discover Library (Main)

**Purpose**
- Personalized media discovery and self-care library.

**Core sections**
- search bar
- hidden-items controls
- category chips (All, Books, Video, Images, Music, Movement, Places, AI)
- featured rail
- library list

**Functions**
- category query (15 initial items)
- infinite scroll (+15)
- dedupe
- user feedback actions

**Required UX behavior**
- no stale list while loading new category (clear-and-load)
- clear source/type tag where needed

## 6.2 Discover Item Detail

**Purpose**
- Render selected content in an in-app experience.

**Core sections**
- title/subtitle/metadata
- media preview area
- open media action
- save/hide/not-for-me/complete actions

## 6.3 Discover Media Viewer Modal

**Purpose**
- Fullscreen consumption experience (audio/video/image/book).

**Core requirements**
- smooth open/close
- reliable controls
- clear fallback messaging when source fails

## 6.4 Discover Search Results (Required logical state)

**Purpose**
- Scoped search display within selected chip.

---

## 7) Virtual Doctor Tab Pages

## 7.1 Virtual Doctor Home

**Purpose**
- Entry point for conversational support.

**Core sections**
- current mood/stress context
- start conversation CTA
- recent conversation cards

## 7.2 Conversation Session

**Purpose**
- Real-time guided support chat/voice experience.

**Core sections**
- message stream
- input control (text/voice toggle)
- session summary prompt

**Functions**
- store conversation messages
- safety language guardrails

## 7.3 Session Summary (Required)

**Purpose**
- Post-session recap and recommendations.

---

## 8) Profile Tab Pages

## 8.1 Profile Overview

**Purpose**
- Show user identity, progress snapshots, and preferences.

**Core sections**
- profile header
- stress trend mini-chart
- personalization settings shortcut

## 8.2 Account Settings

**Purpose**
- Manage identity/security settings.

**Core sections**
- email/userid
- password reset
- sign out

## 8.3 Preferences & Personalization

**Purpose**
- Configure content preferences (mood, duration, media types).

## 8.4 Privacy & Data Controls

**Purpose**
- Explain and manage data usage.

**Core sections**
- export data
- delete account
- consent toggles

---

## 9) Drawer Pages

## 9.1 Journal

**Purpose**
- Daily reflection and check-in history notes.

**Core sections**
- entry list
- create/edit entry
- mood tags

## 9.2 Notifications

**Purpose**
- reminders, recommendations, and system messages.

## 9.3 Settings

**Purpose**
- app-level controls.

**Core sections**
- theme/appearance
- language
- notification preferences

## 9.4 Help & Support

**Purpose**
- FAQ, support contact, incident guidance.

## 9.5 Legal (Terms/Privacy/About)

**Purpose**
- compliance and transparency pages.

---

## 10) Required Cross-Page States

Every data-driven page must support:

- `loading`
- `empty`
- `error`
- `retry`
- `offline` (if network unavailable)

For media pages, add:

- `media-unavailable`
- `source-timeout`
- `unsupported-format`

---

## 11) Design System Configuration (UI Consistency)

## 11.1 Core visual tokens

- rounded cards/chips
- primary accent for active tab/chip/CTA
- muted text for secondary metadata
- high-contrast text for headlines and buttons

## 11.2 Component primitives

- app header
- section label
- card (featured/list/detail)
- chip selector
- input/search field
- primary/secondary buttons
- inline status badge

## 11.3 Motion behavior

- subtle transitions for tab/chip/page changes
- no heavy animation during loading-critical moments

---

## 12) Data/Function Ownership by Page Group

- Auth pages -> `auth-session` + Supabase Auth
- Measure pages -> measurement components + `checkin-chat` backend
- Discover pages -> `discover-feed` backend + client feed library
- Doctor pages -> conversational backend/services
- Profile/Journal/Notification -> user data tables/services

---

## 13) Current Implementation Coverage Summary

Already implemented (major):

- Auth (sign in/up/session basics)
- Main shell navigation (drawer + tabs)
- Measure flows (questions/audio/visual/finger, mixed maturity)
- Discover UI and backend orchestration
- Discover item detail/media viewing path
- Core backend tables and migrations

Partially implemented / needed next:

- Virtual Doctor depth
- Profile depth
- Journal/Notifications functional depth
- stronger reliability and observability for provider-dependent Discover music
- broader automated test coverage

---

## 14) Final configuration note

This page configuration should be treated as the canonical UX map for PeacePlot app implementation, excluding landing page by design.  
Any new page or flow should be added here before implementation to keep architecture, UX, and backend scope aligned.

