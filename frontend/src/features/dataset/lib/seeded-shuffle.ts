// Deterministic shuffle with a string seed (mulberry32 PRNG)
export type PRNG = () => number;

function mulberry32(seed: number): PRNG {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makePrngFromSeed(seedStr: string): PRNG {
  // simple string hash -> 32-bit seed
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return mulberry32(h >>> 0);
}

export function seededShuffle<T>(arr: T[], seed: string): T[] {
  const prng = makePrngFromSeed(seed);
  const out = arr.slice();
  // Fisher–Yates using seeded PRNG
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default seededShuffle;

// ------------------------------------------------------------
// Deterministic split helpers
// ------------------------------------------------------------
export type SplitRatios = { train: number; val: number; test: number };

/**
 * Create deterministic index splits (train/val/test) for n items.
 * Accepts either an array (to infer length) or a number (n).
 * Uses seededShuffle() internally to ensure reproducibility.
 */
export function createSplitIndices<T>(
  itemsOrLen: T[] | number,
  ratios: Partial<SplitRatios>,
  seed: string
): { train: number[]; val: number[]; test: number[] } {
  const n = typeof itemsOrLen === 'number' ? itemsOrLen : itemsOrLen.length;
  const r: SplitRatios = {
    train: ratios.train ?? 0.7,
    val: ratios.val ?? 0.15,
    test: ratios.test ?? 0.15,
  };
  // normalize if not exactly 1.0
  const total = r.train + r.val + r.test;
  if (Math.abs(total - 1) > 1e-6) {
    r.train /= total; r.val /= total; r.test /= total;
  }
  const indices = Array.from({ length: n }, (_, i) => i);
  const shuffled = seededShuffle(indices, seed);
  let trainCount = Math.floor(n * r.train);
  let valCount = Math.floor(n * r.val);
  let testCount = n - trainCount - valCount; // remainder to test to sum exactly n
  // guards
  if (trainCount < 0) trainCount = 0;
  if (valCount < 0) valCount = 0;
  if (testCount < 0) testCount = 0;
  const train = shuffled.slice(0, trainCount);
  const val = shuffled.slice(trainCount, trainCount + valCount);
  const test = shuffled.slice(trainCount + valCount);
  return { train, val, test };
}

/**
 * Optional convenience: split actual items with the same seed.
 */
export function splitWithSeed<T>(
  items: T[],
  ratios: Partial<SplitRatios>,
  seed: string
): { train: T[]; val: T[]; test: T[] } {
  const { train, val, test } = createSplitIndices(items.length, ratios, seed);
  return {
    train: train.map(i => items[i]),
    val: val.map(i => items[i]),
    test: test.map(i => items[i]),
  };
}