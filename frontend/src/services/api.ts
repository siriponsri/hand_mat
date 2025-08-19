// Real-time API service for backend integration
import { API_CONFIG } from '../shared/services/api';

export interface RealTimeRecognitionResult {
  top1_word: string;
  top3_words: string[];
  top3_confidences: number[];
  emotion?: string;
  expression?: string;
  face_detected?: boolean;
  timestamp: number;
}

export interface HealthCheckResult {
  status: string;
  models: {
    hand: boolean;
    face: boolean;
  };
  uptime: number;
}

export interface ComposeRequest {
  words: string[];
  tone?: 'neutral' | 'polite' | 'urgent' | 'grateful';
  emotion?: string;
}

export interface ComposeResult {
  sentence: string;
  confidence: number;
}

class RealTimeAPIService {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl = API_CONFIG.baseUrl, timeout = API_CONFIG.timeout) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  // Health check endpoint
  async checkHealth(): Promise<HealthCheckResult> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        status: 'error',
        models: { hand: false, face: false },
        uptime: 0
      };
    }
  }

  // Hand sign recognition
  async recognizeHand(imageBlob: Blob): Promise<RealTimeRecognitionResult> {
    try {
      const formData = new FormData();
      formData.append('file', imageBlob, 'hand_capture.jpg');

      const response = await fetch(`${this.baseUrl}/api/recognize`, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        throw new Error(`Hand recognition failed: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        top1_word: data.top1_word || 'Unknown',
        top3_words: data.top3 || ['Unknown'],
        top3_confidences: data.top3_confidences || [0],
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Hand recognition error:', error);
      return {
        top1_word: 'Error',
        top3_words: ['Error'],
        top3_confidences: [0],
        timestamp: Date.now(),
      };
    }
  }

  // Face emotion analysis
  async analyzeFace(imageBlob: Blob): Promise<RealTimeRecognitionResult> {
    try {
      const formData = new FormData();
      formData.append('file', imageBlob, 'face_capture.jpg');

      const response = await fetch(`${this.baseUrl}/api/face-analysis`, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        throw new Error(`Face analysis failed: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        top1_word: '',
        top3_words: [],
        top3_confidences: [],
        emotion: data.expression || 'neutral',
        expression: data.expression || 'neutral',
        face_detected: data.face_detected ?? true,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Face analysis error:', error);
      return {
        top1_word: '',
        top3_words: [],
        top3_confidences: [],
        emotion: 'neutral',
        expression: 'neutral',
        face_detected: false,
        timestamp: Date.now(),
      };
    }
  }

  // Combined recognition (hand + face)
  async recognizeCombined(imageBlob: Blob): Promise<RealTimeRecognitionResult> {
    try {
      const [handResult, faceResult] = await Promise.allSettled([
        this.recognizeHand(imageBlob),
        this.analyzeFace(imageBlob),
      ]);

      const handData = handResult.status === 'fulfilled' ? handResult.value : null;
      const faceData = faceResult.status === 'fulfilled' ? faceResult.value : null;

      return {
        top1_word: handData?.top1_word || 'Unknown',
        top3_words: handData?.top3_words || ['Unknown'],
        top3_confidences: handData?.top3_confidences || [0],
        emotion: faceData?.emotion || 'neutral',
        expression: faceData?.expression || 'neutral',
        face_detected: faceData?.face_detected ?? false,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Combined recognition error:', error);
      return {
        top1_word: 'Error',
        top3_words: ['Error'],
        top3_confidences: [0],
        emotion: 'neutral',
        expression: 'neutral',
        face_detected: false,
        timestamp: Date.now(),
      };
    }
  }

  // Compose sentence from words
  async composeSentence(request: ComposeRequest): Promise<ComposeResult> {
    try {
      const response = await fetch(`${this.baseUrl}/api/compose`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        throw new Error(`Composition failed: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        sentence: data.sentence || 'Unable to compose sentence',
        confidence: data.confidence || 0.5,
      };
    } catch (error) {
      console.error('Sentence composition error:', error);
      
      // Fallback sentence generation
      const { words, tone = 'neutral' } = request;
      let sentence = words.length > 0 ? words.join(' ') : 'No words to compose';
      
      if (tone === 'polite') sentence = `Please, ${sentence}`;
      else if (tone === 'urgent') sentence = `${sentence}!`;
      else if (tone === 'grateful') sentence = `Thank you. ${sentence}.`;
      
      return {
        sentence,
        confidence: 0.3, // Lower confidence for fallback
      };
    }
  }
}

// Export singleton instance
export const realTimeAPI = new RealTimeAPIService();

// Export class for testing or custom instances
export { RealTimeAPIService };

// Re-export from shared for compatibility
export * from '../shared/services/api';