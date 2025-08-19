import { DetectionState, UnifiedDetection, HandDetection, FaceDetection, DETECT } from '@/config';
import { HandDetectionService } from './handDetection';
import { FaceDetectionService } from './faceDetection';

export class UnifiedDetectionService {
  private handService = new HandDetectionService();
  private faceService = new FaceDetectionService();
  private detection: UnifiedDetection = {
    face: null,
    hand: null,
    state: DetectionState.SEARCHING,
    stableStartTime: 0,
    countdownStartTime: 0,
    lastCaptureTime: 0
  };
  private lastDetection: UnifiedDetection | null = null;
  
  async initialize(): Promise<{ hand: boolean; face: boolean }> {
    const [handInit, faceInit] = await Promise.all([
      this.handService.initialize(),
      this.faceService.initialize()
    ]);
    
    return { hand: handInit, face: faceInit };
  }

  async detect(video: HTMLVideoElement, timestamp: number): Promise<UnifiedDetection> {
    const now = performance.now();
    
    // Detect hands and faces
    const hands = this.handService.detectHands(video, timestamp);
    const faceResult = await this.faceService.detectFaces(video);
    const faces = faceResult.success ? faceResult.detections : [];
    
    // Select primary detections
    const primaryHand = this.handService.selectPrimaryHand(hands);
    const primaryFace = this.selectPrimaryFace(faces);
    
    // Update detection state
    this.updateDetectionState(primaryHand, primaryFace, now);
    
    return { ...this.detection };
  }

  private selectPrimaryFace(faces: any[]): FaceDetection | null {
    if (!faces || faces.length === 0) return null;
    
    // Select face with highest score
    const bestFace = faces.reduce((best, current) => 
      current.score > best.score ? current : best
    );
    
    return {
      box: {
        x: bestFace.box.x,
        y: bestFace.box.y,
        w: bestFace.box.width,
        h: bestFace.box.height,
        score: bestFace.score
      },
      score: bestFace.score
    };
  }

  private updateDetectionState(
    hand: HandDetection | null,
    face: FaceDetection | null,
    timestamp: number
  ) {
    const prev = this.lastDetection;
    
    // Update current detections
    this.detection.face = face;
    this.detection.hand = hand;
    
    // Check if we meet detection thresholds
    const hasValidFace = face && face.score >= DETECT.SCORE.FACE;
    const hasValidHand = hand && hand.box.score >= DETECT.SCORE.HAND;
    const requireFace = DETECT.REQUIRE_FACE_FOR_CAPTURE;
    
    switch (this.detection.state) {
      case DetectionState.SEARCHING:
        if (hasValidFace && !hasValidHand) {
          this.detection.state = DetectionState.LOCK_FACE;
        } else if (!hasValidFace && hasValidHand) {
          this.detection.state = DetectionState.LOCK_HAND;
        } else if (hasValidFace && hasValidHand) {
          this.detection.state = DetectionState.LOCK_BOTH;
        }
        break;
        
      case DetectionState.LOCK_FACE:
        if (hasValidHand) {
          this.detection.state = DetectionState.LOCK_BOTH;
        } else if (!hasValidFace) {
          this.detection.state = DetectionState.SEARCHING;
        }
        break;
        
      case DetectionState.LOCK_HAND:
        if (hasValidFace) {
          this.detection.state = DetectionState.LOCK_BOTH;
        } else if (!hasValidHand) {
          this.detection.state = DetectionState.SEARCHING;
        } else if (!requireFace) {
          // Allow hand-only capture if face not required
          if (this.isStable(hand, face, prev?.hand, prev?.face)) {
            if (this.detection.stableStartTime === 0) {
              this.detection.stableStartTime = timestamp;
            } else if (timestamp - this.detection.stableStartTime >= DETECT.STABILITY_MS) {
              this.detection.state = DetectionState.STABLE;
            }
          } else {
            this.detection.stableStartTime = 0;
          }
        }
        break;
        
      case DetectionState.LOCK_BOTH:
        const validDetections = requireFace ? (hasValidFace && hasValidHand) : hasValidHand;
        
        if (!validDetections) {
          this.detection.state = DetectionState.SEARCHING;
          this.detection.stableStartTime = 0;
        } else if (this.isStable(hand, face, prev?.hand, prev?.face)) {
          if (this.detection.stableStartTime === 0) {
            this.detection.stableStartTime = timestamp;
          } else if (timestamp - this.detection.stableStartTime >= DETECT.STABILITY_MS) {
            this.detection.state = DetectionState.STABLE;
          }
        } else {
          this.detection.stableStartTime = 0;
        }
        break;
        
      case DetectionState.STABLE:
        const stillValid = requireFace ? (hasValidFace && hasValidHand) : hasValidHand;
        
        if (!stillValid || !this.isStable(hand, face, prev?.hand, prev?.face)) {
          this.detection.state = DetectionState.LOCK_BOTH;
          this.detection.stableStartTime = 0;
          this.detection.countdownStartTime = 0;
        } else {
          if (this.detection.countdownStartTime === 0) {
            this.detection.countdownStartTime = timestamp;
          } else if (timestamp - this.detection.countdownStartTime >= DETECT.AUTO_CAPTURE_DELAY_MS) {
            this.detection.state = DetectionState.CAPTURE;
            this.detection.lastCaptureTime = timestamp;
          }
        }
        break;
        
      case DetectionState.CAPTURE:
        this.detection.state = DetectionState.COOLDOWN;
        this.detection.stableStartTime = 0;
        this.detection.countdownStartTime = 0;
        break;
        
      case DetectionState.COOLDOWN:
        if (timestamp - this.detection.lastCaptureTime >= DETECT.COOLDOWN_MS) {
          this.detection.state = DetectionState.SEARCHING;
        }
        break;
    }
    
    this.lastDetection = { ...this.detection };
  }

  private isStable(
    currentHand: HandDetection | null,
    currentFace: FaceDetection | null,
    prevHand: HandDetection | null,
    prevFace: FaceDetection | null
  ): boolean {
    const handStable = !currentHand || !prevHand || 
      this.handService.isHandStable(currentHand, prevHand, DETECT.MOVE_PX_MAX);
    
    const faceStable = !currentFace || !prevFace ||
      this.isBoxStable(currentFace.box, prevFace.box, DETECT.MOVE_PX_MAX);
    
    return handStable && faceStable;
  }

  private isBoxStable(current: any, previous: any, threshold: number): boolean {
    const dx = Math.abs(current.x - previous.x);
    const dy = Math.abs(current.y - previous.y);
    return dx < threshold && dy < threshold;
  }

  getCountdownProgress(): number {
    if (this.detection.state !== DetectionState.STABLE || this.detection.countdownStartTime === 0) {
      return 0;
    }
    
    const elapsed = performance.now() - this.detection.countdownStartTime;
    return Math.min(elapsed / DETECT.AUTO_CAPTURE_DELAY_MS, 1);
  }

  shouldCapture(): boolean {
    return this.detection.state === DetectionState.CAPTURE;
  }

  reset() {
    this.detection = {
      face: null,
      hand: null,
      state: DetectionState.SEARCHING,
      stableStartTime: 0,
      countdownStartTime: 0,
      lastCaptureTime: 0
    };
    this.lastDetection = null;
  }

  cleanup() {
    this.handService.cleanup();
    this.faceService.cleanup();
  }
}