# PeacePlot — Stress estimation plans (split by feature)

**Status:** planning only — **no implementation yet**  
**Companion:** [`plan.md`](./plan.md), [`research.md`](./research.md)

This document is intentionally split into two fully separate plans:
1. Face stress estimation plan
2. Finger-PPG stress estimation plan

---

## Part 1 — Face stress estimation plan

### 1.1 Feature intent

Deliver camera-based face stress estimation from a selfie flow with explicit face validation, wellness framing, and routing into the existing post-estimation path.

### 1.2 Product flow

1. User opens face check-in from Measure/Home.
2. Front camera preview is shown.
3. User taps capture.
4. App validates that a face is detectable and sufficiently clear.
5. If valid: app computes stress result.
6. Result modal is shown.
7. User continues to `/estimate/dataset-types` then `/estimate/result`.

### 1.3 Technical architecture

- Entry flow component: existing camera estimation path (`estimate/[mode].tsx` + visual flow component).
- Face pipeline:
  - Capture still image.
  - Validate face presence and quality.
  - Extract features (landmarks/blendshapes and/or crop).
  - Estimate stress score/band.
- Output contract:
  - `stressScore` clamped to 15-95.
  - `stressBand` in `low | moderate | elevated`.
  - `stressEngine` reflects actual runtime engine.

### 1.4 Engine/model notes

- Web can use MediaPipe Face Landmarker stack.
- Native should progress to real inference stack (ML Kit/MediaPipe native + later MobileNetV2 where planned).
- Demo fallback may exist temporarily, but must be explicit and never represented as real measurement.

### 1.5 Face-specific error handling

- Face not detected.
- Face detected but quality below minimum threshold.
- Runtime/inference failure.

No invalid face input should produce a normal success result.

### 1.6 Engineering work items (face)

- Harden real native path and clearly gate demo behavior.
- Ensure face output conforms to shared stress typing.
- Keep UX aligned with PeacePlot style/accessibility.
- Keep downstream routing unchanged.

### 1.7 Face success criteria

- End-to-end flow works on supported devices without crashes.
- Invalid face capture never emits false success.
- Result UX and transitions are consistent with current estimate flows.
- Output stays compatible with dataset gating and recommendation routes.

---

## Part 2 — Finger-PPG stress estimation plan

### 2.1 Feature intent

Deliver real on-device finger-based stress estimation using back camera + torch (PPG method) on iPhone, with strict signal validation and no demo/random scoring.

### 2.2 Required engine and types

Shared engine typing must include finger engine:

```ts
export type StressEngineKind = "mediapipe" | "mlkit" | "finger-ppg" | "demo";
```

Required success shape for finger estimation:

```ts
{
  ok: true,
  stressScore: number,
  stressBand: "low" | "moderate" | "elevated",
  confidence: number,
  stressEngine: "finger-ppg"
}
```

Required error shapes:

```ts
{ ok: false, error: "NO_FINGER" }
{ ok: false, error: "LOW_SIGNAL" }
{ ok: false, error: "TOO_SHORT" }
```

### 2.3 Required modules

Create:
- `src/lib/finger-engine.native.ts`
- `src/lib/stress-from-finger.ts`

Responsibilities:
- `finger-engine.native.ts`: session orchestration, frame processing, detection, signal extraction, peaks/HRV, final response.
- `stress-from-finger.ts`: map RMSSD to score and band, clamp and normalize output.

### 2.4 Runtime/camera requirements

Use **VisionCamera** (not Expo Camera) because finger PPG requires:
- back camera selection,
- torch control during capture,
- frame-by-frame access at stable FPS (~30).

### 2.5 Finger algorithm pipeline

1. **Start session**
   - Open back camera.
   - Turn torch on.
   - Show instruction: "Place your finger on camera."

2. **Finger detection**
   - `isFingerDetected(frame): boolean`
   - Conditions:
     - average red channel high (target threshold > 150, tunable),
     - red > green and red > blue,
     - low brightness variance.
   - If fail: return `NO_FINGER`.

3. **Signal collection**
   - `collectPPGSignal(durationMs): number[]` with timestamps.
   - Capture duration 10-20 sec (target 15 sec).
   - Sample per frame and store average red intensity.

4. **Peak detection**
   - `detectPeaks(signal): number[]`
   - Local maxima + threshold filtering.
   - Reject weak/noisy traces -> `LOW_SIGNAL`.

5. **HR + HRV**
   - `computeHRV(peaks, timestamps) -> { bpm, rmssd }`
   - BPM from peaks over duration.
   - RR intervals from peak deltas.
   - RMSSD = sqrt(mean(square(diff(RR)))).

6. **Stress mapping**
   - `estimateStressFromPPG(rmssd)` in `stress-from-finger.ts`
   - Mapping:
     - `rmssd < 20` -> `elevated`
     - `20-50` -> `moderate`
     - `> 50` -> `low`
   - Score normalized and clamped to 15-95.

### 2.6 Finger UI flow

1. User taps check-in.
2. Back camera + torch on.
3. Finger validation.
4. If invalid -> alert + reset.
5. Collect 15s signal with progress indicator.
6. Process data.
7. Show stress result modal.
8. Continue to dataset-type gating.

### 2.7 Finger integration points

- Extend native dispatcher to route finger engine calls.
- Keep face and finger runners separate; do not force session-based finger flow into photo-only face API.
- Ensure lifecycle cleanup on cancel/back/background (torch off, session stop, state reset).

### 2.8 Finger-specific performance requirements

- ~30 FPS target during collection.
- Lightweight processing path (signal math, no heavy model required).
- Smooth execution on iOS without UI stutter.

### 2.9 Finger success criteria

- Works on real iPhone with back camera + torch.
- Uses real frame-derived signal only (no fake/demo score).
- Correctly emits only required errors: `NO_FINGER`, `LOW_SIGNAL`, `TOO_SHORT`.
- Produces normalized stress output compatible with downstream flow.

---

*End of split plans — implementation begins only after explicit go-ahead.*
