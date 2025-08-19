"""
Mock LLM model for development and testing
"""

import random
import time
from typing import List, Dict, Any, Optional
from .base_model import BaseLLMModel

class MockLLMModel(BaseLLMModel):
    """Mock implementation of language model for development"""
    
    def __init__(self):
        self.name = "MockLLMModel"
        self.version = "1.0.0-dev"
        self.languages = ["en", "th"]
        
        # Common sentence templates for realistic generation
        self.templates = [
            "I {verb} {object}",
            "The {noun} is {adjective}",
            "I want to {verb} {object}",
            "Please {verb} {object}",
            "Can you {verb} {object}",
            "I need {object}",
            "How are you today",
            "Thank you very much",
            "I love {object}",
            "Where is {object}"
        ]
        
        # Word categories for template filling
        self.word_categories = {
            "verb": ["eat", "drink", "play", "work", "study", "sleep", "run", "walk", "help", "see"],
            "object": ["water", "food", "book", "house", "car", "phone", "computer", "money", "friend", "family"],
            "noun": ["person", "child", "teacher", "doctor", "student", "cat", "dog", "bird", "tree", "flower"],
            "adjective": ["good", "bad", "happy", "sad", "big", "small", "beautiful", "ugly", "fast", "slow"]
        }
        
        # Common grammar patterns for assessment
        self.grammar_patterns = [
            r"^(I|You|He|She|It|We|They)\s+\w+",  # Subject-verb patterns
            r"\w+\s+(is|are|am|was|were)\s+\w+",   # Copula patterns
            r"(Please|Can|Could|Would)\s+\w+",     # Polite requests
        ]
    
    def generate_sentence(self, words: List[str], context: Optional[str] = None) -> Dict[str, Any]:
        """Generate a mock sentence from detected words"""
        # Simulate processing time
        time.sleep(random.uniform(0.2, 0.5))
        
        if not words:
            return {
                "sentence": "",
                "confidence": 0.0,
                "alternatives": [],
                "grammar_score": 0.0
            }
        
        # Use words to generate realistic sentence
        sentence = self._construct_sentence(words)
        confidence = self._calculate_confidence(words)
        alternatives = self._generate_alternatives(words)
        grammar_score = self._assess_grammar(sentence)
        
        return {
            "sentence": sentence,
            "confidence": round(confidence, 3),
            "alternatives": alternatives,
            "grammar_score": round(grammar_score, 3)
        }
    
    def _construct_sentence(self, words: List[str]) -> str:
        """Construct sentence from detected words"""
        if len(words) == 1:
            word = words[0].lower()
            if word in ["hello", "hi", "hey"]:
                return "Hello, how are you?"
            elif word in ["thanks", "thank", "thankyou"]:
                return "Thank you very much"
            elif word in ["yes", "ok", "okay"]:
                return "Yes, I understand"
            elif word in ["no", "not"]:
                return "No, I don't think so"
            else:
                return f"I see {word}"
        
        elif len(words) == 2:
            return f"I {words[0]} {words[1]}"
        
        elif len(words) >= 3:
            # Try to form more complex sentence
            if any(word.lower() in ["want", "need", "like"] for word in words):
                verb = next((w for w in words if w.lower() in ["want", "need", "like"]), words[0])
                objects = [w for w in words if w != verb]
                return f"I {verb} {' and '.join(objects)}"
            else:
                return f"I {words[0]} {words[1]} {' '.join(words[2:])}"
        
        return " ".join(words)
    
    def _calculate_confidence(self, words: List[str]) -> float:
        """Calculate confidence based on word count and content"""
        base_confidence = 0.6
        
        # More words generally mean higher confidence
        word_bonus = min(0.3, len(words) * 0.1)
        
        # Common words get bonus
        common_words = {"i", "you", "want", "need", "hello", "thank", "yes", "no", "please"}
        common_bonus = sum(0.05 for word in words if word.lower() in common_words)
        
        return min(0.95, base_confidence + word_bonus + common_bonus)
    
    def _generate_alternatives(self, words: List[str]) -> List[str]:
        """Generate alternative sentences"""
        alternatives = []
        
        if len(words) >= 2:
            # Reorder words
            alternatives.append(" ".join(reversed(words)))
            
            # Add polite forms
            if not any(word.lower() in ["please", "could", "would"] for word in words):
                alternatives.append(f"Please {' '.join(words)}")
                alternatives.append(f"Could you {' '.join(words)}")
        
        # Add some template-based alternatives
        if words:
            template = random.choice(self.templates)
            if "{object}" in template and words:
                alternative = template.replace("{object}", words[-1])
                if "{verb}" in alternative:
                    verb = random.choice(self.word_categories["verb"])
                    alternative = alternative.replace("{verb}", verb)
                alternatives.append(alternative)
        
        return alternatives[:3]  # Limit to 3 alternatives
    
    def assess_probability(self, sentence: str) -> Dict[str, Any]:
        """Assess sentence probability and quality"""
        time.sleep(random.uniform(0.1, 0.3))
        
        words = sentence.split()
        word_count = len(words)
        
        # Base probability
        probability = 0.7
        
        # Adjust based on length
        if word_count < 2:
            probability -= 0.3
        elif word_count > 15:
            probability -= 0.2
        
        # Grammar score based on simple patterns
        grammar_score = self._assess_grammar(sentence)
        
        # Fluency based on word variety and common patterns
        fluency_score = min(1.0, 0.5 + (len(set(words)) / max(1, word_count)) * 0.5)
        
        suggestions = self._generate_suggestions(sentence)
        
        return {
            "probability": round(probability, 3),
            "grammar_score": round(grammar_score, 3),
            "fluency_score": round(fluency_score, 3),
            "suggestions": suggestions
        }
    
    def _assess_grammar(self, sentence: str) -> float:
        """Simple grammar assessment"""
        if not sentence:
            return 0.0
        
        score = 0.6  # Base score
        
        # Check capitalization
        if sentence[0].isupper():
            score += 0.1
        
        # Check ending punctuation
        if sentence.endswith(('.', '!', '?')):
            score += 0.1
        
        # Check for basic subject-verb patterns
        words = sentence.lower().split()
        if len(words) >= 2:
            subjects = {"i", "you", "he", "she", "it", "we", "they"}
            if words[0] in subjects:
                score += 0.2
        
        return min(1.0, score)
    
    def _generate_suggestions(self, sentence: str) -> List[str]:
        """Generate improvement suggestions"""
        suggestions = []
        
        if not sentence:
            return ["Add some words to form a sentence"]
        
        if not sentence[0].isupper():
            suggestions.append("Start with a capital letter")
        
        if not sentence.endswith(('.', '!', '?')):
            suggestions.append("Add ending punctuation")
        
        words = sentence.split()
        if len(words) < 3:
            suggestions.append("Consider adding more words for clarity")
        
        return suggestions
    
    def complete_sentence(self, partial_sentence: str, words: List[str]) -> Dict[str, Any]:
        """Complete partial sentence with new words"""
        time.sleep(random.uniform(0.1, 0.2))
        
        if not partial_sentence and not words:
            return {
                "completed_sentence": "",
                "confidence": 0.0,
                "alternatives": []
            }
        
        if partial_sentence and words:
            completed = f"{partial_sentence} {' '.join(words)}"
        elif partial_sentence:
            completed = partial_sentence
        else:
            completed = ' '.join(words)
        
        # Clean up the sentence
        completed = ' '.join(completed.split())  # Remove extra spaces
        
        confidence = self._calculate_confidence(completed.split())
        alternatives = [
            f"{partial_sentence}, {' '.join(words)}" if partial_sentence and words else completed,
            f"{' '.join(words)} {partial_sentence}" if partial_sentence and words else completed
        ]
        
        return {
            "completed_sentence": completed,
            "confidence": round(confidence, 3),
            "alternatives": [alt for alt in alternatives if alt != completed][:2]
        }
    
    def get_word_suggestions(self, context: str, position: int) -> List[Dict[str, Any]]:
        """Get word suggestions for context"""
        time.sleep(random.uniform(0.05, 0.15))
        
        words = context.split()
        suggestions = []
        
        # Context-based suggestions
        if position == 0 or not words:
            # Sentence starters
            starters = ["I", "You", "We", "They", "Please", "Can", "Could"]
            suggestions.extend([{"word": word, "score": 0.8} for word in starters])
        
        elif position == len(words):
            # Sentence endings based on last word
            last_word = words[-1].lower() if words else ""
            
            if last_word in ["i", "you", "we", "they"]:
                verbs = ["want", "need", "have", "see", "like", "know"]
                suggestions.extend([{"word": verb, "score": 0.7} for verb in verbs])
            
            elif last_word in ["want", "need", "have"]:
                objects = ["food", "water", "help", "time", "money"]
                suggestions.extend([{"word": obj, "score": 0.6} for obj in objects])
        
        # Random vocabulary suggestions
        if len(suggestions) < 5:
            random_words = random.sample(
                sum(self.word_categories.values(), []), 
                min(5 - len(suggestions), 10)
            )
            suggestions.extend([{"word": word, "score": 0.4} for word in random_words])
        
        return suggestions[:5]
    
    def get_name(self) -> str:
        """Get model name"""
        return self.name
    
    def get_version(self) -> str:
        """Get model version"""
        return self.version
    
    def is_loaded(self) -> bool:
        """Check if model is loaded"""
        return True
    
    def get_supported_languages(self) -> List[str]:
        """Get supported languages"""
        return self.languages.copy()
    
    def get_info(self) -> Dict[str, Any]:
        """Get model information"""
        return {
            "name": self.name,
            "version": self.version,
            "type": "mock",
            "languages": self.languages,
            "templates_count": len(self.templates),
            "loaded": self.is_loaded(),
            "description": "Mock language model for development and testing"
        }
