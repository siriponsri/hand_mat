// API Response interfaces
interface HandRecognitionResponse {
  text: string;
  confidence: number;
}

interface FaceAnalysisResponse {
  emotion: string;
}

interface RecognitionResult {
  text: string;
  confidence: number;
  emotion: string;
  modelStatus: {
    hand: string;
    face: string;
    overall: string;
  };
}

export const API_CONFIG = {
  baseUrl: 'http://localhost:5000',
  timeout: 10000,
};

export interface RecognitionResponse {
  top1_word: string;
  top3: string[];
  top3_confidences: number[];
  emotion?: string;
  face_detected?: boolean;
  expression?: string;
}

export interface ComposeResponse {
  sentence: string;
}

export interface ComposeRequest {
  words: string[];
  tone?: string;
  emotion?: string;
}

// Backend API response types
interface HandPrediction {
  label: string;
  confidence: number;
}

interface HandAPIResponse {
  success: boolean;
  predictions?: HandPrediction[];
  error?: string;
}

interface FaceAPIResponse {
  success: boolean;
  expression?: string;
  emotions?: Record<string, number>;
  confidence?: number;
  error?: string;
}

// Thai words for realistic mock data
const thaiWords = [
  "สวัสดี", "ฉัน", "กิน", "ดื่ม", "ขอบคุณ", "โปรด", "ช่วย", "ใช่", "ไม่", "น้ำ", 
  "อาหาร", "บ้าน", "ไป", "มา", "ดี", "ไม่ดี", "รัก", "เข้าใจ", "ไม่เข้าใจ", "เสร็จ"
];

const emotions = ["neutral", "happy", "sad", "surprised", "focused", "calm"];

// Enhanced mock data with Thai words and face emotions
const createMockResponse = (useFaceContext: boolean = false): RecognitionResponse => {
  const randomWord = thaiWords[Math.floor(Math.random() * thaiWords.length)];
  const confidence1 = 0.6 + Math.random() * 0.4; // 60-100%
  const confidence2 = 0.4 + Math.random() * 0.3; // 40-70%
  const confidence3 = 0.2 + Math.random() * 0.3; // 20-50%
  
  // Generate other random words for top3
  const otherWords = thaiWords.filter(w => w !== randomWord);
  const word2 = otherWords[Math.floor(Math.random() * otherWords.length)];
  const word3 = otherWords[Math.floor(Math.random() * otherWords.length)];
  
  const faceDetected = useFaceContext && Math.random() > 0.2; // 80% chance if face context used
  const expression = faceDetected ? emotions[Math.floor(Math.random() * emotions.length)] : undefined;
  
  return {
    top1_word: randomWord,
    top3: [randomWord, word2, word3],
    top3_confidences: [confidence1, confidence2, confidence3],
    emotion: expression,
    face_detected: faceDetected,
    expression
  };
};

export async function recognizeSign(imageBlob: Blob): Promise<RecognitionResult> {
  try {
    console.log('Processing captured image...', imageBlob.size, 'bytes');
    
    // Try to call actual API endpoints
    let handResult: HandRecognitionResponse | null = null;
    let faceResult: FaceAnalysisResponse | null = null;
    
    // Prepare FormData for both requests
    const formData = new FormData();
    formData.append('file', imageBlob, 'capture.jpg');
    
    try {
      // Hand recognition API call
      const handResponse = await fetch(`${API_CONFIG.baseUrl}/api/recognize`, {
        method: 'POST',
        body: formData,
      });
      
      if (handResponse.ok) {
        const data = await handResponse.json();
        if (data.success && data.top1_word) {
          handResult = {
            text: data.top1_word,
            confidence: data.top3_confidences?.[0] || 0.5
          };
          console.log('Hand recognition success:', handResult);
        }
      } else {
        console.log('Hand API responded with error:', handResponse.status);
      }
    } catch (error) {
      console.log('Hand recognition API unavailable:', error);
      // Use fallback
      handResult = {
        text: 'Unknown',
        confidence: 0
      };
    }
    
    try {
      // Face analysis API call
      const faceFormData = new FormData();
      faceFormData.append('file', imageBlob, 'capture.jpg');
      
      const faceResponse = await fetch(`${API_CONFIG.baseUrl}/api/face-analysis`, {
        method: 'POST',
        body: faceFormData,
      });
      
      if (faceResponse.ok) {
        const data = await faceResponse.json();
        if (data.success && data.expression) {
          faceResult = {
            emotion: data.expression
          };
          console.log('Face analysis success:', faceResult);
        }
      } else {
        console.log('Face API responded with error:', faceResponse.status);
      }
    } catch (error) {
      console.log('Face analysis API unavailable:', error);
      // Use fallback
      faceResult = {
        emotion: 'neutral'
      };
    }
    
    // Process results
    const text = handResult?.text || 'Unknown';
    const confidence = handResult?.confidence || 0;
    const emotion = faceResult?.emotion || 'neutral';
    
    // Determine model status based on actual API responses
    const modelStatus = {
      hand: handResult && handResult.text !== 'Unknown' ? 'ready' : 'unavailable',
      face: faceResult && faceResult.emotion !== 'neutral' ? 'ready' : 'unavailable',
      overall: (handResult?.text !== 'Unknown' || faceResult?.emotion !== 'neutral') ? 'partial' : 'unavailable'
    };
    
    console.log('Recognition completed:', { text, confidence, emotion, modelStatus });
    
    return {
      text,
      confidence,
      emotion,
      modelStatus
    };
    
  } catch (error) {
    console.error('Recognition service error:', error);
    
    // Return fallback result
    return {
      text: 'Error',
      confidence: 0,
      emotion: 'neutral',
      modelStatus: {
        hand: 'error',
        face: 'error',
        overall: 'error'
      }
    };
  }
}

export const composeSentence = async (request: ComposeRequest): Promise<ComposeResponse> => {
  try {
    const apiResponse = await fetch(`${API_CONFIG.baseUrl}/api/compose`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!apiResponse.ok) {
      throw new Error(`Composition failed: ${apiResponse.status}`);
    }
    
    return await apiResponse.json();
  } catch (error) {
    console.warn('Backend not available, using mock sentence generation:', error);
    
    // Simple mock sentence generation
    const { words, tone = "neutral" } = request;
    if (words.length === 0) {
      return { sentence: "Please capture some words first." };
    }
    
    // Create a simple sentence from words
    let sentence = "";
    if (words.length === 1) {
      sentence = `I want to say "${words[0]}".`;
    } else if (words.length === 2) {
      sentence = `${words[0]} and ${words[1]}.`;
    } else {
      const lastWord = words[words.length - 1];
      const otherWords = words.slice(0, -1);
      sentence = `${otherWords.join(", ")} and ${lastWord}.`;
    }
    
    // Add tone-based modification
    if (tone === "polite") {
      sentence = `Please, ${sentence.toLowerCase()}`;
    } else if (tone === "urgent") {
      sentence = `${sentence} Please help quickly!`;
    } else if (tone === "grateful") {
      sentence = `Thank you. ${sentence}`;
    }
    
    return { sentence };
  }
};