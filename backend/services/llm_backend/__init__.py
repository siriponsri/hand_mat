"""
LLM backend service initialization
"""

from .base_model import BaseLLMModel
from .mock_model import MockLLMModel

# Import real model only if dependencies are available
try:
    from .real_model import RealLLMModel
    REAL_MODEL_AVAILABLE = True
except ImportError as e:
    print(f"Real LLM model not available: {e}")
    RealLLMModel = None
    REAL_MODEL_AVAILABLE = False

__all__ = [
    "BaseLLMModel",
    "MockLLMModel", 
    "RealLLMModel",
    "REAL_MODEL_AVAILABLE"
]
