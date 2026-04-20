# Bundled models

## `ppg_stress_mlp.onnx`

- **Purpose:** Finger PPG check-in — maps an 8-D normalized feature vector (RMSSD, BPM, red-channel stats, peaks, duration, etc.) to a wellness stress score.
- **Produced by:** `scripts/export_ppg_stress_onnx.py` (requires Python venv with `numpy`, `scikit-learn`, `skl2onnx`, `onnx`).
- **Training:** Synthetic data whose labels follow the legacy `estimateStressFromPPG(rmssd)` mapping in `src/lib/stress-from-finger.ts`, with small coupling to other features so the MLP uses the full vector. Replace this script with your own dataset and re-export when you have validated labels.
- **Runtime:** `onnxruntime-react-native` in `src/lib/ppg-stress-onnx.ts`. Raw outputs are trained in the **15–95** range and **mapped to 0–100** via `mapLegacyStressTo0to100` in `src/lib/stress-score-common.ts`. Re-export the model with 0–100 labels to skip that mapping.
