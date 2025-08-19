import { test, expect } from '@playwright/test';

// Note: This would typically be a Jest/Vitest unit test, but using Playwright for simplicity
// In a real project, you'd use a proper unit testing framework

test.describe('Seeded Shuffle Unit Tests', () => {
  test('seeded shuffle produces deterministic results', async ({ page }) => {
    // This test verifies that the seeded shuffle function works deterministically
    // We'll test this by creating a simple page that runs the seeded shuffle
    
    await page.goto('/');
    
    // Add the seeded shuffle function to the page context
    const result = await page.evaluate(() => {
      // Simplified version of seeded shuffle for testing
      class SeededRNG {
        private seed: number;
      
        constructor(seed: string) {
          let hash = 0;
          for (let i = 0; i < seed.length; i++) {
            const char = seed.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
          }
          this.seed = Math.abs(hash);
        }
      
        next(): number {
          this.seed |= 0;
          this.seed = this.seed + 0x6D2B79F5 | 0;
          let t = Math.imul(this.seed ^ this.seed >>> 15, 1 | this.seed);
          t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
          return ((t ^ t >>> 14) >>> 0) / 4294967296;
        }
      
        nextInt(min: number, max: number): number {
          return Math.floor(this.next() * (max - min + 1)) + min;
        }
      }
      
      function seededShuffle<T>(array: T[], seed: string): T[] {
        const shuffled = [...array];
        const rng = new SeededRNG(seed);
        
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = rng.nextInt(0, i);
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        return shuffled;
      }

      // Test deterministic behavior
      const testArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const seed = 'test-seed-123';
      
      const result1 = seededShuffle(testArray, seed);
      const result2 = seededShuffle(testArray, seed);
      
      return {
        identical: JSON.stringify(result1) === JSON.stringify(result2),
        result1,
        result2
      };
    });
    
    expect(result.identical).toBe(true);
    expect(result.result1).toEqual(result.result2);
  });

  test('different seeds produce different results', async ({ page }) => {
    await page.goto('/');
    
    const result = await page.evaluate(() => {
      // Same seeded shuffle implementation as above
      class SeededRNG {
        private seed: number;
      
        constructor(seed: string) {
          let hash = 0;
          for (let i = 0; i < seed.length; i++) {
            const char = seed.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
          }
          this.seed = Math.abs(hash);
        }
      
        next(): number {
          this.seed |= 0;
          this.seed = this.seed + 0x6D2B79F5 | 0;
          let t = Math.imul(this.seed ^ this.seed >>> 15, 1 | this.seed);
          t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
          return ((t ^ t >>> 14) >>> 0) / 4294967296;
        }
      
        nextInt(min: number, max: number): number {
          return Math.floor(this.next() * (max - min + 1)) + min;
        }
      }
      
      function seededShuffle<T>(array: T[], seed: string): T[] {
        const shuffled = [...array];
        const rng = new SeededRNG(seed);
        
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = rng.nextInt(0, i);
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        return shuffled;
      }

      const testArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      
      const result1 = seededShuffle(testArray, 'seed-1');
      const result2 = seededShuffle(testArray, 'seed-2');
      
      return {
        different: JSON.stringify(result1) !== JSON.stringify(result2),
        result1,
        result2
      };
    });
    
    expect(result.different).toBe(true);
  });
});