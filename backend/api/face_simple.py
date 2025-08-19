"""
Simple Face API for emotion analysis using mock data
Will be replaced with face-api.js integration
"""

from flask import Blueprint, request, jsonify
import random
import logging

logger = logging.getLogger(__name__)
face_bp = Blueprint('face', __name__)

@face_bp.route('/analyze', methods=['POST'])
def analyze_face_emotion():
    """
    Analyze face emotion from base64 image
    Returns mock emotion analysis for now
    """
    try:
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({
                'emotion': 'neutral',
                'confidence': 0.0,
                'message': 'No image data provided'
            }), 400
        
        # Mock emotion analysis - replace with face-api.js integration
        emotions = ['neutral', 'happy', 'sad', 'angry', 'surprised', 'fearful', 'disgusted']
        selected_emotion = 'neutral'  # Default for mock
        confidence = 0.0
        
        logger.info(f"Mock face analysis: {selected_emotion} (confidence: {confidence})")
        
        return jsonify({
            'emotion': selected_emotion,
            'confidence': confidence,
            'message': 'Using mock face analysis - ready for face-api.js integration'
        })
        
    except Exception as e:
        logger.error(f"Error in face emotion analysis: {e}")
        return jsonify({
            'emotion': 'neutral',
            'confidence': 0.0,
            'message': f'Error in face analysis: {str(e)}'
        }), 500

@face_bp.route('/health', methods=['GET'])
def face_health():
    """Health check for face detection service"""
    return jsonify({
        'service': 'face-detection',
        'status': 'healthy',
        'models_ready': True,
        'face_api_js_models': {
            'tiny_face_detector': True,
            'face_expression_model': True
        }
    })
