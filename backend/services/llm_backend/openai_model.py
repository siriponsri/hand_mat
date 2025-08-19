"""
OpenAI Integration for LLM Sentence Generation
"""
from openai import OpenAI
import os
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class OpenAILLM:
    """
    OpenAI API integration for natural language generation
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize OpenAI client
        
        Args:
            api_key: OpenAI API key. If None, will try to read from environment
        """
        self.api_key = api_key or os.getenv('OPENAI_API_KEY')
        
        if not self.api_key:
            logger.warning("No OpenAI API key provided. Using mock responses.")
            self.client = None
        else:
            try:
                self.client = OpenAI(api_key=self.api_key)
                logger.info("OpenAI client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize OpenAI client: {e}")
                self.client = None
    
    def is_available(self) -> bool:
        """Check if OpenAI API is available"""
        return self.client is not None and self.api_key is not None
    
    def generate_sentence(self, hand_result: Dict[str, Any], face_result: Dict[str, Any]) -> str:
        """
        Generate a natural sentence based on hand gesture and face emotion
        
        Args:
            hand_result: Hand gesture recognition result
            face_result: Face emotion analysis result
            
        Returns:
            str: Generated sentence
        """
        if not self.is_available():
            return self._generate_mock_sentence(hand_result, face_result)
        
        try:
            hand_gesture = hand_result.get('prediction', 'unknown')
            hand_confidence = hand_result.get('confidence', 0.0)
            face_emotion = face_result.get('emotion', 'neutral')
            face_confidence = face_result.get('confidence', 0.0)
            
            prompt = f"""
            Based on the following input, generate a natural, friendly sentence in Thai that describes what you observe:
            
            Hand gesture: {hand_gesture} (confidence: {hand_confidence:.2f})
            Face emotion: {face_emotion} (confidence: {face_confidence:.2f})
            
            Generate a short, natural sentence (1-2 sentences) that combines both observations.
            Examples:
            - "คุณดูมีความสุขและกำลังทักทาย"
            - "เห็นท่าทางขอบคุณพร้อมรอยยิ้ม"
            - "คุณดูเศร้าและกำลังโบกมือลา"
            
            Response in Thai only:
            """
            
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that describes human gestures and emotions in Thai language."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=100,
                temperature=0.7
            )
            
            generated_text = response.choices[0].message.content.strip()
            logger.info(f"Generated sentence via OpenAI: {generated_text}")
            return generated_text
            
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            return self._generate_mock_sentence(hand_result, face_result)
    
    def _generate_mock_sentence(self, hand_result: Dict[str, Any], face_result: Dict[str, Any]) -> str:
        """
        Fallback sentence generation when OpenAI is not available
        """
        hand_gesture = hand_result.get('prediction', 'unknown')
        face_emotion = face_result.get('emotion', 'neutral')
        
        templates = {
            ('hello', 'happy'): "คุณดูมีความสุขและกำลังทักทาย",
            ('hello', 'neutral'): "คุณกำลังทักทายอย่างสุภาพ",
            ('thank_you', 'happy'): "คุณกำลังขอบคุณด้วยความยินดี",
            ('thank_you', 'neutral'): "เห็นท่าทางขอบคุณ",
            ('goodbye', 'sad'): "คุณดูเศร้าและกำลังโบกมือลา",
            ('goodbye', 'neutral'): "คุณกำลังลาก่อน",
            ('yes', 'happy'): "คุณกำลังตอบรับด้วยความยินดี",
            ('no', 'neutral'): "คุณกำลังปฏิเสธอย่างสุภาพ",
        }
        
        key = (hand_gesture.lower(), face_emotion.lower())
        if key in templates:
            return templates[key]
        else:
            return f"เห็นท่าทาง {hand_gesture} พร้อมสีหน้า {face_emotion}"
