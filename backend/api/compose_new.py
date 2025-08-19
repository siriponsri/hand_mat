"""
Sentence composition endpoints using OpenAI API
"""

from flask import Blueprint, request, jsonify
from core.simple_config import settings
from core.errors import ValidationError
from core.logging import get_logger
from typing import List, Dict, Any
import random

logger = get_logger(__name__)
compose_bp = Blueprint('compose', __name__)

# Initialize OpenAI LLM
llm_model = None
try:
    from services.llm_backend.openai_model import OpenAILLM
    llm_model = OpenAILLM()
    logger.info(f"LLM Model loaded: OpenAI Available = {llm_model.is_available()}")
except Exception as e:
    logger.error(f"Failed to load OpenAI LLM: {e}")
    llm_model = None

@compose_bp.route('/compose', methods=['POST'])
def compose_sentence():
    """Compose a natural sentence from hand gesture and face emotion results"""
    try:
        data = request.get_json()
        
        if not data:
            raise ValidationError("No JSON data provided")
        
        # Extract hand and face results (new format)
        hand_result = data.get('hand_result', {})
        face_result = data.get('face_result', {})
        
        # Validate inputs
        if not hand_result and not face_result:
            raise ValidationError("Either hand_result or face_result must be provided")
        
        # Use OpenAI LLM if available
        if llm_model and llm_model.is_available():
            sentence = llm_model.generate_sentence(hand_result, face_result)
            llm_used = "OpenAI GPT-3.5"
        else:
            sentence = _generate_fallback_sentence(hand_result, face_result)
            llm_used = "Template-based fallback"
        
        # Calculate combined confidence
        hand_conf = hand_result.get('confidence', 0.0)
        face_conf = face_result.get('confidence', 0.0)
        combined_confidence = (hand_conf + face_conf) / 2 if hand_conf > 0 and face_conf > 0 else max(hand_conf, face_conf)
        
        response = {
            "success": True,
            "sentence": sentence,
            "confidence": combined_confidence,
            "components": {
                "hand": hand_result.get('prediction', 'Unknown'),
                "emotion": face_result.get('emotion', 'neutral')
            },
            "llm_info": {
                "model": llm_used,
                "openai_available": llm_model.is_available() if llm_model else False
            }
        }
        
        logger.info(f"Generated sentence: {sentence} (using {llm_used})")
        return jsonify(response)
        
    except ValidationError as e:
        logger.warning(f"Validation error in compose: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 400
        
    except Exception as e:
        logger.error(f"Error in sentence composition: {e}")
        return jsonify({
            "success": False,
            "error": "Internal server error during sentence composition"
        }), 500

def _generate_fallback_sentence(hand_result: Dict[str, Any], face_result: Dict[str, Any]) -> str:
    """
    Generate sentence using template-based fallback when OpenAI is not available
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
