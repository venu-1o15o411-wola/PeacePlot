#!/usr/bin/env python3
"""
Train a small MLP regressor on synthetic PPG feature vectors and export ONNX for
`onnxruntime-react-native`. Labels follow the same RMSSD→stress mapping as
`src/lib/stress-from-finger.ts`, with small coupling to other features so the net
uses the full vector (not only the first dimension).

Requires: pip install numpy scikit-learn skl2onnx onnx
(Run from project venv: `. .venv-ppg-export/bin/activate`)
"""
from __future__ import annotations

import os
import sys

import numpy as np
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType
from sklearn.neural_network import MLPRegressor


def teacher_stress_from_rmssd(rmssd: np.ndarray) -> np.ndarray:
    """Match `estimateStressFromPPG` / clampScore in stress-from-finger.ts."""
    bounded = np.clip(rmssd, 5, 120)
    normalized = 100 - ((bounded - 5) / 115) * 100
    score = np.clip(np.round(normalized), 15, 95)
    return score.astype(np.float32)


def main() -> None:
    rng = np.random.default_rng(42)
    n = 50_000
    # Synthetic physiology ranges (aligned with finger-engine heuristics)
    rmssd = rng.uniform(5, 120, n).astype(np.float32)
    bpm = rng.uniform(48, 185, n).astype(np.float32)
    mean_red = rng.uniform(110, 255, n).astype(np.float32)
    std_red = rng.uniform(2, 55, n).astype(np.float32)
    amp = rng.uniform(8, 90, n).astype(np.float32)
    peaks_per_s = rng.uniform(0.4, 2.2, n).astype(np.float32)
    duration_s = rng.uniform(10.5, 18.0, n).astype(np.float32)

    # Normalized feature block (must stay in sync with `ppg-stress-features.ts`)
    x0 = np.clip(rmssd / 120.0, 0, 1)
    x1 = np.clip(bpm / 200.0, 0, 1)
    x2 = np.clip((mean_red - 100) / 155.0, 0, 1)
    x3 = np.clip(std_red / 50.0, 0, 1)
    x4 = np.clip(amp / 100.0, 0, 1)
    x5 = np.clip(peaks_per_s / 2.5, 0, 1)
    x6 = np.clip(duration_s / 20.0, 0, 1)
    # Interaction / coupling so the MLP uses more than rmssd proxy
    x7 = np.clip(x0 * 0.65 + x4 * 0.35 + rng.normal(0, 0.02, n), 0, 1).astype(np.float32)

    X = np.stack([x0, x1, x2, x3, x4, x5, x6, x7], axis=1).astype(np.float32)

    y = teacher_stress_from_rmssd(rmssd)
    y = y + 0.35 * (x1 - 0.5) * 10 + 0.25 * (x4 - 0.5) * 8
    y = np.clip(np.round(y), 15, 95).astype(np.float32)

    model = MLPRegressor(
        hidden_layer_sizes=(48, 24),
        activation="relu",
        solver="adam",
        alpha=1e-4,
        max_iter=800,
        random_state=42,
        early_stopping=True,
        validation_fraction=0.12,
        n_iter_no_change=40,
    )
    model.fit(X, y)

    initial_types = [("ppg_features", FloatTensorType([None, 8]))]
    onnx_model = convert_sklearn(model, initial_types=initial_types, target_opset=12)

    out_dir = os.path.join(os.path.dirname(__file__), "..", "assets", "models")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "ppg_stress_mlp.onnx")
    with open(out_path, "wb") as f:
        f.write(onnx_model.SerializeToString())

    # Sanity-check with onnxruntime if available
    try:
        import onnxruntime as ort

        sess = ort.InferenceSession(out_path, providers=["CPUExecutionProvider"])
        inp = sess.get_inputs()[0].name
        pred = sess.run(None, {inp: X[:16]})[0]
        mae = float(np.mean(np.abs(pred.ravel() - y[:16])))
        print(f"Exported {out_path} ({os.path.getsize(out_path)} bytes). Sample MAE on 16 rows: {mae:.2f}")
    except Exception as e:
        print(f"Exported {out_path} ({os.path.getsize(out_path)} bytes). (ORT check skipped: {e})")


if __name__ == "__main__":
    main()
