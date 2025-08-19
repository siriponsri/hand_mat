import { FilesetResolver, HandLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';

// Types for hand detection
export interface DetectionBox {
  x: number;
  y: number;
  w: number;
  h: number;
  score: number;
}

export interface HandDetection {
  box: DetectionBox;
  landmarks: Array<{
    x: number;
    y: number;
    z: number;
  }>;
  handedness: 'Left' | 'Right';
}

export class HandDetectionService {
  private handLandmarker: HandLandmarker | null = null;
  private isInitialized = false;
  private isInitializing = false;

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;
    if (this.isInitializing) return false;

    this.isInitializing = true;
    
    try {
      console.log('Initializing MediaPipe Hand Detection...');
      
      // Add timeout for initialization
      const initPromise = this.initializeWithTimeout();
      const result = await Promise.race([
        initPromise,
        new Promise<boolean>((_, reject) => 
          setTimeout(() => reject(new Error('Initialization timeout')), 30000)
        )
      ]);
      
      return result;
    } catch (error) {
      console.error('Hand detection initialization failed:', error);
      this.isInitialized = false;
      return false;
    } finally {
      this.isInitializing = false;
    }
  }

  private async initializeWithTimeout(): Promise<boolean> {
    try {
      // Initialize MediaPipe with error handling
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      const commonOptions = {
        runningMode: "VIDEO" as const,
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.3,
        minTrackingConfidence: 0.3
      };

      try {
        // Try with GPU delegate first
        this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          ...commonOptions
        });
        console.log('Hand detection initialized with GPU acceleration');
      } catch (gpuError) {
        console.warn('GPU initialization failed, trying CPU fallback:', gpuError);
        
        // Fallback to CPU
        this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "CPU"
          },
          ...commonOptions
        });
        console.log('Hand detection initialized with CPU fallback');
      }

      this.isInitialized = true;
      console.log('Hand detection initialized successfully');
      return true;
    } catch (error) {
      console.warn('Hand detection initialization failed:', error);
      this.isInitialized = false;
      return false;
    } finally {
      this.isInitializing = false;
    }
  }

  detectHands(
    video: HTMLVideoElement,
    timestamp: number
  ): HandDetection[] {
    if (!this.handLandmarker || !this.isInitialized) {
      return [];
    }

    try {
      // Check video readiness
      if (!video || video.readyState < 2) {
        return [];
      }

      const results = this.handLandmarker.detectForVideo(video, timestamp);
      
      if (!results.landmarks || !results.worldLandmarks || !results.handednesses) {
        return [];
      }

      const detections: HandDetection[] = [];

      for (let i = 0; i < results.landmarks.length; i++) {
        const landmarks = results.landmarks[i];
        const handedness = results.handednesses[i][0];
        
        if (!landmarks || landmarks.length === 0) continue;

        // Calculate bounding box from landmarks with safety checks
        try {
          const xs = landmarks.map(l => l.x * video.videoWidth);
          const ys = landmarks.map(l => l.y * video.videoHeight);
          
          const minX = Math.min(...xs);
          const maxX = Math.max(...xs);
          const minY = Math.min(...ys);
          const maxY = Math.max(...ys);
          
          const box: DetectionBox = {
            x: minX,
            y: minY,
            w: maxX - minX,
            h: maxY - minY,
            score: handedness.score
          };

          detections.push({
            box,
            landmarks: landmarks.map(l => ({
              x: l.x * video.videoWidth,
              y: l.y * video.videoHeight,
              z: l.z
            })),
            handedness: handedness.displayName as 'Left' | 'Right'
          });
        } catch (landmarkError) {
          console.warn('Error processing landmark:', landmarkError);
          continue;
        }
      }

      return detections;
    } catch (error) {
      console.warn('Hand detection failed:', error);
      return [];
    }
  }

  selectPrimaryHand(detections: HandDetection[]): HandDetection | null {
    if (detections.length === 0) return null;
    
    // Select hand with largest bbox area
    return detections.reduce((largest, current) => {
      const currentArea = current.box.w * current.box.h;
      const largestArea = largest.box.w * largest.box.h;
      return currentArea > largestArea ? current : largest;
    });
  }

  isHandStable(
    current: HandDetection | null,
    previous: HandDetection | null,
    threshold: number = 10
  ): boolean {
    if (!current || !previous) return false;
    
    const dx = Math.abs(current.box.x - previous.box.x);
    const dy = Math.abs(current.box.y - previous.box.y);
    
    return dx < threshold && dy < threshold;
  }

  cleanup() {
    if (this.handLandmarker) {
      this.handLandmarker.close();
      this.handLandmarker = null;
    }
    this.isInitialized = false;
  }
}