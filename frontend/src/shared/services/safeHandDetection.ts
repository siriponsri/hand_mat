import { HandDetectionService } from './handDetection';

export class SafeHandDetectionService {
  private handDetection: HandDetectionService | null = null;
  private isInitialized = false;
  private initializationFailed = false;

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;
    if (this.initializationFailed) return false;

    try {
      console.log('Initializing safe hand detection...');
      
      // Try to initialize with timeout
      const timeoutPromise = new Promise<boolean>((_, reject) => 
        setTimeout(() => reject(new Error('Initialization timeout')), 15000)
      );

      const initPromise = this.tryInitialize();
      
      const success = await Promise.race([initPromise, timeoutPromise]);
      
      if (success) {
        this.isInitialized = true;
        console.log('✅ Safe hand detection initialized successfully');
      } else {
        this.initializationFailed = true;
        console.warn('⚠️ Safe hand detection initialization failed');
      }
      
      return success;
    } catch (error) {
      console.error('❌ Safe hand detection error:', error);
      this.initializationFailed = true;
      return false;
    }
  }

  private async tryInitialize(): Promise<boolean> {
    try {
      this.handDetection = new HandDetectionService();
      return await this.handDetection.initialize();
    } catch (error) {
      console.warn('MediaPipe initialization failed, will use manual mode:', error);
      return false;
    }
  }

  detectHands(video: HTMLVideoElement, timestamp: number) {
    if (!this.isInitialized || !this.handDetection) {
      return [];
    }

    try {
      return this.handDetection.detectHands(video, timestamp);
    } catch (error) {
      console.warn('Hand detection error, continuing without detection:', error);
      return [];
    }
  }

  selectPrimaryHand(detections: any[]) {
    if (!this.handDetection) return null;
    try {
      return this.handDetection.selectPrimaryHand(detections);
    } catch (error) {
      console.warn('Primary hand selection error:', error);
      return detections.length > 0 ? detections[0] : null;
    }
  }

  isHandStable(current: any, previous: any, threshold = 10) {
    if (!this.handDetection) return false;
    try {
      return this.handDetection.isHandStable(current, previous, threshold);
    } catch (error) {
      console.warn('Hand stability check error:', error);
      return false;
    }
  }

  cleanup() {
    try {
      if (this.handDetection) {
        this.handDetection.cleanup();
      }
    } catch (error) {
      console.warn('Cleanup error:', error);
    }
    this.isInitialized = false;
    this.initializationFailed = false;
  }

  get status() {
    return {
      initialized: this.isInitialized,
      failed: this.initializationFailed,
      available: this.isInitialized && !this.initializationFailed
    };
  }
}
