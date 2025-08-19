"""
Face backend service initialization
"""

from .base_model import BaseFaceModel
from .mock_model import MockFaceModel

# Import real model only if dependencies are available
try:
    from .real_model import RealFaceModel
    REAL_MODEL_AVAILABLE = True
except ImportError as e:
    print(f"Real face model not available: {e}")
    RealFaceModel = None
    REAL_MODEL_AVAILABLE = False

__all__ = [
    "BaseFaceModel",
    "MockFaceModel", 
    "RealFaceModel",
    "REAL_MODEL_AVAILABLE"
]
