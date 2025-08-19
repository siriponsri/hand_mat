"""
Face detection API endpoints - Integration with face-api.js
"""

from flask import Blueprint, request, jsonify
import numpy as np
import base64
from io import BytesIO
from PIL import Image

from core.logging import get_logger

logger = get_logger(__name__)
face_api = Blueprint('face', __name__)

# Initialize face model (prepare for face-api.js integration)
face_model = None
face_model_available = False

# Try to load face-api.js interface model if available
try:
    from services.face_backend.face_api_model import FaceAPIJSModel
    face_model = FaceAPIJSModel()
    if face_model.is_loaded_status():
        face_model_available = True
        logger.info("Face API.js interface model loaded successfully")
    else:
        face_model = None
        face_model_available = False
        logger.info("Face API.js interface model not available")
        
except Exception as e:
    logger.warning(f"Face API.js model loading failed: {e}")
    face_model = None
    face_model_available = False

@face_api.route('/detect', methods=['POST'])
def detect_faces():
    """
    Detect faces in uploaded image
    
    Expected payload:
    {
        "image": "base64_encoded_image_data"
    }
    
    Returns:
    {
        "success": true,
        "faces": [
            {
                "bbox": [x, y, width, height],
                "confidence": 0.95,
                "landmarks": [[x1, y1], [x2, y2], ...],
                "face_id": 0
            }
        ],
        "count": 1,
        "model_info": {...}
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({
                'success': False,
                'error': 'No image data provided'
            }), 400
        
        # Decode base64 image
        try:
            image_data = base64.b64decode(data['image'])
            image = Image.open(BytesIO(image_data))
            image_array = np.array(image)
            
            # Image is already in RGB format for mock model
            
        except Exception as e:
            logger.error(f"Error decoding image: {e}")
            return jsonify({
                'success': False,
                'error': 'Invalid image data'
            }), 400
        
        # Detect faces
        faces = face_model.detect_faces(image_array)
        
        logger.info(f"Detected {len(faces)} faces")
        
        return jsonify({
            'success': True,
            'faces': faces,
            'count': len(faces),
            'model_info': face_model.get_info()
        })
        
    except Exception as e:
        logger.error(f"Error in face detection: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@face_api.route('/analyze-expression', methods=['POST'])
def analyze_expression():
    """
    Analyze facial expression in uploaded face image
    
    Expected payload:
    {
        "image": "base64_encoded_face_image_data"
    }
    
    Returns:
    {
        "success": true,
        "expression": "happy",
        "emotions": {
            "happy": 0.8,
            "neutral": 0.15,
            "sad": 0.05
        },
        "confidence": 0.8,
        "model_info": {...}
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({
                'success': False,
                'error': 'No image data provided'
            }), 400
        
        # Decode base64 image
        try:
            image_data = base64.b64decode(data['image'])
            image = Image.open(BytesIO(image_data))
            face_array = np.array(image)
            
            # Image is already in RGB format for mock model
                    
        except Exception as e:
            logger.error(f"Error decoding face image: {e}")
            return jsonify({
                'success': False,
                'error': 'Invalid image data'
            }), 400
        
        # Analyze expression
        result = face_model.analyze_expression(face_array)
        
        logger.info(f"Expression analysis: {result['expression']} (confidence: {result['confidence']})")
        
        return jsonify({
            'success': True,
            'expression': result['expression'],
            'emotions': result['emotions'],
            'confidence': result['confidence'],
            'model_info': face_model.get_info()
        })
        
    except Exception as e:
        logger.error(f"Error in expression analysis: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@face_api.route('/info', methods=['GET'])
def get_face_model_info():
    """
    Get face model information
    
    Returns:
    {
        "success": true,
        "model_info": {
            "name": "MockFaceModel",
            "version": "1.0.0-dev",
            "type": "mock",
            "expressions": [...],
            "loaded": true
        }
    }
    """
    try:
        model_info = face_model.get_info()
        
        return jsonify({
            'success': True,
            'model_info': model_info
        })
        
    except Exception as e:
        logger.error(f"Error getting face model info: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@face_api.route('/analyze', methods=['POST'])
def analyze_face_emotion():
    """
    Analyze facial emotion from uploaded image
    This endpoint now provides interface for face-api.js integration
    
    Expected payload: JSON with base64 image or frontend results
    
    Returns:
    {
        "success": true,
        "emotion": "neutral",
        "confidence": 0,
        "message": "Use frontend face-api.js for actual analysis"
    }
    """
    try:
        # Check if face model interface is available
        if not face_model_available or face_model is None:
            logger.info("No face model interface available - returning neutral emotion")
            return jsonify({
                'success': True,
                'emotion': 'neutral',
                'confidence': 0,
                'message': 'No face recognition model interface available',
                'model_info': {
                    'name': 'None',
                    'version': 'N/A',
                    'type': 'unavailable',
                    'status': 'unavailable'
                }
            })
        
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400
        
        # Check if this is a result from frontend face-api.js
        if 'frontend_result' in data:
            # Process results from frontend face-api.js
            frontend_result = data['frontend_result']
            processed_result = face_model.process_frontend_result(frontend_result)
            
            logger.info(f"Processed frontend face-api.js result: {processed_result['emotion']} ({processed_result['confidence']})")
            
            return jsonify({
                'success': True,
                'emotion': processed_result['emotion'],
                'confidence': int(processed_result['confidence'] * 100),
                'timestamp': data.get('timestamp'),
                'model_info': {
                    'name': face_model.get_name(),
                    'version': face_model.get_version(),
                    'type': 'face_api_js',
                    'status': 'ready'
                }
            })
        
        # Handle image data for preprocessing (interface mode)
        elif 'image' in data:
            # Decode base64 image
            try:
                image_data = data['image']
                if image_data.startswith('data:image'):
                    image_data = image_data.split(',')[1]
                
                image_bytes = base64.b64decode(image_data)
                image = Image.open(BytesIO(image_bytes))
                if image.mode != 'RGB':
                    image = image.convert('RGB')
                
                # Preprocess for frontend
                preprocessing_result = face_model.preprocess_image_for_frontend(image)
                
                if preprocessing_result['success']:
                    # Return instruction to use face-api.js in frontend
                    return jsonify({
                        'success': True,
                        'emotion': 'neutral',
                        'confidence': 0,
                        'message': 'Image received. Please use face-api.js in frontend for actual emotion analysis.',
                        'preprocessing': preprocessing_result,
                        'instruction': 'Process this image with face-api.js and send results back to /api/face/analyze with frontend_result parameter',
                        'model_info': {
                            'name': face_model.get_name(),
                            'version': face_model.get_version(),
                            'type': 'face_api_js_interface',
                            'status': 'ready'
                        }
                    })
                else:
                    return jsonify({
                        'success': True,
                        'emotion': 'neutral',
                        'confidence': 0,
                        'message': 'Image preprocessing failed',
                        'error': preprocessing_result.get('error')
                    })
                    
            except Exception as e:
                logger.error(f"Error processing image: {e}")
                return jsonify({
                    'success': True,
                    'emotion': 'neutral',
                    'confidence': 0,
                    'message': 'Error processing image data'
                })
        
        else:
            return jsonify({
                'success': False,
                'error': 'No image data or frontend_result provided'
            }), 400
        
    except Exception as e:
        logger.error(f"Error in face emotion analysis: {e}")
        # Return neutral instead of error to maintain functionality
        return jsonify({
            'success': True,
            'emotion': 'neutral',
            'confidence': 0,
            'message': 'Face analysis service encountered an error',
            'model_info': {
                'status': 'error',
                'error': str(e)
            }
        })

@face_api.route('/expressions', methods=['GET'])
def get_supported_expressions():
    """
    Get list of supported facial expressions
    
    Returns:
    {
        "success": true,
        "expressions": ["neutral", "happy", "sad", ...]
    }
    """
    try:
        expressions = face_model.get_supported_expressions()
        
        return jsonify({
            'success': True,
            'expressions': expressions
        })
        
    except Exception as e:
        logger.error(f"Error getting supported expressions: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
