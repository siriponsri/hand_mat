// Integrated real-time detection service combining face and hand detection
import { faceDetectionService, FaceDetectionResult } from './faceDetection';
import { handDetectionService, HandDetectionResult } from './handDetection';
import { realTimeAPI, RealTimeRecognitionResult } from './api';

export interface IntegratedDetectionResult {
  face: FaceDetectionResult;
  hand: HandDetectionResult;
  recognition: RealTimeRecognitionResult | null;
  timestamp: number;
  frameData?: {
    width: number;
    height: number;
    canvas?: HTMLCanvasElement;
  };
}

export interface DetectionConfig {
  enableFaceDetection: boolean;
  enableHandDetection: boolean;
  enableRecognition: boolean;
  recognitionMode: 'hand_only' | 'face_only' | 'combined';
  confidence_threshold: number;
  fps_limit: number;
}

export class IntegratedDetectionService {
  private isInitialized = false;
  private isRunning = false;
  private config: DetectionConfig;
  private lastProcessTime = 0;
  private frameInterval: number;

  constructor(config: Partial<DetectionConfig> = {}) {
    this.config = {
      enableFaceDetection: true,
      enableHandDetection: true,
      enableRecognition: true,
      recognitionMode: 'combined',
      confidence_threshold: 0.5,
      fps_limit: 10, // Process 10 frames per second max
      ...config
    };
    this.frameInterval = 1000 / this.config.fps_limit;
  }

  async initialize(): Promise<{ face: boolean; hand: boolean }> {
    if (this.isInitialized) {
      return {
        face: true,
        hand: true
      };
    }

    console.log('Initializing integrated detection service...');

    const initResults = await Promise.allSettled([
      this.config.enableFaceDetection ? faceDetectionService.initialize() : Promise.resolve(false),
      this.config.enableHandDetection ? handDetectionService.initialize() : Promise.resolve(false)
    ]);

    const faceInitialized = initResults[0].status === 'fulfilled' ? initResults[0].value : false;
    const handInitialized = initResults[1].status === 'fulfilled' ? initResults[1].value : false;

    this.isInitialized = faceInitialized || handInitialized;

    console.log('Integrated detection initialized:', {
      face: faceInitialized,
      hand: handInitialized,
      overall: this.isInitialized
    });

    return {
      face: faceInitialized,
      hand: handInitialized
    };
  }

  async processFrame(videoElement: HTMLVideoElement): Promise<IntegratedDetectionResult> {
    const now = Date.now();
    
    // Throttle processing based on FPS limit
    if (now - this.lastProcessTime < this.frameInterval) {
      // Return cached result or null result
      return this.createEmptyResult(now);
    }

    this.lastProcessTime = now;

    if (!this.isInitialized) {
      throw new Error('Detection service not initialized');
    }

    // Run face and hand detection in parallel
    const [faceResult, handResult] = await Promise.allSettled([
      this.config.enableFaceDetection ? 
        faceDetectionService.detectFaces(videoElement) : 
        Promise.resolve({ detections: [], success: false }),
      this.config.enableHandDetection ? 
        handDetectionService.detectHands(videoElement) : 
        Promise.resolve({ detections: [], success: false })
    ]);

    const face: FaceDetectionResult = faceResult.status === 'fulfilled' ? 
      faceResult.value : { detections: [], success: false, error: 'Face detection failed' };
    
    const hand: HandDetectionResult = handResult.status === 'fulfilled' ? 
      handResult.value : { detections: [], success: false, error: 'Hand detection failed' };

    // Prepare frame data
    const frameData = {
      width: videoElement.videoWidth,
      height: videoElement.videoHeight
    };

    return {
      face,
      hand,
      recognition: null, // Will be populated by separate recognition call
      timestamp: now,
      frameData
    };
  }

  async recognizeFromFrame(videoElement: HTMLVideoElement): Promise<RealTimeRecognitionResult> {
    if (!this.config.enableRecognition) {
      return this.createEmptyRecognitionResult();
    }

    try {
      // Capture frame as blob for API recognition
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      ctx.drawImage(videoElement, 0, 0);

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob!);
        }, 'image/jpeg', 0.8);
      });

      // Call appropriate recognition API based on mode
      switch (this.config.recognitionMode) {
        case 'hand_only':
          return await realTimeAPI.recognizeHand(blob);
        case 'face_only':
          return await realTimeAPI.analyzeFace(blob);
        case 'combined':
        default:
          return await realTimeAPI.recognizeCombined(blob);
      }

    } catch (error) {
      console.error('Recognition error:', error);
      return this.createEmptyRecognitionResult();
    }
  }

  async processFrameWithRecognition(videoElement: HTMLVideoElement): Promise<IntegratedDetectionResult> {
    // Get detection results
    const detectionResult = await this.processFrame(videoElement);

    // Add recognition if enabled and conditions are met
    if (this.config.enableRecognition && this.shouldTriggerRecognition(detectionResult)) {
      try {
        detectionResult.recognition = await this.recognizeFromFrame(videoElement);
      } catch (error) {
        console.error('Recognition failed:', error);
        detectionResult.recognition = this.createEmptyRecognitionResult();
      }
    }

    return detectionResult;
  }

  private shouldTriggerRecognition(result: IntegratedDetectionResult): boolean {
    // Trigger recognition based on detection confidence and settings
    const hasFaceDetection = result.face.success && result.face.detections.length > 0;
    const hasHandDetection = result.hand.success && result.hand.detections.length > 0;

    switch (this.config.recognitionMode) {
      case 'face_only':
        return hasFaceDetection;
      case 'hand_only':
        return hasHandDetection;
      case 'combined':
      default:
        return hasFaceDetection || hasHandDetection;
    }
  }

  private createEmptyResult(timestamp: number): IntegratedDetectionResult {
    return {
      face: { detections: [], success: false },
      hand: { detections: [], success: false },
      recognition: null,
      timestamp
    };
  }

  private createEmptyRecognitionResult(): RealTimeRecognitionResult {
    return {
      top1_word: 'No detection',
      top3_words: [],
      top3_confidences: [],
      timestamp: Date.now()
    };
  }

  // Configuration methods
  updateConfig(newConfig: Partial<DetectionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.frameInterval = 1000 / this.config.fps_limit;
  }

  getConfig(): DetectionConfig {
    return { ...this.config };
  }

  // Service status
  isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  isServiceRunning(): boolean {
    return this.isRunning;
  }

  start(): void {
    this.isRunning = true;
  }

  stop(): void {
    this.isRunning = false;
  }

  cleanup(): void {
    this.stop();
    faceDetectionService.cleanup();
    handDetectionService.cleanup();
    this.isInitialized = false;
  }
}

// Export singleton instance with default config
export const integratedDetectionService = new IntegratedDetectionService();
