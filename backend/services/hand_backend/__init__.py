"""
Hand recognition backend services
"""

from .base_model import BaseHandModel
from .mock_model import MockHandModel

__all__ = ['BaseHandModel', 'MockHandModel']