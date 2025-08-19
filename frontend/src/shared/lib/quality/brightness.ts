// Average brightness in 0..255 from ImageData
export type BrightnessInput = ImageData;

export function computeBrightness(img: BrightnessInput): number {
  const { data } = img;
  if (!data || data.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  return sum / (data.length / 4);
}

export const getBrightness = computeBrightness;
export default computeBrightness;

// ---- NEW: aliases expected by callers ----
export function calculateBrightness(img: ImageData): number {
  return computeBrightness(img);
}

export type BrightnessStatus = 'dark' | 'ok' | 'bright';
export function getBrightnessStatus(
  val: number,
  opts: { dark?: number; bright?: number } = {}
): BrightnessStatus {
  const dark = opts.dark ?? 50;      // ~too dark
  const bright = opts.bright ?? 200; // ~too bright
  if (val >= bright) return 'bright';
  if (val <= dark) return 'dark';
  return 'ok';
}