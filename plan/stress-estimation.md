# PeacePlot — Stress estimation plans (split by feature)

**Companion:** [`plan.md`](./plan.md), [`research.md`](./research.md)

This document splits plans into two areas:

1. Face stress estimation (camera / selfie)
2. Finger-PPG stress estimation (back camera + torch)

---

## Part 1 — Face stress estimation plan

### 1.1 Feature intent

Deliver camera-based face stress estimation from a selfie flow with explicit face validation, wellness framing, and routing into the existing post-estimation path.

### 1.2 Product flow

1. User opens face check-in from Measure/Home.
2. Front camera preview is shown.
3. On **native**, a hidden WebView loads **MediaPipe Face Landmarker** (WASM + `face_landmarker.task`); capture stays disabled until the engine signals ready.
4. User taps capture.
5. App runs **Face Landmarker** on the still image (blendshapes + 468 landmarks), validates that a face is present, then maps signals to a wellness score/band.
6. Result modal is shown.
7. User continues to `/estimate/dataset-types` then `/estimate/result`.

### 1.3 Technical architecture (implemented)

| Layer | Implementation |
|--------|----------------|
| Capture | `expo-camera` `CameraView` (`visual-measure-flow.tsx`) |
| Inference | **MediaPipe Face Landmarker** (`float16/1/face_landmarker.task`) via `@mediapipe/tasks-vision` |
| **Web** | WASM runs in the browser; `face-engine.web.ts` + `mediapipe-face-landmarker-shared.ts` |
| **iOS / Android** | Same JS API inside **`react-native-webview`**: Hermes has no `document`/canvas, so Tasks Vision cannot run on the JS thread; the WebView hosts the identical pipeline (`face-landmarker-webview.tsx` → `face-engine.native.ts`) |
| Stress mapping | `estimateStressFromMediaPipe` / `estimateStressFromNormalizedLandmarks` in `stress-signals.ts` (heuristic wellness mapping, not a bundled “stress” classifier) |

### 1.4 Engine / model notes

- **Model asset:** `face_landmarker.task` (Face Landmarker), loaded from Google Storage CDN (same as MediaPipe samples).
- **WASM:** Served from `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@<version>/wasm` (WASM is part of the `tasks-vision` package; there is no separate `@mediapipe/tasks-wasm` npm package).
- **Expo Go:** If the WebView bridge never registers, `face-engine.native.ts` falls back to **demo hash** scoring with `faceDetectionDemo: true` so flows remain testable.
- **Optional later:** Train or calibrate a separate model on top of landmark/blendshape features; see `assets/models/README.md` if added.

### 1.5 Face-specific error handling

- Face not detected → `VisualPipelineOutcome` `kind: "retry"` with user-facing copy (no fake success).
- Face engine failed to load (network / WebView) → banner + capture disabled; user can retry after fixing connectivity.
- Runtime inference failure → `retry` with message (or Expo Go demo fallback where applicable).

### 1.6 Engineering work items (face) — status

- [x] Native path uses real Face Landmarker output (not URI hash demo) in development builds with working WebView + network.
- [x] Shared WASM URL corrected to `tasks-vision/.../wasm`.
- [x] Heuristic mapping avoids image-dimension “noise” terms; scores derive from blendshapes/geometry only.
- [ ] Optional: bundle `.task` + WASM as app assets for fully offline first open (larger binary).
- [ ] Optional: replace or augment heuristics with a trained classifier.

### 1.7 Face success criteria

- End-to-end flow works on supported devices without crashes.
- Invalid face capture never emits a misleading “real” success when the engine ran and found no face.
- Native uses the same landmark model semantics as web (MediaPipe Tasks), differing only in host (browser vs WebView).
- Output remains compatible with dataset gating and `/estimate/result`.

---

## Part 2 — Finger-PPG stress estimation plan

### 2.1 Feature intent

Deliver real on-device finger-based stress estimation using back camera + torch (PPG method) on iPhone, with strict signal validation and no demo/random scoring.

### 2.2 Required engine and types

Shared engine typing must include finger engine:

```ts
export type StressEngineKind =
  | "mediapipe"
  | "mlkit"
  | "finger-ppg"
  | "finger-ppg-onnx"
  | "demo";
```

Required success shape for finger estimation:

```ts
{
  ok: true,
  stressScore: number,
  stressBand: "low" | "moderate" | "elevated",
  confidence: number,
  stressEngine: "finger-ppg-onnx" | "finger-ppg"
}
```

(`finger-ppg-onnx` = bundled ONNX MLP; `finger-ppg` = RMSSD formula fallback if ONNX fails.)

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

- `finger-engine.native.ts`: session orchestration, frame processing, detection, signal extraction, peaks/HRV, ONNX inference, final response.
- `stress-from-finger.ts`: map RMSSD to score and band (fallback path), shared band thresholds.
- `assets/models/ppg_stress_mlp.onnx`: offline-trained MLP (see `scripts/export_ppg_stress_onnx.py`); runtime via `onnxruntime-react-native` (`ppg-stress-onnx.ts`).
- `ppg-stress-features.ts`: 8-D feature vector aligned with the export script.

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
   - **Primary:** ONNX MLP (`ppg_stress_mlp.onnx`) on normalized PPG features (includes RMSSD/BPM/peaks/amplitude cues).
   - **Fallback:** `estimateStressFromPPG(rmssd)` in `stress-from-finger.ts` if ONNX load/inference fails.
   - Bands from score: same thresholds as other modes (e.g. &lt;40 low, &gt;72 elevated after clamp 15–95).

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
- ONNX inference is small (few KB model); signal math remains on-CPU before the net.
- Smooth execution on iOS without UI stutter.

### 2.9 Finger success criteria

- Works on real iPhone with back camera + torch.
- Uses real frame-derived signal only (no fake/demo score).
- Correctly emits only required errors: `NO_FINGER`, `LOW_SIGNAL`, `TOO_SHORT`.
- Produces normalized stress output compatible with downstream flow.

---

*Face Part 1 reflects the current MediaPipe + WebView native implementation. Finger Part 2 remains as originally specified.*
