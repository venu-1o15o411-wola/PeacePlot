# PeacePlot Discover — Full Implementation Plan

This document is the source-of-truth plan for building a production-grade Discover system in PeacePlot.

Planning only. No implementation code is included here.

Companions:
- `plan/plan.md`
- `plan/research.md`
- `plan/pixabay-plan.md`

---

## 1) Product goals

Discover must become a personalized, media-rich wellness surface with:

- dynamic external content (video/image/music/books/places + AI advice)
- user-specific ranking using hidden analysis from estimation flows
- clean browsing via category chips + search + subcategories
- strong in-app media playback/reading experience
- low-latency behavior through cache-first data architecture

---

## 2) Hard functional requirements (locked)

### 2.1 Featured slider (top horizontal rail)

On Discover open, show exactly 5 featured items:

1. one video
2. one music
3. one book
4. one movement
5. one place

Rules:

- must be personalized per user when user analysis exists
- if user has no analysis (new user / no estimation yet), use random fallback
- items must rotate daily (no permanently fixed picks)
- same user should see stable picks throughout a day, then refresh next day
- no duplicates

### 2.2 Category chip list (`All`, `Books`, `Media`, `Music`, `Yoga & Tai Chi`, `Places`, `AI advice`)

Rules:

- category list logic is separate from featured slider logic
- selecting a chip triggers API-backed retrieval for that category
- initial load per selected category must provide at least 15 items
- scrolling down triggers additional API calls (pagination/infinite load)
- no duplicate items in library list, including across pages

### 2.3 `All` category (most important)

`All` must be a blended ranked feed (not a naive merge), with:

- balanced representation across content families
- personalization-aware ordering
- deduplication and diversity controls
- stable pagination

---

## 3) Content sources and source responsibilities

Recommended provider split:

- `Media` / `Places` visuals: Pixabay
- `Music`: Jamendo
- `Books`: Gutenberg dataset via stable API gateway (e.g. Gutendex-style)
- `AI advice`: internal generation/preset content
- `Movement`: mixed source (Jamendo/Pixabay video + curated fallback)

All provider calls must go through Supabase Edge Functions (no provider key in Expo client).

---

## 4) Discover architecture (high level)

### 4.1 Two independent data pipelines

Pipeline A — **Featured Daily Picks**:
- input: user profile + hidden analysis + date key
- output: exactly 5 items (one per required type)
- cached per user per day

Pipeline B — **Category Feed**:
- input: selected chip, query text, subcategory filters, pagination cursor
- output: >=15 items initial page, then paginated appends
- deduped and ranked

### 4.2 Media runtime pipeline

When user opens an item, app routes by media type to in-app renderer:

- video player
- image viewer
- audio/music player
- book reader
- movement player (usually video-focused mode)

---

## 5) Personalization inputs (hidden analysis integration)

Personalization should use internal signals from estimation systems (question/audio and future modalities), including:

- stress level/band
- mood valence
- energy level
- confidence
- inferred stress sources
- preference/memory clues
- recent interaction feedback (`save`, `hide`, `not_for_me`, completion)

Build a normalized user preference vector per user (recomputed on relevant updates).

---

## 6) Subcategories and mood taxonomy

Define a canonical Discover subcategory taxonomy used across all sources:

- calm
- peaceful
- relax
- meditation
- focus
- happy
- warm
- lovely
- romantic
- family
- funny
- uplifting
- interesting
- impressive
- reflective
- sleepy

Each content item stores weighted subcategory scores (`0..1`) after normalization/enrichment.

Purpose:
- help users discover intent-level content, not only media type
- improve recommendation precision
- improve `All` quality and search relevance

---

## 7) Ranking model

Final ranking score per candidate item:

`final = w1*personal_fit + w2*query_match + w3*subcategory_match + w4*quality + w5*freshness - w6*repetition_penalty`

Where:

- `personal_fit`: user analysis alignment
- `query_match`: search relevance
- `subcategory_match`: mood/intention matching
- `quality`: trust + source quality + metadata completeness
- `freshness`: daily/new rotation value
- `repetition_penalty`: suppress near-duplicates/same-author saturation

Apply hard filters before ranking:

- safety filters
- source license availability
- category compatibility
- dedupe by stable source key

---

## 8) `All` feed strategy (deep spec)

`All` should use blended retrieval + balanced ranking:

1. pull candidate pools from each category family
2. score all candidates with ranking model
3. apply balanced quota for top window (prevent one type dominating)
4. interleave top-ranked items with diversity constraints
5. return paginated cursor with seen-id tracking

Recommended first-page target profile:

- mixed set across at least 4 categories
- no consecutive spam from same source/author where possible
- at least one short-duration option early

---

## 9) Search and filter behavior

### 9.1 Search

- if chip != `All`: scoped search in selected category
- if chip == `All`: global search with blended ranking
- server-side search ranking is canonical (client does only local UI interactions)

### 9.2 Filters

Primary:
- category chip

Secondary:
- subcategory/mood
- duration bands (short, medium, long)
- source/type-specific constraints

Filter state participates in query hash for caching and pagination consistency.

---

## 10) Caching and database persistence (reduce external calls)

### 10.1 Cache layers

1. provider response cache (raw external payloads)
2. normalized catalog cache (app-ready records)
3. query-result cache (ordered ids per request shape)
4. user-daily featured cache (5 picks)

### 10.2 Core tables (planned)

- `discover_catalog`
  - normalized content rows from all providers
- `discover_raw_cache`
  - provider payload cache with TTL
- `discover_query_cache`
  - query hash -> item ids + expiry
- `discover_daily_featured`
  - profile/date -> 5 selected items
- `discover_user_feedback`
  - save/hide/not_for_me/open/complete events
- `discover_user_profile_vector`
  - derived personalization signals snapshot

### 10.3 Cache policy

- cache-first read
- stale-while-revalidate where possible
- provider-specific TTLs
- scheduled refresh for popular chips/subcategories
- strict request budget/rate limiting

---

## 11) Deduplication rules (must enforce)

Canonical id:

- `discover_item_uid = source + ":" + source_item_id`

Deduplication applies:

- within same response page
- across paginated appends
- between featured and current library viewport (optional UX improvement)

If page fill is short after dedupe:
- fetch more from source until target count met or source exhausted

---

## 12) Daily featured rotation logic

Daily key:

- `YYYY-MM-DD` in user timezone

Selection approach:

- deterministic seeded ranking (`profile_id + date_key`)
- chooses best candidate per required type
- stores final picks in `discover_daily_featured`

Refresh conditions:

- new day key
- major profile update (optional policy)
- content no longer valid/inactive -> reselect replacement

---

## 13) Player and viewer environment (in-app)

Discover must support in-app consumption:

- **Video**: inline/fullscreen player, buffering and retry states
- **Image**: full-screen viewer with zoom/pan
- **Music**: background-safe playback controls and progress
- **Book**: reader mode with typography controls (font/size/line-height/theme)
- **Movement**: video-focused playback + metadata

All players require:

- loading state
- error state with retry
- source attribution
- progress/engagement event tracking

---

## 14) Error handling and fallbacks

Backend:

- typed provider failure responses (`RATE_LIMIT`, `UPSTREAM_UNAVAILABLE`, etc.)
- retry/backoff on transient errors

Client:

- friendly non-technical messages
- retain last known cached content when possible
- use curated fallback seeds if provider unavailable

---

## 15) Security, licensing, and compliance

- all API keys in Supabase secrets only
- never use `EXPO_PUBLIC_*` for provider secrets
- provider terms/license review checkpoints before launch
- attribution fields stored and shown where required/recommended
- safety content screening for stress-sensitive product context

---

## 16) Observability and quality metrics

Track at minimum:

- discover load success rate
- p50/p95 latency
- cache hit ratio
- duplicate suppression count
- featured click-through
- category search/filter usage
- player start/completion rates
- fallback frequency

Quality alerts:

- low cache hit ratio
- repeated provider failures
- low diversity score in `All`

---

## 17) Implementation phases

### Phase 1 — Data foundation

- final schema + edge function skeleton
- provider connectors + normalization
- cache tables and TTL strategy

### Phase 2 — Featured + category APIs

- daily 5-item personalized featured endpoint
- category endpoint with >=15 initial items and pagination
- strict dedupe

### Phase 3 — Discover UI wiring

- replace mock source with APIs
- chip-driven loading
- infinite scroll
- state handling (loading/error/empty)

### Phase 4 — Media runtime

- video/image/audio/book player screens
- telemetry + attribution

### Phase 5 — Relevance quality

- subcategory chips
- ranking tuning
- feedback loop integration (`save`, `not_for_me`)

---

## 18) Acceptance criteria (definition of done)

The Discover revamp is complete only when all pass:

1. featured slider shows exactly 5 required types
2. featured is personalized per user when analysis exists
3. featured rotates daily and is stable during same day
4. category chip loads >=15 items initially
5. infinite scroll fetches more items on scroll
6. no duplicates appear in library list
7. `All` feed is blended and balanced (not raw merge)
8. in-app media players/readers work for each type
9. cache-first strategy reduces external API calls
10. fallback behavior prevents empty/broken Discover for normal outages

---

## 19) Open decisions to confirm before implementation

1. Jamendo licensing tier and commercial usage terms for PeacePlot distribution.
2. Final Gutenberg access path (direct mirror vs Gutendex gateway).
3. Subcategory set lock (initial list vs expanded set).
4. Whether `AI advice` appears in featured 5 or only in category feeds.
5. Content retention policy for cached media metadata.

---

## 20) Recommended first coding target

Build a production-safe v1 with:

- featured daily 5 picks endpoint
- category endpoint with chip + pagination + dedupe
- one player route that dispatches to type-specific viewers
- cache tables and request budgets

Then iterate ranking and subcategories in v1.5/v2.

---

_Last updated: 2026-04-20_

