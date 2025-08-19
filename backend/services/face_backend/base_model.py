"""
Base class for face detection and expression recognition models
"""

from abc import ABC, abstractmethod
import numpy as np
from typing import List, Dict, Any, Optional

class BaseFaceModel(ABC):
    """Abstract base class for face detection and expression models"""
    
    @abstractmethod
    def detect_faces(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """
        Detect faces in image
        
        Args:
            image: Input image as numpy array (H, W, 3)
            
        Returns:
            List of face detections with bounding boxes and confidence
            Format: [{"bbox": [x, y, w, h], "confidence": float, "landmarks": [...]}]
        """
        pass
    
    @abstractmethod
    def analyze_expression(self, face_image: np.ndarray) -> Dict[str, Any]:
        """
        Analyze facial expression from cropped face image
        
        Args:
            face_image: Cropped face image as numpy array
            
        Returns:
            Dict with expression analysis
            Format: {
                "expression": str,  # dominant expression
                "emotions": {       # all emotion scores
                    "happy": float,
                    "sad": float, 
                    "angry": float,
                    "surprised": float,
                    "neutral": float,
                    "fear": float,
                    "disgust": float
                },
                "confidence": float
            }
        """
        pass
    
    @abstractmethod
    def get_name(self) -> str:
        """Get model name"""
        pass
    
    @abstractmethod
    def get_version(self) -> str:
        """Get model version"""
        pass
    
    @abstractmethod
    def get_supported_expressions(self) -> List[str]:
        """Get list of supported expression classes"""
        pass
    
    @abstractmethod
    def is_loaded(self) -> bool:
        """Check if model is loaded and ready for predictions"""
        pass
    
    def get_info(self) -> Dict[str, Any]:
        """Get comprehensive model information"""
        return {
            "name": self.get_name(),
            "version": self.get_version(),
            "expressions": self.get_supported_expressions(),
            "loaded": self.is_loaded()
        }
