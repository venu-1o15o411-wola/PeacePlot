import * as FileSystem from "expo-file-system/legacy";
import React, { useCallback, useEffect, useRef } from "react";
import { Platform, StyleSheet, View } from "react-native";
import type { WebViewMessageEvent } from "react-native-webview";
import { WebView } from "react-native-webview";

import {
  setNativeFaceLandmarkerRunner,
  type NativeFaceLandmarkerPayload,
} from "@/lib/face-landmarker-native-bridge";
import { TASKS_WASM_VER } from "@/lib/mediapipe-face-landmarker-shared";

const ANALYSIS_TIMEOUT_MS = 90_000;

/**
 * Inline HTML: loads the same `@mediapipe/tasks-vision` bundle as web, inside WKWebView / Android WebView.
 * RN Hermes cannot host MediaPipe WASM (needs DOM); this is the supported way to reuse the `.task` model.
 */
function buildBridgeHtml(): string {
  const wasm = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_WASM_VER}/wasm`;
  const bundle = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_WASM_VER}/vision_bundle.mjs`;
  const model =
    "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/></head><body>
<script type="module">
import { FaceLandmarker, FilesetResolver } from "${bundle}";

const WASM_BASE = ${JSON.stringify(wasm)};
const MODEL = ${JSON.stringify(model)};

let landmarker = null;
let initPromise = null;

function post(obj) {
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify(obj));
  }
}

function ensureInit() {
  if (!initPromise) {
    initPromise = (async () => {
      // Second arg is useModule (ES6 wasm loaders), not SIMD. true breaks WKWebView (ModuleFactory not set); false uses classic wasm.
      const wasmFileset = await FilesetResolver.forVisionTasks(WASM_BASE, false);
      landmarker = await FaceLandmarker.createFromOptions(wasmFileset, {
        baseOptions: { modelAssetPath: MODEL, delegate: "CPU" },
        runningMode: "IMAGE",
        numFaces: 1,
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: false,
        minFaceDetectionConfidence: 0.4,
        minFacePresenceConfidence: 0.35,
      });
      post({ type: "ready" });
    })();
  }
  return initPromise;
}

async function runDetection(base64) {
  await ensureInit();
  if (!landmarker) throw new Error("Face Landmarker failed to initialize.");

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = "data:image/jpeg;base64," + base64;
  await new Promise((res, rej) => {
    img.onload = () => res(null);
    img.onerror = () => rej(new Error("Could not decode the captured image."));
  });

  const det = landmarker.detect(img);
  post({
    type: "result",
    faceLandmarks: det.faceLandmarks && det.faceLandmarks[0] ? det.faceLandmarks[0] : null,
    categories: det.faceBlendshapes && det.faceBlendshapes[0] ? det.faceBlendshapes[0].categories : null,
  });
}

window.__runFaceLandmarker = async (base64) => {
  try {
    await runDetection(base64);
  } catch (err) {
    post({
      type: "error",
      message: err && err.message ? err.message : String(err),
    });
  }
};

ensureInit().catch((err) => {
  post({
    type: "error",
    message: "init: " + (err && err.message ? err.message : String(err)),
  });
});
</script>
</body></html>`;
}

type Pending = {
  resolve: (v: NativeFaceLandmarkerPayload) => void;
  reject: (e: Error) => void;
};

export function FaceLandmarkerWebView({
  onEngineReady,
  onEngineError,
}: {
  onEngineReady: () => void;
  onEngineError: (message: string) => void;
}) {
  const webRef = useRef<WebView>(null);
  const pendingRef = useRef<Pending | null>(null);
  const readyRef = useRef(false);

  const clearPending = useCallback((err: Error) => {
    const p = pendingRef.current;
    pendingRef.current = null;
    p?.reject(err);
  }, []);

  const onMessage = useCallback(
    (ev: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(ev.nativeEvent.data) as {
          type?: string;
          message?: string;
          faceLandmarks?: NativeFaceLandmarkerPayload["faceLandmarks"];
          categories?: NativeFaceLandmarkerPayload["categories"];
        };
        if (data.type === "ready") {
          readyRef.current = true;
          onEngineReady();
          return;
        }
        if (data.type === "error") {
          const msg = data.message || "Face engine error";
          if (!readyRef.current) {
            onEngineError(msg);
          }
          clearPending(new Error(msg));
          return;
        }
        if (data.type === "result") {
          const p = pendingRef.current;
          pendingRef.current = null;
          p?.resolve({
            faceLandmarks: data.faceLandmarks ?? null,
            categories: data.categories ?? null,
          });
        }
      } catch {
        clearPending(new Error("Invalid response from face engine."));
      }
    },
    [clearPending, onEngineError, onEngineReady],
  );

  const runAnalysis = useCallback(async (uri: string): Promise<NativeFaceLandmarkerPayload> => {
    let readUri = uri;
    if (uri.startsWith("content://") && FileSystem.cacheDirectory) {
      const dest = `${FileSystem.cacheDirectory}face-${Date.now()}.jpg`;
      await FileSystem.copyAsync({ from: uri, to: dest });
      readUri = dest;
    }

    const base64 = await FileSystem.readAsStringAsync(readUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return new Promise<NativeFaceLandmarkerPayload>((resolve, reject) => {
      const t = setTimeout(() => {
        pendingRef.current = null;
        reject(new Error("Face analysis timed out. Try again."));
      }, ANALYSIS_TIMEOUT_MS);

      pendingRef.current = {
        resolve: (v) => {
          clearTimeout(t);
          resolve(v);
        },
        reject: (e) => {
          clearTimeout(t);
          reject(e);
        },
      };

      const payload = JSON.stringify(base64);
      const js = `void (function(){ var b = ${payload}; window.__runFaceLandmarker(b); })();`;
      webRef.current?.injectJavaScript(js);
    });
  }, []);

  useEffect(() => {
    if (Platform.OS === "web") return;
    setNativeFaceLandmarkerRunner(runAnalysis);
    return () => {
      setNativeFaceLandmarkerRunner(null);
      pendingRef.current = null;
    };
  }, [runAnalysis]);

  if (Platform.OS === "web") {
    return null;
  }

  return (
    <View style={styles.host} pointerEvents="none" accessible={false}>
      <WebView
        ref={webRef}
        style={styles.webview}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="compatibility"
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        source={{ html: buildBridgeHtml(), baseUrl: "https://localhost" }}
        onMessage={onMessage}
        onError={(e) => onEngineError(e.nativeEvent.description || "WebView error")}
        onHttpError={(e) => onEngineError(`HTTP ${e.nativeEvent.statusCode}`)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    width: 1,
    height: 1,
    opacity: 0,
    overflow: "hidden",
  },
  webview: { width: 1, height: 1 },
});
