"""
Base class for hand recognition models
"""

from abc import ABC, abstractmethod
import numpy as np
from typing import List, Dict, Any

class BaseHandModel(ABC):
    """Abstract base class for hand recognition models"""
    
    @abstractmethod
    def predict(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """
        Predict hand sign from image
        
        Args:
            image: Input image as numpy array (H, W, 3)
            
        Returns:
            List of predictions with 'label' and 'confidence' keys
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
    def get_classes(self) -> List[str]:
        """Get list of supported classes/labels"""
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
            "classes": self.get_classes(),
            "loaded": self.is_loaded()
        }