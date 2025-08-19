// Motion score between two frames (0..1 approx). Requires equal-sized ImageData.
export function computeMotionScore(prev: ImageData, curr: ImageData): number {
  if (
    prev.width !== curr.width ||
    prev.height !== curr.height ||
    prev.data.length !== curr.data.length
  ) {
    return 0;
  }
  const a = prev.data;
  const b = curr.data;
  let acc = 0;
  const pixels = a.length / 4;
  for (let i = 0; i < a.length; i += 4) {
    const ag = 0.299 * a[i] + 0.587 * a[i + 1] + 0.114 * a[i + 2];
    const bg = 0.299 * b[i] + 0.587 * b[i + 1] + 0.114 * b[i + 2];
    acc += Math.abs(ag - bg); // 0..255
  }
  // Normalize to ~0..1 range
  return Math.min(1, acc / (pixels * 255));
}

export const estimateMotion = computeMotionScore;
export default computeMotionScore;

// ---- NEW: aliases expected by callers ----
export function motionDetector(prev: ImageData, curr: ImageData): number {
  return computeMotionScore(prev, curr);
}

export type MotionStatus = 'still' | 'moving' | 'too_fast';
export function getMotionStatus(
  score: number,
  opts: { moving?: number; too_fast?: number } = {}
): MotionStatus {
  const moving = opts.moving ?? 0.06;
  const tooFast = opts.too_fast ?? 0.15;
  if (score >= tooFast) return 'too_fast';
  if (score >= moving) return 'moving';
  return 'still';
}