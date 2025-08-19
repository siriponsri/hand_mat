import { FaceDetectionState, CONFIG } from '@/config';
import { FaceDetection } from '@/services/faceDetection';

export interface FaceStateMachineState {
  currentState: FaceDetectionState;
  lastDetection: FaceDetection | null;
  stateStartTime: number;
  lastStableTime: number;
  captureProgress: number;
  isInROI: boolean;
  isStable: boolean;
}

export interface ROI {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class FaceStateMachine {
  private state: FaceStateMachineState;
  private roi: ROI;
  private videoWidth: number;
  private videoHeight: number;
  private config: {
    stabilityMs: number;
    cooldownMs: number;
    scoreThreshold: number;
    movementThreshold: number;
    captureCountdownMs: number;
  };

  constructor(
    videoWidth: number, 
    videoHeight: number,
    configOverrides?: {
      stabilityMs?: number;
      cooldownMs?: number;
      scoreThreshold?: number;
      movementThreshold?: number;
    }
  ) {
    this.videoWidth = videoWidth;
    this.videoHeight = videoHeight;
    this.config = {
      stabilityMs: configOverrides?.stabilityMs ?? CONFIG.STABILITY_MS,
      cooldownMs: configOverrides?.cooldownMs ?? CONFIG.COOLDOWN_MS,
      scoreThreshold: configOverrides?.scoreThreshold ?? CONFIG.SCORE_THRESHOLD,
      movementThreshold: configOverrides?.movementThreshold ?? CONFIG.MOVEMENT_THRESHOLD_PX,
      captureCountdownMs: CONFIG.STABLE_COUNTDOWN_MS,
    };

    this.roi = this.calculateROI();
    this.state = this.getInitialState();
  }

  private calculateROI(): ROI {
    const roiWidth = this.videoWidth * CONFIG.ROI_WIDTH_PERCENT;
    const roiHeight = this.videoHeight * CONFIG.ROI_HEIGHT_PERCENT;
    
    return {
      x: (this.videoWidth - roiWidth) / 2,
      y: (this.videoHeight - roiHeight) / 2,
      width: roiWidth,
      height: roiHeight,
    };
  }

  private getInitialState(): FaceStateMachineState {
    return {
      currentState: FaceDetectionState.SEARCHING,
      lastDetection: null,
      stateStartTime: Date.now(),
      lastStableTime: 0,
      captureProgress: 0,
      isInROI: false,
      isStable: false,
    };
  }

  update(detections: FaceDetection[]): { 
    shouldCapture: boolean; 
    state: FaceStateMachineState;
    roi: ROI;
  } {
    const now = Date.now();
    const bestDetection = this.getBestDetection(detections);
    
    // Check if face is in ROI
    const isInROI = bestDetection ? this.isDetectionInROI(bestDetection) : false;
    
    // Check if detection meets score threshold
    const meetsThreshold = bestDetection ? bestDetection.score >= this.config.scoreThreshold : false;
    
    // Check stability (movement between frames)
    const isStable = this.isDetectionStable(bestDetection);

    let newState = this.state.currentState;
    let shouldCapture = false;
    let captureProgress = this.state.captureProgress;

    switch (this.state.currentState) {
      case FaceDetectionState.SEARCHING:
        if (bestDetection && meetsThreshold) {
          newState = FaceDetectionState.TRACKING;
        }
        break;

      case FaceDetectionState.TRACKING:
        if (!bestDetection || !meetsThreshold) {
          newState = FaceDetectionState.SEARCHING;
        } else if (isInROI && isStable) {
          newState = FaceDetectionState.STABLE;
        }
        break;

      case FaceDetectionState.STABLE:
        if (!bestDetection || !meetsThreshold || !isInROI || !isStable) {
          newState = FaceDetectionState.TRACKING;
          captureProgress = 0;
        } else {
          // Update capture progress
          const timeInStable = now - this.state.stateStartTime;
          captureProgress = Math.min(timeInStable / this.config.captureCountdownMs, 1);
          
          if (captureProgress >= 1) {
            newState = FaceDetectionState.CAPTURE;
            shouldCapture = true;
            captureProgress = 1;
          }
        }
        break;

      case FaceDetectionState.CAPTURE:
        newState = FaceDetectionState.COOLDOWN;
        captureProgress = 0;
        break;

      case FaceDetectionState.COOLDOWN:
        const cooldownElapsed = now - this.state.stateStartTime;
        if (cooldownElapsed >= this.config.cooldownMs) {
          newState = bestDetection && meetsThreshold 
            ? FaceDetectionState.TRACKING 
            : FaceDetectionState.SEARCHING;
        }
        break;
    }

    // Update state if changed
    if (newState !== this.state.currentState) {
      this.state.stateStartTime = now;
    }

    // Update stable time tracking
    if (isStable && isInROI && meetsThreshold) {
      if (this.state.lastStableTime === 0) {
        this.state.lastStableTime = now;
      }
    } else {
      this.state.lastStableTime = 0;
    }

    this.state = {
      currentState: newState,
      lastDetection: bestDetection,
      stateStartTime: this.state.stateStartTime,
      lastStableTime: this.state.lastStableTime,
      captureProgress,
      isInROI,
      isStable,
    };

    return {
      shouldCapture,
      state: this.state,
      roi: this.roi,
    };
  }

  private getBestDetection(detections: FaceDetection[]): FaceDetection | null {
    if (detections.length === 0) return null;
    
    // Return the detection with highest score
    return detections.reduce((best, current) => 
      current.score > best.score ? current : best
    );
  }

  private isDetectionInROI(detection: FaceDetection): boolean {
    const { box } = detection;
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    
    return (
      centerX >= this.roi.x &&
      centerX <= this.roi.x + this.roi.width &&
      centerY >= this.roi.y &&
      centerY <= this.roi.y + this.roi.height
    );
  }

  private isDetectionStable(detection: FaceDetection | null): boolean {
    if (!detection || !this.state.lastDetection) return false;
    
    const movement = Math.sqrt(
      Math.pow(detection.box.x - this.state.lastDetection.box.x, 2) +
      Math.pow(detection.box.y - this.state.lastDetection.box.y, 2)
    );
    
    return movement < this.config.movementThreshold;
  }

  reset(): void {
    this.state = this.getInitialState();
  }

  getState(): FaceStateMachineState {
    return { ...this.state };
  }

  getROI(): ROI {
    return { ...this.roi };
  }
}