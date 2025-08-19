// Quality util: blur metric via Laplacian variance (no DOM access at import time)
// Accepts ImageData; return higher => sharper (more edges), lower => blurrier.
export type BlurInput = ImageData;

export function computeBlurVar(img: BlurInput): number {
  const { data, width, height } = img;
  const len = width * height;
  if (!len) return 0;
  // grayscale buffer
  const gray = new Float32Array(len);
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    // ITU-R BT.601 luma
    gray[j] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  let sum = 0;
  let sumSq = 0;
  // 4-neighborhood Laplacian: -4c + n+s+e+w
  for (let y = 1; y < height - 1; y++) {
    const row = y * width;
    for (let x = 1; x < width - 1; x++) {
      const idx = row + x;
      const c = gray[idx];
      const n = gray[idx - width];
      const s = gray[idx + width];
      const w = gray[idx - 1];
      const e = gray[idx + 1];
      const lap = -4 * c + n + s + w + e;
      sum += lap;
      sumSq += lap * lap;
    }
  }
  const n = (width - 2) * (height - 2);
  if (n <= 0) return 0;
  const mean = sum / n;
  const variance = sumSq / n - mean * mean;
  // guard against tiny negatives from FP
  return variance > 0 ? variance : 0;
}

// Aliases to be resilient against different import names
export const blurVar = computeBlurVar;
export const estimateBlur = computeBlurVar;
export default computeBlurVar;

// ---- NEW: helpers expected by callers ----
export function calculateBlurScore(img: ImageData): number {
  return computeBlurVar(img);
}

export type BlurStatus = 'bad' | 'warn' | 'good';
export function getBlurStatus(
  score: number,
  opts: { warn?: number; good?: number } = {}
): BlurStatus {
  // sensible defaults; adjust later from config if needed
  const warn = opts.warn ?? 80;
  const good = opts.good ?? 200;
  if (score >= good) return 'good';
  if (score >= warn) return 'warn';
  return 'bad';
}

// Extract ImageData from various sources (video/canvas/image/bitmap)
// Called at runtime only; no DOM usage at import time.
export function extractImageData(
  source: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement | ImageBitmap,
  targetW?: number,
  targetH?: number,
  options: { mirror?: boolean } = {}
): ImageData {
  const mirror = !!options.mirror;
  const sw =
    (source as HTMLVideoElement).videoWidth ||
    (source as HTMLImageElement).naturalWidth ||
    (source as HTMLCanvasElement).width ||
    (source as ImageBitmap).width ||
    0;
  const sh =
    (source as HTMLVideoElement).videoHeight ||
    (source as HTMLImageElement).naturalHeight ||
    (source as HTMLCanvasElement).height ||
    (source as ImageBitmap).height ||
    0;
  const dw = targetW ?? sw;
  const dh = targetH ?? sh;
  // Prefer OffscreenCanvas if available
  const canvas: any =
    typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(dw, dh)
      : (() => {
          const c = document.createElement('canvas');
          c.width = dw;
          c.height = dh;
          return c;
        })();
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context unavailable');
  if (mirror) {
    ctx.translate(dw, 0);
    ctx.scale(-1, 1);
  }
  // drawImage supports all these source types
  // @ts-expect-error OffscreenCanvas has same API
  ctx.drawImage(source as any, 0, 0, dw, dh);
  return ctx.getImageData(0, 0, dw, dh);
}