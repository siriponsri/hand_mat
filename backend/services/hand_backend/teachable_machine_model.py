"""
Teachable Machine Hand Model Implementation
Provides production-ready hand gesture recognition using Teachable Machine models
"""

import os
import json
import numpy as np
from PIL import Image
from typing import Optional, Tuple, List, Dict, Any
import logging

logger = logging.getLogger(__name__)

class TeachableMachineHandModel:
    """
    Hand gesture recognition model using Teachable Machine
    Supports TensorFlow Lite models with metadata.json
    """
    
    def __init__(self, model_path: str = None, metadata_path: str = None):
        """
        Initialize the Teachable Machine hand model
        
        Args:
            model_path: Path to the .tflite model file from Teachable Machine
            metadata_path: Path to the metadata.json file from Teachable Machine
        """
        self.model_path = model_path or os.path.join(
            os.path.dirname(__file__), '..', '..', 'models', 'hand', 'model.tflite'
        )
        self.metadata_path = metadata_path or os.path.join(
            os.path.dirname(__file__), '..', '..', 'models', 'hand', 'metadata.json'
        )
        
        self.interpreter = None
        self.labels = []
        self.input_details = None
        self.output_details = None
        self.is_loaded = False
        self.input_shape = None
        self.input_mean = 127.5
        self.input_std = 127.5
        
        self.load_model()
    
    def load_model(self) -> bool:
        """
        Load the Teachable Machine model and metadata
        
        Returns:
            bool: True if model loaded successfully, False otherwise
        """
        try:
            # Check if TensorFlow Lite is available
            try:
                import tensorflow as tf
            except ImportError:
                logger.warning("TensorFlow not available for TeachableMachineHandModel")
                return False
            
            # Check if model files exist
            if not os.path.exists(self.model_path):
                logger.info(f"Teachable Machine model file not found: {self.model_path}")
                return False
                
            if not os.path.exists(self.metadata_path):
                logger.info(f"Teachable Machine metadata file not found: {self.metadata_path}")
                return False
            
            # Load TensorFlow Lite model
            self.interpreter = tf.lite.Interpreter(model_path=self.model_path)
            self.interpreter.allocate_tensors()
            
            # Get input and output details
            self.input_details = self.interpreter.get_input_details()
            self.output_details = self.interpreter.get_output_details()
            
            # Get input shape
            self.input_shape = self.input_details[0]['shape']
            
            # Load metadata and labels
            self.load_metadata()
            
            self.is_loaded = True
            logger.info(f"Teachable Machine hand model loaded successfully with {len(self.labels)} classes")
            return True
            
        except Exception as e:
            logger.error(f"Failed to load Teachable Machine hand model: {e}")
            return False
    
    def load_metadata(self) -> bool:
        """
        Load Teachable Machine metadata and extract labels
        
        Returns:
            bool: True if metadata loaded successfully, False otherwise
        """
        try:
            with open(self.metadata_path, 'r', encoding='utf-8') as f:
                metadata = json.load(f)
            
            # Extract labels from Teachable Machine metadata
            if 'labels' in metadata:
                self.labels = metadata['labels']
            elif 'outputs' in metadata and len(metadata['outputs']) > 0:
                # Alternative metadata structure
                if 'labels' in metadata['outputs'][0]:
                    self.labels = metadata['outputs'][0]['labels']
            
            # Extract normalization parameters if available
            if 'preprocessing' in metadata:
                preprocessing = metadata['preprocessing']
                if 'mean' in preprocessing:
                    self.input_mean = preprocessing['mean']
                if 'std' in preprocessing:
                    self.input_std = preprocessing['std']
            
            logger.info(f"Loaded {len(self.labels)} labels from Teachable Machine metadata")
            return True
                
        except Exception as e:
            logger.error(f"Failed to load Teachable Machine metadata: {e}")
            # Create default labels if metadata fails
            self.labels = [f"Gesture_{i}" for i in range(10)]  # Default placeholder
            return False
    
    def preprocess_image(self, image: Image.Image) -> np.ndarray:
        """
        Preprocess image for Teachable Machine model
        
        Args:
            image: PIL Image object
            
        Returns:
            np.ndarray: Preprocessed image array
        """
        # Get expected input shape from model
        height, width = self.input_shape[1], self.input_shape[2]
        
        # Resize image to model input size
        image = image.resize((width, height))
        
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Convert to numpy array
        image_array = np.array(image, dtype=np.float32)
        
        # Normalize using Teachable Machine normalization
        # Standard Teachable Machine normalization: (pixel - mean) / std
        image_array = (image_array - self.input_mean) / self.input_std
        
        # Add batch dimension
        image_array = np.expand_dims(image_array, axis=0)
        
        return image_array
    
    def predict(self, image: Image.Image) -> Tuple[str, float]:
        """
        Predict hand gesture from image using Teachable Machine model
        
        Args:
            image: PIL Image object containing hand gesture
            
        Returns:
            Tuple[str, float]: (gesture_name, confidence)
        """
        if not self.is_loaded:
            return "Unknown", 0.0
        
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
            
            # Map to gesture label
            if predicted_class < len(self.labels):
                gesture = self.labels[predicted_class]
            else:
                gesture = "Unknown"
            
            # Apply confidence threshold
            if confidence < 0.7:  # Teachable Machine typically works well with 0.7 threshold
                gesture = "Unknown"
                confidence = 0.0
            
            return gesture, confidence
            
        except Exception as e:
            logger.error(f"Hand gesture prediction failed: {e}")
            return "Unknown", 0.0
    
    def predict_from_bytes(self, image_data: bytes) -> dict:
        """
        Predict hand gesture from image bytes
        
        Args:
            image_data: Raw image bytes
            
        Returns:
            dict: Prediction result with gesture and confidence
        """
        try:
            # Convert bytes to PIL Image
            from io import BytesIO
            image = Image.open(BytesIO(image_data))
            
            # Predict gesture
            gesture, confidence = self.predict(image)
            
            return {
                "prediction": gesture,
                "confidence": confidence,
                "model_loaded": self.is_loaded,
                "model_type": "teachable_machine"
            }
            
        except Exception as e:
            logger.error(f"Hand gesture prediction from bytes failed: {e}")
            return {
                "prediction": "Unknown",
                "confidence": 0.0,
                "model_loaded": self.is_loaded,
                "model_type": "teachable_machine"
            }
    
    def get_model_info(self) -> dict:
        """
        Get information about the loaded Teachable Machine model
        
        Returns:
            dict: Model information
        """
        return {
            "name": "TeachableMachineHandModel",
            "version": "1.0.0",
            "type": "teachable_machine",
            "model_loaded": self.is_loaded,
            "model_path": self.model_path,
            "metadata_path": self.metadata_path,
            "num_classes": len(self.labels),
            "labels": self.labels,
            "input_shape": self.input_shape.tolist() if self.input_shape is not None else None,
            "normalization": {
                "mean": self.input_mean,
                "std": self.input_std
            }
        }
    
    def get_supported_gestures(self) -> List[str]:
        """
        Get list of supported gestures
        
        Returns:
            List[str]: List of gesture names
        """
        return self.labels if self.labels else ["Unknown"]
