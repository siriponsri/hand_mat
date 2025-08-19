import * as faceapi from 'face-api.js';

export interface FaceDetection {
  box: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  score: number;
  landmarks?: faceapi.FaceLandmarks68;
  expressions?: faceapi.FaceExpressions;
}

export interface FaceDetectionResult {
  detections: FaceDetection[];
  success: boolean;
  error?: string;
}

export class FaceDetectionService {
  private isInitialized = false;
  private isInitializing = false;
  private modelsPath = '/models'; // Models should be in public/models/

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
      console.log('Loading face-api.js models...');
      
      // Load required models for face detection and expression recognition
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(this.modelsPath),
        faceapi.nets.faceExpressionNet.loadFromUri(this.modelsPath),
        faceapi.nets.faceLandmark68Net.loadFromUri(this.modelsPath),
      ]);
      
      // Warm up the models with a test detection
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 320, 240);
      
      await faceapi.detectAllFaces(canvas, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();
      
      this.isInitialized = true;
      console.log('Face-api.js models loaded successfully');
      
    } catch (error) {
      console.error('Failed to initialize face detection:', error);
      this.isInitialized = false;
    }

    this.isInitializing = false;
    return this.isInitialized;
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
      const detections = await faceapi
        .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      const faceDetections: FaceDetection[] = detections.map(detection => ({
        box: {
          x: detection.detection.box.x,
          y: detection.detection.box.y,
          w: detection.detection.box.width,
          h: detection.detection.box.height,
        },
        score: detection.detection.score,
        landmarks: detection.landmarks,
        expressions: detection.expressions,
      }));

      return {
        detections: faceDetections,
        success: true,
      };

    } catch (error) {
      console.error('Face detection error:', error);
      return {
        detections: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get dominant emotion from face expressions
  getDominantEmotion(expressions: faceapi.FaceExpressions): string {
    if (!expressions) return 'neutral';
    
    const emotions = Object.entries(expressions) as [string, number][];
    const dominant = emotions.reduce((prev, current) => 
      prev[1] > current[1] ? prev : current
    );
    
    return dominant[0];
  }

  cleanup(): void {
    this.isInitialized = false;
    this.isInitializing = false;
  }
}

// Export singleton instance
export const faceDetectionService = new FaceDetectionService();
