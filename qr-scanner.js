// qr-scanner.js
// Lightweight QR scanner with iOS-friendly camera handling (Safari + PWA)

(function () {
  const hasBarcodeDetector =
    typeof window.BarcodeDetector !== "undefined" &&
    BarcodeDetector.getSupportedFormats &&
    BarcodeDetector.getSupportedFormats().then
      ? true
      : typeof window.BarcodeDetector !== "undefined";

  let barcodeDetector = null;

  async function createBarcodeDetector() {
    if (!hasBarcodeDetector) return null;

    try {
      const formats = ["qr_code"];
      if (BarcodeDetector.getSupportedFormats) {
        const supported = await BarcodeDetector.getSupportedFormats();
        const available = formats.filter((f) => supported.includes(f));
        if (!available.length) return null;
        return new BarcodeDetector({ formats: available });
      } else {
        return new BarcodeDetector({ formats });
      }
    } catch (e) {
      console.warn("BarcodeDetector not available:", e);
      return null;
    }
  }

  async function getBestStream() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Kamera wird von diesem Browser nicht unterstützt.");
    }

    const baseConstraints = {
      audio: false,
      video: {
        facingMode: { ideal: "environment" },
      },
    };

    try {
      return await navigator.mediaDevices.getUserMedia(baseConstraints);
    } catch (e) {
      // Fallback ohne facingMode
      console.warn("facingMode failed, trying generic video:", e);
      return await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    }
  }

  function createCanvas(video) {
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    return canvas;
  }

  async function scanLoop(state) {
    if (!state.active) return;

    const { video, onResult, onError } = state;

    if (video.readyState < 2) {
      requestAnimationFrame(() => scanLoop(state));
      return;
    }

    try {
      if (!state.canvas) {
        state.canvas = createCanvas(video);
        state.ctx = state.canvas.getContext("2d");
      }

      state.canvas.width = video.videoWidth;
      state.canvas.height = video.videoHeight;

      state.ctx.drawImage(video, 0, 0, state.canvas.width, state.canvas.height);

      if (state.detector) {
        const bitmap = await createImageBitmap(state.canvas);
        const codes = await state.detector.detect(bitmap);
        if (codes && codes.length > 0) {
          state.active = false;
          stopStream(state);
          onResult(codes[0].rawValue || codes[0].rawValue);
          return;
        }
      }

      requestAnimationFrame(() => scanLoop(state));
    } catch (err) {
      console.warn("Scan error:", err);
      if (onError) onError(err);
      requestAnimationFrame(() => scanLoop(state));
    }
  }

  function stopStream(state) {
    if (state.stream) {
      state.stream.getTracks().forEach((t) => t.stop());
      state.stream = null;
    }
  }

  async function start(options) {
    const { videoElement, onResult, onError } = options;

    if (!videoElement) {
      throw new Error("videoElement ist erforderlich.");
    }

    // iOS-Spezial: diese Attribute sind wichtig
    videoElement.setAttribute("playsinline", "true");
    videoElement.setAttribute("autoplay", "true");
    videoElement.setAttribute("muted", "true");

    const state = {
      video: videoElement,
      stream: null,
      detector: null,
      canvas: null,
      ctx: null,
      active: true,
      onResult,
      onError,
    };

    try {
      state.detector = await createBarcodeDetector();
    } catch (e) {
      console.warn("BarcodeDetector init failed:", e);
    }

    try {
      state.stream = await getBestStream();
      videoElement.srcObject = state.stream;

      const playPromise = videoElement.play();
      if (playPromise && playPromise.catch) {
        playPromise.catch((e) => {
          console.warn("Video play blocked:", e);
          if (onError) onError(e);
        });
      }

      requestAnimationFrame(() => scanLoop(state));

      return {
        stop: () => {
          state.active = false;
          stopStream(state);
        },
      };
    } catch (err) {
      console.error("Kamera konnte nicht gestartet werden:", err);
      if (onError) onError(err);
      throw err;
    }
  }

  window.QRScanner = {
    start,
  };
})();
