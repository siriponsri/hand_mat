// HandMat Configuration
export const CONFIG = {
  // Face Detection
  STABILITY_MS: 300,
  COOLDOWN_MS: 1500,
  POLL_MS: 100,
  SCORE_THRESHOLD: 0.9,
  MOVEMENT_THRESHOLD: 10, // pixels
  MOVEMENT_THRESHOLD_PX: 10, // Legacy alias
  
  // ROI Configuration
  ROI_WIDTH_PERCENT: 0.6,
  ROI_HEIGHT_PERCENT: 0.6,
  
  // Capture Settings
  STABLE_COUNTDOWN_MS: 800,
  
  // Mirror Settings
  MIRROR_PREVIEW: true,
  MIRROR_CAPTURE: false,
  
  // Auto-Capture Settings
  AUTO_CAPTURE_DELAY_MS: 2000,
  REQUIRE_FACE_FOR_CAPTURE: true,
  
  // Manual Capture Settings
  TARGET_SAMPLES_PER_CLASS: 80,
  BURST_FRAMES: 5,
  BURST_SPACING_MS: 60,
  
  // Quality Thresholds
  QUALITY_THRESHOLDS: {
    BLUR_MIN: 100,
    BRIGHTNESS_MIN: 50,
    BRIGHTNESS_MAX: 200,
    MOTION_MAX: 30,
  },
  
  // Feature Flags
  FEATURE_FLAGS: {
    ENABLE_ROI_ASSIST: true,
    ENABLE_AUTO_CAPTURE: false, // Default to manual
  },
  
  // Dataset Export
  DATASET_SPLIT: {
    TRAIN: 0.7,
    VAL: 0.15,
    TEST: 0.15,
  },
};

// Target Progress Ring Configuration
export const TARGET = {
  SAMPLES_PER_CLASS: 80,
  RING_COLORS: { 
    base: "brand", 
    warn: "accent", 
    done: "green-500" 
  },
  WARN_THRESHOLD: 0.75, // color switches when >= 75% of target
};

// Export Configuration
export const EXPORT = {
  SPLIT: { train: 0.70, val: 0.15, test: 0.15 },
  SEED_DEFAULT: "handmat-2025",
};

// Recognition Feed Configuration
export const FEED = {
  ENABLE_THUMBS: true,
  THUMB_SIZE: 84,           // px
  MAX_ITEMS: 200,           // trim oldest beyond this
  VIRTUALIZE: true,         // use windowed list for performance
  SHOW_CONFIDENCE: true
};

// Detection Configuration
export const DETECT = {
  POLL_MS: 100,
  SCORE: { 
    FACE: 0.9, 
    HAND: 0.85 
  },
  MOVE_PX_MAX: 10,
  STABILITY_MS: 300,
  AUTO_CAPTURE_DELAY_MS: 2000,
  COOLDOWN_MS: 1500,
  REQUIRE_FACE_FOR_CAPTURE: true,
  DETECTION_WIDTH: 320, // Downscaled width for performance
};

// Mirror Configuration
export const MIRROR = { 
  PREVIEW: true, 
  CAPTURE: false 
};

// Local Storage Keys
export const STORAGE_KEYS = {
  MIRROR_PREVIEW: 'handmat_mirror_preview',
  MIRROR_CAPTURE: 'handmat_mirror_capture',
  STABILITY_MS: 'handmat_stability_ms',
  COOLDOWN_MS: 'handmat_cooldown_ms',
  AUTO_CAPTURE_DELAY_MS: 'handmat_auto_capture_delay',
  REQUIRE_FACE: 'handmat_require_face',
} as const;

// Face Detection States
export enum FaceDetectionState {
  SEARCHING = 'SEARCHING',
  TRACKING = 'TRACKING', 
  STABLE = 'STABLE',
  CAPTURE = 'CAPTURE',
  COOLDOWN = 'COOLDOWN'
}

// Unified Detection States
export enum DetectionState {
  SEARCHING = 'SEARCHING',
  LOCK_FACE = 'LOCK_FACE',
  LOCK_HAND = 'LOCK_HAND', 
  LOCK_BOTH = 'LOCK_BOTH',
  STABLE = 'STABLE',
  COUNTDOWN = 'COUNTDOWN',
  CAPTURE = 'CAPTURE',
  COOLDOWN = 'COOLDOWN'
}

// Detection Types
export interface DetectionBox {
  x: number;
  y: number;
  w: number;
  h: number;
  score: number;
}

export interface HandDetection {
  box: DetectionBox;
  landmarks: Array<{ x: number; y: number; z?: number }>;
  handedness: 'Left' | 'Right';
}

export interface FaceDetection {
  box: DetectionBox;
  score: number;
}

export interface UnifiedDetection {
  face: FaceDetection | null;
  hand: HandDetection | null;
  state: DetectionState;
  stableStartTime: number;
  countdownStartTime: number;
  lastCaptureTime: number;
}

export interface ROI {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type FaceDetectionConfig = {
  stabilityMs: number;
  cooldownMs: number;
  scoreThreshold: number;
  pollMs: number;
  movementThreshold: number;
};