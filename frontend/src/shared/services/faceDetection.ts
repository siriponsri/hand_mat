import * as faceapi from 'face-api.js';

export interface FaceDetection {
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  score: number;
}

export interface FaceDetectionResult {
  detections: FaceDetection[];
  success: boolean;
  error?: string;
}

export class FaceDetectionService {
  private isInitialized = false;
  private isInitializing = false;
  private detectionModel: 'face-api' | 'mediapipe' | null = null;

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;
    if (this.isInitializing) {
      // Wait for initialization to complete
      while (this.isInitializing) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.isInitialized;
    }

    this.isInitializing = true;

    try {
      // Try face-api.js first
      await this.initializeFaceAPI();
      this.detectionModel = 'face-api';
      this.isInitialized = true;
      console.log('Face detection initialized with face-api.js');
    } catch (error) {
      console.warn('face-api.js failed, trying MediaPipe fallback:', error);
      try {
        await this.initializeMediaPipe();
        this.detectionModel = 'mediapipe';
        this.isInitialized = true;
        console.log('Face detection initialized with MediaPipe');
      } catch (mpError) {
        console.error('Both face detection methods failed:', mpError);
        this.isInitialized = false;
      }
    }

    this.isInitializing = false;
    return this.isInitialized;
  }

  private async initializeFaceAPI(): Promise<void> {
    // Load models from a CDN
    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@latest/model/';
    
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    
    // Warm up the model
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 120;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 160, 120);
    
    await faceapi.detectAllFaces(canvas, new faceapi.TinyFaceDetectorOptions());
  }

  private async initializeMediaPipe(): Promise<void> {
    // MediaPipe fallback - simplified implementation
    // In a real implementation, you would load and initialize MediaPipe
    throw new Error('MediaPipe fallback not implemented yet');
  }

  async detectFaces(videoElement: HTMLVideoElement): Promise<FaceDetectionResult> {
    if (!this.isInitialized) {
      return {
        detections: [],
        success: false,
        error: 'Face detection not initialized'
      };
    }

    try {
      if (this.detectionModel === 'face-api') {
        return await this.detectWithFaceAPI(videoElement);
      } else if (this.detectionModel === 'mediapipe') {
        return await this.detectWithMediaPipe(videoElement);
      }
    } catch (error) {
      console.error('Face detection error:', error);
      return {
        detections: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown detection error'
      };
    }

    return {
      detections: [],
      success: false,
      error: 'No detection model available'
    };
  }

  private async detectWithFaceAPI(videoElement: HTMLVideoElement): Promise<FaceDetectionResult> {
    const detections = await faceapi.detectAllFaces(
      videoElement, 
      new faceapi.TinyFaceDetectorOptions({
        inputSize: 160,
        scoreThreshold: 0.5
      })
    );

    const faceDetections: FaceDetection[] = detections.map(detection => ({
      box: {
        x: detection.box.x,
        y: detection.box.y,
        width: detection.box.width,
        height: detection.box.height
      },
      score: detection.score
    }));

    return {
      detections: faceDetections,
      success: true
    };
  }

  private async detectWithMediaPipe(videoElement: HTMLVideoElement): Promise<FaceDetectionResult> {
    // Placeholder for MediaPipe implementation
    return {
      detections: [],
      success: false,
      error: 'MediaPipe not implemented'
    };
  }

  cleanup() {
    this.isInitialized = false;
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  getModel(): string | null {
    return this.detectionModel;
  }
}

export const faceDetectionService = new FaceDetectionService();