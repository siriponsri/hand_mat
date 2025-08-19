"""
Sign recognition endpoints
"""

from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import base64
import io
from PIL import Image
import numpy as np
from core.simple_config import settings, get_upload_limit_bytes
from core.errors import ValidationError, FileTooLargeError, UnsupportedFileTypeError, ModelError
from core.logging import get_logger

logger = get_logger(__name__)

# Initialize hand model (prepare for Teachable Machine model)
hand_model = None
hand_model_available = False

# Try to load Teachable Machine hand model if available
try:
    from services.hand_backend.teachable_machine_model import TeachableMachineHandModel
    hand_model = TeachableMachineHandModel()
    if hand_model.is_loaded:
        hand_model_available = True
        logger.info("Teachable Machine hand model loaded successfully")
    else:
        hand_model = None
        hand_model_available = False
        logger.info("No Teachable Machine model file available - ready for model integration")
        
except Exception as e:
    logger.warning(f"Teachable Machine model loading failed: {e}")
    hand_model = None
    hand_model_available = False

recognize_bp = Blueprint('recognize', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def process_image_data(image_data: str) -> np.ndarray:
    """Process base64 image data into numpy array"""
    try:
        # Remove data URL prefix if present
        if ',' in image_data:
            image_data = image_data.split(',', 1)[1]
        
        # Decode base64
        image_bytes = base64.b64decode(image_data)
        
        # Check file size
        if len(image_bytes) > get_upload_limit_bytes():
            raise FileTooLargeError(f"Image size ({len(image_bytes)} bytes) exceeds limit")
        
        # Convert to PIL Image
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Convert to numpy array
        return np.array(image)
        
    except base64.binascii.Error:
        raise ValidationError("Invalid base64 image data")
    except Exception as e:
        logger.error(f"Error processing image: {e}")
        raise ValidationError(f"Error processing image: {str(e)}")

@recognize_bp.route('/recognize', methods=['POST'])
def recognize_sign():
    """Recognize sign language from image"""
    try:
        # Check if model is available
        if not hand_model_available or hand_model is None:
            logger.info("No hand model available - returning Unknown")
            return jsonify({
                "success": True,
                "text": "Unknown",
                "confidence": 0,
                "message": "No hand recognition model available",
                "metadata": {
                    "model_status": "unavailable",
                    "model_type": "none"
                }
            })
        
        # Handle both JSON and FormData (file upload)
        if request.content_type and 'multipart/form-data' in request.content_type:
            # Handle file upload
            if 'file' not in request.files:
                raise ValidationError("No file provided")
            
            file = request.files['file']
            if file.filename == '':
                raise ValidationError("No file selected")
            
            # Process uploaded image
            image = Image.open(file.stream)
            if image.mode != 'RGB':
                image = image.convert('RGB')
            image_array = np.array(image)
            
        else:
            # Handle JSON with base64 image
            data = request.get_json()
            if not data:
                raise ValidationError("No JSON data provided")
            
            image_data = data.get('image')
            if not image_data:
                raise ValidationError("No image data provided")
            
            image_array = process_image_data(image_data)
        
        logger.info(f"Processing image of shape: {image_array.shape}")
        
        # Get predictions from model
        predictions = hand_model.predict(image_array)
        
        # Format response to match frontend expectations
        if predictions:
            primary_prediction = predictions[0]
            detected_text = primary_prediction["label"]
            confidence = primary_prediction["confidence"]
            
            # Check if model couldn't recognize the gesture (low confidence or specific unknown label)
            if confidence < 0.5 or detected_text.lower() in ['unknown', 'unrecognized', 'none']:
                detected_text = "Unknown"
                confidence = 0
            
            response = {
                "success": True,
                "text": detected_text,
                "confidence": int(confidence * 100) if confidence > 0 else 0,  # Convert to percentage
                "predictions": predictions,
                "metadata": {
                    "model_version": hand_model.get_version(),
                    "model_type": "production",
                    "model_status": "ready",
                    "image_shape": image_array.shape
                }
            }
        else:
            # Fallback if no predictions (model failed to process)
            response = {
                "success": True,
                "text": "Unknown",
                "confidence": 0,
                "message": "Model could not process the image",
                "predictions": [],
                "metadata": {
                    "model_version": hand_model.get_version(),
                    "model_type": "production",
                    "model_status": "ready",
                    "image_shape": image_array.shape
                }
            }
        
        logger.info(f"Recognition successful: {response['text']} ({response['confidence']}%)")
        return jsonify(response)
        
    except (ValidationError, FileTooLargeError, UnsupportedFileTypeError) as e:
        raise e
    except Exception as e:
        logger.error(f"Unexpected error in recognition: {e}", exc_info=True)
        # Return Unknown instead of error to maintain functionality
        return jsonify({
            "success": True,
            "text": "Unknown",
            "confidence": 0,
            "message": "Recognition service encountered an error",
            "metadata": {
                "model_status": "error",
                "error": str(e)
            }
        })

@recognize_bp.route('/recognize/upload', methods=['POST'])
def recognize_upload():
    """Recognize sign language from uploaded file"""
    try:
        if 'file' not in request.files:
            raise ValidationError("No file provided")
        
        file = request.files['file']
        if file.filename == '':
            raise ValidationError("No file selected")
        
        if not allowed_file(file.filename):
            raise UnsupportedFileTypeError(
                f"File type not supported. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
            )
        
        # Check file size
        file.seek(0, 2)  # Seek to end
        size = file.tell()
        file.seek(0)     # Reset to beginning
        
        if size > get_upload_limit_bytes():
            raise FileTooLargeError(f"File size ({size} bytes) exceeds {settings.MAX_UPLOAD_MB}MB limit")
        
        # Process image
        image = Image.open(file.stream)
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        image_array = np.array(image)
        logger.info(f"Processing uploaded image: {secure_filename(file.filename)}, shape: {image_array.shape}")
        
        # Get predictions
        predictions = hand_model.predict(image_array)
        
        response = {
            "success": True,
            "predictions": predictions,
            "metadata": {
                "filename": secure_filename(file.filename),
                "model_version": hand_model.get_version(),
                "image_shape": image_array.shape,
                "file_size_bytes": size
            }
        }
        
        logger.info(f"Upload recognition successful: {file.filename}")
        return jsonify(response)
        
    except (ValidationError, FileTooLargeError, UnsupportedFileTypeError) as e:
        raise e
    except Exception as e:
        logger.error(f"Unexpected error in upload recognition: {e}", exc_info=True)
        raise ModelError("Upload recognition service temporarily unavailable")

@recognize_bp.route('/models/info')
def model_info():
    """Get information about available models"""
    if hand_model_available and hand_model:
        return jsonify({
            "success": True,
            "models": {
                "hand_model": {
                    "name": hand_model.get_name(),
                    "version": hand_model.get_version(),
                    "type": "production",
                    "classes": hand_model.get_classes(),
                    "status": "ready"
                }
            }
        })
    else:
        return jsonify({
            "success": True,
            "models": {
                "hand_model": {
                    "name": "None",
                    "version": "N/A",
                    "type": "unavailable",
                    "classes": [],
                    "status": "unavailable",
                    "message": "No hand recognition model loaded. Please add model files to enable recognition."
                }
            }
        })