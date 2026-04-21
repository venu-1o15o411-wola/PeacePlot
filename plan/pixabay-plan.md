# Pixabay Integration Plan for Discover

This plan describes how to integrate Pixabay into PeacePlot's Discover experience without exposing secrets in the client and while staying aligned with current app architecture.

Scope here is planning only (no code changes).

---

## 1) Goals

- Replace static Discover placeholders with dynamic, calming media from Pixabay.
- Keep experience safe and wellness-appropriate (no explicit content, stress-reducing bias).
- Preserve app reliability with caching, pagination, and fallback behavior.
- Keep compliance with project backend policy: API secrets live in Supabase Edge Functions, not Expo client.

---

## 2) Current Project Fit

Discover currently uses local mock data:

- `src/data/discover-mock.ts`
- `src/components/discover/discover-library.tsx`
- `src/app/(drawer)/(tabs)/discover/item/[id].tsx`

Existing UI is already structured for:

- search
- chips/categories
- featured rail
- library list
- detail page

This makes Pixabay a good fit as a backend content source feeding the same UI contract.

---

## 3) Pixabay Capabilities We Can Use

Primary endpoints:

- Images: `https://pixabay.com/api/`
- Videos: `https://pixabay.com/api/videos/`

Useful query controls for Discover:

- `q`, `category`, `lang`
- `safesearch=true`
- `editors_choice=true` (for featured quality)
- `order=popular|latest`
- pagination via `page`, `per_page`
- orientation filtering (`horizontal`) for card-friendly thumbnails

Operational constraints to design for:

- rate limit around `100 req / 60 sec` per key (handle 429)
- cache responses (Pixabay recommends caching, and requests should not spam their service)
- do not expose Pixabay key in mobile app bundle
- do not hotlink permanently as a hard dependency for critical rendering; prefer server-managed URL strategy and caching where practical

---

## 4) Proposed Architecture (PeacePlot-Safe)

### 4.1 Backend proxy through Supabase Edge Function

Add a dedicated Edge Function (example: `discover-pixabay`) that:

- receives normalized Discover query params from app
- validates/whitelists params
- calls Pixabay with secret API key from Supabase environment
- normalizes Pixabay payload into PeacePlot `DiscoverItem`-friendly shape
- returns only fields needed by UI

Why:

- keeps key private
- allows filtering/safety controls server-side
- enables caching, fallback logic, and future source blending

### 4.2 Cache-first behavior

Use two layers:

- in-function short-term cache (if available in runtime patterns)
- database cache table in Supabase (recommended) keyed by normalized query

Suggested cache table concept:

- query_hash
- source (`pixabay-images` / `pixabay-videos`)
- payload_json
- fetched_at
- expires_at

Policy:

- serve cached data when fresh
- background refresh or synchronous refresh when stale
- enforce minimum cache TTL aligned with Pixabay expectations (24h-safe strategy)

### 4.3 Client data flow

Discover screen should call one app lib function (example: `fetchDiscoverFeed`) that hits Supabase function and returns:

- featured items
- list items
- pagination cursor/page

This keeps UI components clean and allows replacing mock data incrementally.

---

## 5) Discover Mapping Strategy

Map Pixabay media into current Discover chips and modalities:

- `books`: keep curated/local dataset (Pixabay is not a books source)
- `media`: Pixabay images + videos
- `music`: keep non-Pixabay (internal/curated)
- `movement`: optional Pixabay videos for yoga/tai-chi visual guidance
- `places`: Pixabay place/travel imagery (inspiration layer)
- `ai`: keep internal AI advice content
- `all`: blended feed

Result: Pixabay powers visual/media-heavy surfaces, while non-visual categories remain curated and trustworthy.

---

## 6) Content Quality and Safety Rules

Apply strict server-side rules before returning content:

- always `safesearch=true`
- preferred categories for calm use cases: `nature`, `places`, `travel`, `backgrounds`, selected `music` visuals
- deprioritize tags likely to increase stress (violent/disaster themes)
- prefer higher quality signals:
  - larger dimensions
  - editors choice
  - moderate/high engagement
- language default `en`, expandable later by locale

Also maintain "wellness not medical advice" tone and avoid implying clinical efficacy.

---

## 7) Data Contract for App (Normalized Shape)

Define a stable app-facing model (example):

- `id` (stable source-prefixed id)
- `source` (`pixabay`)
- `type` (`image` | `video`)
- `title`
- `subtitle` (tags/category-derived)
- `duration` (for videos; synthetic label for images)
- `thumbUrl`
- `contentUrl`
- `authorName`
- `authorProfileUrl`
- `tags[]`
- `modality` mapping used by current Discover UI
- `featured` boolean

This contract should remain source-agnostic, so future providers can be added without UI rewrites.

---

## 8) UI Rollout Plan (No Big Bang)

### Phase A: Data plumbing

- Keep existing UI and replace `DISCOVER_ITEMS` sourcing with API-fed data adapter.
- Preserve current chip/search behavior.

### Phase B: Visual fidelity improvements

- use real thumbnails in featured cards and row thumbs
- keep icon fallback when media fails

### Phase C: Detail page enhancement

- show larger hero media preview
- show attribution line (source/author)
- open external source safely or play in-app for supported media

### Phase D: Personalization

- use recent check-in context (stress band / dataset preferences) to bias query terms and ordering
- keep deterministic fallback if personalization data missing

---

## 9) Query and Ranking Plan

Base query seeds for calm Discover:

- `"calm nature"`, `"ocean sunset"`, `"forest walk"`, `"relaxing landscape"`, `"gentle yoga"`

Ranking stack:

1. safety pass
2. relevance to selected chip/query
3. quality score (resolution + engagement + editors choice)
4. freshness/popularity blend
5. diversity pass (avoid near-duplicates)

Featured rail:

- editors-choice + high-quality + calm category constraints

Library list:

- broader match with pagination

---

## 10) Error Handling and Fallbacks

Backend:

- handle Pixabay `429` and `5xx` with retry/backoff
- return typed errors (do not leak raw provider payloads)

Client:

- friendly empty state ("Content is loading, try again shortly")
- retain last successful cached feed if available
- graceful offline fallback to local mock/seed content

---

## 11) Licensing and Attribution Approach

Pixabay content is generally free to use under Pixabay license, but plan should still:

- display source acknowledgment in Discover detail screen (good practice)
- keep author/source metadata in normalized model
- avoid redistributing content in prohibited standalone ways
- periodically review Pixabay Terms/License for policy changes

---

## 12) Security and Secrets

- store `PIXABAY_API_KEY` only in Supabase Edge Function secrets
- never expose key in `EXPO_PUBLIC_*`
- validate and sanitize all client query params server-side
- apply request budget limits per user/session to protect service

---

## 13) Performance Targets

- first Discover paint: use cached payload immediately when possible
- network response target for cached hits: fast path under ~300ms server time
- paginated load more with fixed page size (example 20)
- image thumbnail size selection tuned to list/card usage

---

## 14) Analytics and Success Metrics

Track:

- Discover feed load success rate
- cache hit ratio
- median API latency
- item opens by chip/modality
- save/share/open-through actions
- fallback rate (provider failures)

Use these metrics to tune query seeds and ranking quality.

---

## 15) Implementation Checklist (when coding starts)

1. Create Supabase secret: `PIXABAY_API_KEY`.
2. Add Edge Function proxy for Pixabay search (images/videos).
3. Add cache table + TTL strategy.
4. Add app lib client for Discover feed request.
5. Introduce normalized DTO mapper from Pixabay to app model.
6. Swap Discover list data source from mock to API adapter (feature-flagged).
7. Add attribution in detail screen.
8. Add retry/fallback handling in function and client.
9. Add analytics events for Discover interactions.
10. Remove or downscope mock dataset after stability validation.

---

## 16) Risks and Mitigations

- **Provider limits/outages** -> caching + fallback seeds + typed errors
- **Inconsistent quality** -> ranking filters + editors choice weighting
- **License drift** -> periodic policy review checkpoint
- **Overcoupling to one source** -> normalized source-agnostic contract
- **Slow media load on mobile** -> thumbnail strategy + lazy loading

---

## 17) Recommended First Deliverable

A minimal production-safe v1:

- Pixabay-backed featured + media chips
- strict safe search + calm categories
- server-side cache
- attribution on item detail
- mock fallback for non-Pixabay categories (`books`, `ai`, `music`)

This gives immediate Discover upgrade without destabilizing the rest of PeacePlot.

