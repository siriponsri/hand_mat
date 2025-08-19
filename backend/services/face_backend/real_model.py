"""
Real Face Model Implementation
Provides production-ready face emotion recognition using TensorFlow Lite
"""

import os
import pickle
import numpy as np
import io
from PIL import Image
from typing import Optional, Tuple, List
import logging

logger = logging.getLogger(__name__)

class RealFaceModel:
    """
    Production-ready face emotion recognition model
    Supports TensorFlow Lite (.tflite) and Pickle (.pkl) label files
    """
    
    def __init__(self, model_path: str = None, labels_path: str = None):
        """
        Initialize the real face model
        
        Args:
            model_path: Path to the .tflite model file
            labels_path: Path to the .pkl labels file
        """
        self.model_path = model_path or os.path.join(
            os.path.dirname(__file__), '..', '..', 'models', 'face', 'model.tflite'
        )
        self.labels_path = labels_path or os.path.join(
            os.path.dirname(__file__), '..', '..', 'models', 'face', 'labels.pkl'
        )
        
        self.interpreter = None
        self.labels = None
        self.input_details = None
        self.output_details = None
        self.is_loaded = False
        
        # Default emotion categories
        self.default_emotions = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']
        
        self.load_model()
    
    def load_model(self) -> bool:
        """
        Load the TensorFlow Lite model and labels
        
        Returns:
            bool: True if model loaded successfully, False otherwise
        """
        try:
            # Check if TensorFlow Lite is available
            try:
                import tensorflow as tf
            except ImportError:
                logger.warning("TensorFlow not available for RealFaceModel")
                return False
            
            # Check if model file exists
            if not os.path.exists(self.model_path):
                logger.info(f"Face model file not found: {self.model_path}")
                return False
            
            # Load TensorFlow Lite model
            self.interpreter = tf.lite.Interpreter(model_path=self.model_path)
            self.interpreter.allocate_tensors()
            
            # Get input and output details
            self.input_details = self.interpreter.get_input_details()
            self.output_details = self.interpreter.get_output_details()
            
            # Load labels
            self.load_labels()
            
            self.is_loaded = True
            logger.info("Face emotion recognition model loaded successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to load face model: {e}")
            return False
    
    def load_labels(self) -> bool:
        """
        Load emotion labels from pickle file
        
        Returns:
            bool: True if labels loaded successfully, False otherwise
        """
        try:
            if os.path.exists(self.labels_path):
                with open(self.labels_path, 'rb') as f:
                    self.labels = pickle.load(f)
                logger.info(f"Loaded {len(self.labels)} face emotion labels")
                return True
            else:
                # Use default labels if file doesn't exist
                self.labels = self.default_emotions
                logger.info("Using default emotion labels")
                return True
                
        except Exception as e:
            logger.error(f"Failed to load emotion labels: {e}")
            # Fallback to default labels
            self.labels = self.default_emotions
            return True
    
    def preprocess_image(self, image: Image.Image) -> np.ndarray:
        """
        Preprocess image for emotion recognition
        
        Args:
            image: PIL Image object
            
        Returns:
            np.ndarray: Preprocessed image array
        """
        # Get expected input shape from model
        input_shape = self.input_details[0]['shape']
        height, width = input_shape[1], input_shape[2]
        
        # Resize image
        image = image.resize((width, height))
        
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Convert to numpy array
        image_array = np.array(image, dtype=np.float32)
        
        # Normalize pixel values to [0, 1]
        image_array = image_array / 255.0
        
        # Add batch dimension
        image_array = np.expand_dims(image_array, axis=0)
        
        return image_array
    
    def predict(self, image: Image.Image) -> Tuple[str, float]:
        """
        Predict emotion from face image
        
        Args:
            image: PIL Image object containing face
            
        Returns:
            Tuple[str, float]: (emotion, confidence)
        """
        if not self.is_loaded:
            return "neutral", 0.0
        
        try:
            # Preprocess image
            processed_image = self.preprocess_image(image)
            
            # Set input tensor
            self.interpreter.set_tensor(self.input_details[0]['index'], processed_image)
            
            # Run inference
            self.interpreter.invoke()
            
            # Get prediction
            output_data = self.interpreter.get_tensor(self.output_details[0]['index'])
            
            # Get predicted class and confidence
            predicted_class = np.argmax(output_data[0])
            confidence = float(np.max(output_data[0]))
            
            # Map to emotion label
            if predicted_class < len(self.labels):
                emotion = self.labels[predicted_class]
            else:
                emotion = "neutral"
            
            return emotion, confidence
            
        except Exception as e:
            logger.error(f"Face emotion prediction failed: {e}")
            return "neutral", 0.0
    
    def analyze_emotion(self, image_data: bytes) -> dict:
        """
        Analyze emotion from image bytes
        
        Args:
            image_data: Raw image bytes
            
        Returns:
            dict: Analysis result with emotion and confidence
        """
        try:
            # Convert bytes to PIL Image
            image = Image.open(io.BytesIO(image_data))
            
            # Predict emotion
            emotion, confidence = self.predict(image)
            
            return {
                "emotion": emotion,
                "confidence": confidence,
                "model_loaded": self.is_loaded
            }
            
        except Exception as e:
            logger.error(f"Face emotion analysis failed: {e}")
            return {
                "emotion": "neutral",
                "confidence": 0.0,
                "model_loaded": self.is_loaded
            }
    
    def get_model_info(self) -> dict:
        """
        Get information about the loaded model
        
        Returns:
            dict: Model information
        """
        return {
            "model_loaded": self.is_loaded,
            "model_path": self.model_path,
            "labels_path": self.labels_path,
            "num_emotions": len(self.labels) if self.labels else 0,
            "emotions": self.labels if self.labels else [],
            "input_shape": self.input_details[0]['shape'].tolist() if self.input_details else None
        }