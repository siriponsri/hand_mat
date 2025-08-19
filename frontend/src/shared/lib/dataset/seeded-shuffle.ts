// Seeded pseudorandom number generator using mulberry32 algorithm

export class SeededRNG {
  private seed: number;

  constructor(seed: string) {
    // Convert string seed to number
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    this.seed = Math.abs(hash);
  }

  // Generate next pseudorandom number (0 to 1)
  next(): number {
    this.seed |= 0;
    this.seed = this.seed + 0x6D2B79F5 | 0;
    let t = Math.imul(this.seed ^ this.seed >>> 15, 1 | this.seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }

  // Generate random integer between min and max (inclusive)
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

// Deterministic shuffle using Fisher-Yates algorithm with seeded RNG
export function seededShuffle<T>(array: T[], seed: string): T[] {
  const shuffled = [...array];
  const rng = new SeededRNG(seed);
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = rng.nextInt(0, i);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

// Create deterministic split indices for a given array size
export function createSplitIndices(
  totalSize: number, 
  splits: { train: number; val: number; test: number },
  seed: string
): { train: number[]; val: number[]; test: number[] } {
  // Create array of indices
  const indices = Array.from({ length: totalSize }, (_, i) => i);
  
  // Shuffle deterministically
  const shuffledIndices = seededShuffle(indices, seed);
  
  // Calculate split sizes
  const trainSize = Math.floor(totalSize * splits.train);
  const valSize = Math.floor(totalSize * splits.val);
  const testSize = totalSize - trainSize - valSize;
  
  return {
    train: shuffledIndices.slice(0, trainSize),
    val: shuffledIndices.slice(trainSize, trainSize + valSize),
    test: shuffledIndices.slice(trainSize + valSize),
  };
}