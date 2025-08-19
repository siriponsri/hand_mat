// Test script to verify Thai word recognition with face detection
import { recognizeSign } from '../src/shared/services/api';

// Mock image data for testing
const mockImageBlob = new Blob(['test image data'], { type: 'image/jpeg' });

async function testRecognition() {
  console.log('Testing Thai word recognition with face detection...');
  
  try {
    // Test with mock data
    const result = await recognizeSign(mockImageBlob);
    
    console.log('Recognition Result:', result);
    console.log('Detected Text (Thai):', result.text);
    console.log('Confidence:', result.confidence);
    console.log('Emotion:', result.emotion);
    console.log('Model Status:', result.modelStatus);
    
    // Verify Thai words are being returned
    const thaiWords = ['สวัสดี', 'ฉัน', 'กิน', 'Unknown'];
    const isValidThai = thaiWords.includes(result.text);
    
    console.log('✓ Thai word validation:', isValidThai ? 'PASS' : 'FAIL');
    console.log('✓ Face emotion detected:', result.emotion !== 'neutral' ? 'PASS' : 'NEUTRAL');
    console.log('✓ Model status available:', result.modelStatus ? 'PASS' : 'FAIL');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Export for potential use
export { testRecognition };

console.log('Thai Recognition Test Module Ready');
console.log('Available Thai words: สวัสดี (Hello), ฉัน (I/Me), กิน (Eat)');
console.log('Face emotions: happy, sad, angry, surprised, neutral');
