"""
Base LLM model for sentence generation and language processing
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class BaseLLMModel(ABC):
    """Abstract base class for language model implementations"""
    
    @abstractmethod
    def generate_sentence(self, words: List[str], context: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate a sentence from detected sign language words
        
        Args:
            words: List of detected words/signs
            context: Optional context for better sentence generation
            
        Returns:
            Dictionary containing:
            - sentence: Generated sentence string
            - confidence: Confidence score (0.0 to 1.0)
            - alternatives: List of alternative sentences
            - grammar_score: Grammar quality score
        """
        pass
    
    @abstractmethod
    def assess_probability(self, sentence: str) -> Dict[str, Any]:
        """
        Assess the probability/quality of a sentence
        
        Args:
            sentence: Input sentence to assess
            
        Returns:
            Dictionary containing:
            - probability: Likelihood score (0.0 to 1.0)
            - grammar_score: Grammar quality score
            - fluency_score: Fluency score
            - suggestions: List of improvement suggestions
        """
        pass
    
    @abstractmethod
    def complete_sentence(self, partial_sentence: str, words: List[str]) -> Dict[str, Any]:
        """
        Complete a partial sentence with additional words
        
        Args:
            partial_sentence: Existing partial sentence
            words: New words to incorporate
            
        Returns:
            Dictionary containing:
            - completed_sentence: Full completed sentence
            - confidence: Completion confidence
            - alternatives: Alternative completions
        """
        pass
    
    @abstractmethod
    def get_word_suggestions(self, context: str, position: int) -> List[Dict[str, Any]]:
        """
        Get word suggestions for a specific position in context
        
        Args:
            context: Current sentence context
            position: Position where word should be inserted
            
        Returns:
            List of suggested words with scores
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
    def is_loaded(self) -> bool:
        """Check if model is loaded and ready"""
        pass
    
    @abstractmethod
    def get_supported_languages(self) -> List[str]:
        """Get list of supported languages"""
        pass
    
    @abstractmethod
    def get_info(self) -> Dict[str, Any]:
        """Get detailed model information"""
        pass
