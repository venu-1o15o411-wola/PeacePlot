# FMA Usage Master Guide for PeacePlot

## Purpose

This document summarizes the current Free Music Archive (FMA) developer policy and defines the safest production approach for using FMA content in PeacePlot.

It is a research and architecture guide (no code implementation).

---

## 1) What the official FMA docs say (critical)

From FMA `App developers` page:

- FMA's old public API was shut down.
- FMA does not allow direct hotlink streaming from their servers for app playback at scale.
- FMA does not allow forwarding app user search queries to FMA search and scraping results without explicit approval.
- If app developers want to use FMA content, they should contact FMA and agree on fair usage.

Impact:

- PeacePlot cannot rely on "live FMA API query per user request" as a stable/official model.
- Music must be treated as a licensed ingestion pipeline, not a direct live proxy.

---

## 2) What this means for PeacePlot

For production, there are only two compliant ways:

1. **Approved FMA partnership flow (preferred if FMA-only is mandatory)**
   - Contact FMA directly.
   - Get explicit approval for data access and usage pattern.
   - Ingest approved tracks into PeacePlot-owned storage/CDN.
   - Serve users from PeacePlot infrastructure, not FMA hotlinks.

2. **Do not use FMA directly for runtime**
   - Use a different provider with official API terms for runtime discovery.
   - Keep FMA only if approval and ingestion rights are granted.

Because your requirement is FMA-only, PeacePlot should use option 1.

---

## 3) Recommended architecture (FMA-only, compliant, scalable)

### 3.1 Ingestion model (offline/background)

Run a scheduled ingestion job (e.g. Supabase Edge cron or backend worker):

1. Read approved FMA catalog source.
2. Normalize metadata.
3. Apply music-only filters.
4. Save approved items into PeacePlot DB.
5. Mirror/host playable audio on PeacePlot storage/CDN if allowed by license and agreement.

### 3.2 Serving model (runtime)

Client flow:

- App requests Discover Music feed from PeacePlot backend.
- Backend reads from `media_tracks` table only.
- Backend returns clean, prefiltered music rows.

Never do:

- direct FMA runtime search per user action,
- direct hotlink playback from FMA servers,
- runtime HTML scraping from FMA search pages.

---

## 4) Music-only filtering standard for PeacePlot

Apply all layers during ingestion:

1. **Genre allowlist**
   - allow: electronic, ambient, classical, instrumental, jazz, lo-fi, chillout, soundtrack
   - block: spoken, podcast, radio, interview, audiobook, news

2. **Speech keyword detector**
   - title + description + tags check
   - block words: talk, speech, interview, podcast, episode, narration, lecture, discussion, commentary, audiobook

3. **Duration filter**
   - target: 2-10 min for your product rule
   - if duration unknown: quarantine for manual review or second-pass classifier

4. **Tag normalization**
   - ambient -> calm
   - meditation -> calm
   - focus -> productivity
   - sleep -> sleep
   - dark ambient -> deep_relax

5. **License filter**
   - keep only licenses your product can legally distribute
   - store license URL and attribution text per track

---

## 5) Database structure for stable runtime

Recommended table: `media_tracks`

Core fields:

- `id` (internal UUID)
- `source` (`fma`)
- `source_item_id`
- `title`
- `artist`
- `genre_raw`
- `tags_raw`
- `tags_normalized`
- `duration_seconds`
- `audio_url_runtime` (PeacePlot-hosted or approved URL)
- `license_type`
- `license_url`
- `attribution_text`
- `is_music_only` (boolean)
- `safety_status` (`approved`, `quarantine`)
- `created_at`, `updated_at`

---

## 6) Operational plan

### Phase A - Policy/rights

1. Contact FMA and describe PeacePlot use case.
2. Confirm written permission for ingestion and hosting pattern.
3. Confirm license handling and attribution requirements.

### Phase B - Pipeline

1. Build ingestion worker.
2. Apply filter stack and save clean tracks.
3. Add attribution and license enforcement.

### Phase C - Runtime

1. Serve Discover Music only from curated DB rows.
2. Paginate 15 items per page.
3. Track playback failures and suppress bad URLs.

---

## 7) Risk checklist

- **Policy risk:** FMA access/use blocked if no approval.
- **License risk:** incorrect redistribution rights.
- **Content drift risk:** speech/non-music leakage if filters weaken.
- **Performance risk:** runtime provider dependency; solved by ingestion+DB serving.

---

## 8) Final recommendation for your app

For PeacePlot, the best production path is:

- Keep FMA as desired source brand.
- Stop runtime dependency on direct FMA querying.
- Move to approved ingestion + own catalog serving.
- Enforce music-only filter before data reaches users.

This gives you:

- legal safety,
- stable loading speed,
- clean music-only UX,
- and no repeated provider outages in Discover.

