// Simple types for hand detection without MediaPipe dependencies
export interface SimpleHandDetection {
  box: {
    x: number;
    y: number;
    w: number;
    h: number;
    score: number;
  };
  landmarks: Array<{
    x: number;
    y: number;
    z: number;
  }>;
  handedness: 'Left' | 'Right';
}

export interface SimpleFallbackDetection {
  detectHands(): SimpleHandDetection[];
  isInitialized: boolean;
  initialize(): Promise<boolean>;
  cleanup(): void;
}

export class SimpleFallbackHandDetection implements SimpleFallbackDetection {
  isInitialized = false;

  async initialize(): Promise<boolean> {
    console.log('Using fallback hand detection (no MediaPipe)');
    this.isInitialized = true;
    return true;
  }

  detectHands(): SimpleHandDetection[] {
    // Return empty array - no detection capability
    return [];
  }

  cleanup(): void {
    this.isInitialized = false;
  }
}
