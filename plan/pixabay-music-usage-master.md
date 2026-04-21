# Pixabay Music API Master Guide for PeacePlot

## Purpose

This guide documents how to use Pixabay for the Discover music experience in PeacePlot with production-safe architecture, stable runtime behavior, and quality filtering.

This is a research/strategy document, not implementation code.

---

## 1) What is officially documented by Pixabay

From official docs (`https://pixabay.com/api/docs/`):

- Publicly documented endpoints:
  - `GET /api/` (images)
  - `GET /api/videos/` (videos)
- Global API rules:
  - Rate limit: **100 requests per 60 seconds** (per API key)
  - Responses must be cached for **24 hours**
  - No systematic mass downloading
  - Error codes returned with plain-text body
- Licensing guidance:
  - Pixabay Content License applies
  - attribution optional but recommended

Important note:

- The official docs currently do **not** provide a fully detailed section for `GET /api/audio/` with the same contract depth as images/videos.
- If PeacePlot uses `/api/audio/`, treat it as a lower-certainty endpoint and validate behavior with your own key + monitoring.

---

## 2) Practical conclusion for PeacePlot

Pixabay can be used as a **raw source**, but must not be trusted directly for runtime UX.

You should use:

1. Backend-only provider access
2. Ingestion + filtering + normalization
3. Curated DB serving to client

Never do:

- direct frontend calls to Pixabay
- raw provider response to users
- per-user runtime query fan-out to provider

---

## 3) Recommended production architecture

Pixabay (raw)
-> Backend ingestion worker (scheduled)
-> Filter + normalize + score
-> `media_tracks` (Supabase/Postgres)
-> Discover API (your backend)
-> Mobile app

Benefits:

- stable latency
- fewer provider failures visible to users
- cleaner music-only results
- easier pagination (`15 per page` reliably)

---

## 4) Ingestion strategy (music-focused)

### 4.1 Query clusters

Use predefined keyword clusters instead of free-text forwarding.

- Calm: `meditation`, `calm piano`, `ambient`, `relaxing music`
- Sleep: `sleep music`, `deep ambient`, `night calm`
- Focus: `focus music`, `study music`, `lofi`, `instrumental`
- Uplift: `uplifting instrumental`, `motivation background`, `positive ambient`

### 4.2 Request shape

If `/api/audio/` is available for your key:

- `key`
- `q`
- `page`
- `per_page` (recommended 20-50)
- `order=popular` for initial quality

### 4.3 Raw store

Store raw payload snapshot for debug/replay:

- `provider_raw_json`
- request query metadata
- ingestion timestamp

---

## 5) Multi-layer quality filter (required)

Apply these in ingestion pipeline:

1. **Type filter**
   - keep only records marked as music/audio asset

2. **Duration filter**
   - keep `120..600` seconds (2-10 minutes)
   - if missing duration, quarantine for second-pass validation

3. **Speech blacklist**
   - block tags/text including:
   - `talk`, `speech`, `podcast`, `episode`, `narration`, `lecture`, `audiobook`, `interview`

4. **SFX/noise blacklist**
   - block `sfx`, `whoosh`, `impact`, `alarm`, `ringtone`, `beep`, `ui`, `trailer`

5. **Playable URL validation**
   - keep only trusted audio URL patterns
   - suppress broken URLs after failed runtime attempts

---

## 6) Tag normalization model

Map raw tags into product taxonomy:

- `ambient` -> `calm`
- `meditation` -> `calm`
- `focus` -> `productivity`
- `sleep` -> `sleep`
- `dark ambient` -> `deep_relax`
- `uplifting` -> `uplifting`
- `instrumental` -> `instrumental`

Persist both:

- `tags_raw` (traceability)
- `tags_normalized` (product logic)

---

## 7) Data model for stable Discover music

Recommended `media_tracks` fields:

- `id` (uuid)
- `source` (`pixabay`)
- `source_id`
- `title`
- `artist`
- `duration_seconds`
- `audio_url`
- `tags_raw`
- `tags_normalized` (jsonb)
- `mood` (derived)
- `energy_level` (derived)
- `license_url`
- `page_url`
- `is_active`
- `quality_score`
- `created_at`, `updated_at`

---

## 8) Serving API behavior

Endpoint example:

- `GET /discover/music?mood=calm&page=1&pageSize=15`

Backend rules:

- read from curated DB only
- return exactly 15 when available
- dedupe by stable key
- fallback policy when fewer than 15:
  - broaden mood cluster
  - then lower score threshold
  - never return blocked content

---

## 9) Performance and reliability controls

- Respect provider rate limit (100 req / 60 sec per key)
- Cache provider responses for at least 24h as required
- Use background jobs instead of request-time crawling
- Add retry with jitter for transient provider failures
- Add circuit breaker if provider repeatedly fails

Monitor:

- ingestion success rate
- filtered/accepted ratio
- empty-result rate for music feed
- broken audio URL rate

---

## 10) Legal/compliance checklist

- Keep source metadata (`artist`, `pageURL`, `license link`)
- Follow Pixabay content terms
- Attribution optional but strongly recommended in admin/reporting views
- Avoid prohibited bulk behavior

---

## 11) Risk notes (important)

1. If `/api/audio/` behavior changes or is not consistently available, direct runtime dependency will break UX.
2. Tag quality is inconsistent; normalization is mandatory.
3. Strict filters can zero out results; maintain fallback query clusters and second-pass enrichment.
4. Do not mix policy assumptions from unofficial blog posts with official contract; verify against live responses in your key scope.

---

## 12) Best-fit strategy for current PeacePlot

For your app goals (fast load + clean music + no speech):

1. Use Pixabay as ingestion source, not runtime source.
2. Pre-clean and store tracks in DB.
3. Serve Discover from curated table with deterministic pagination.
4. Keep a small runtime suppress list for broken URLs.
5. Run daily refresh worker and hourly health checks.

This gives the most stable user experience and avoids repeating empty music feed failures.

