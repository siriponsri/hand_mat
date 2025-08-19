"""
Real LLM model implementation using transformers
"""

import re
import random
from typing import List, Dict, Any, Optional
from .base_model import BaseLLMModel

class RealLLMModel(BaseLLMModel):
    """Real implementation using language models for sentence generation"""
    
    def __init__(self):
        self.name = "RealLLMModel"
        self.version = "1.0.0"
        self.languages = ["en", "th"]
        self.model = None
        self.tokenizer = None
        self.loaded = False
        
        # Grammar patterns for assessment
        self.grammar_patterns = {
            "subject_verb": re.compile(r"^(I|You|He|She|It|We|They|The|A|An)\s+\w+", re.IGNORECASE),
            "verb_object": re.compile(r"\b(want|need|have|see|like|eat|drink|get|make|do)\s+\w+", re.IGNORECASE),
            "question": re.compile(r"^(What|Where|When|Who|Why|How|Do|Does|Did|Can|Could|Would|Will)\b", re.IGNORECASE),
            "polite": re.compile(r"\b(please|thank|sorry|excuse)\b", re.IGNORECASE),
        }
        
    def _load_model(self):
        """Load the language model"""
        try:
            # Try to load transformers models
            from transformers import GPT2LMHeadModel, GPT2Tokenizer
            
            model_name = "gpt2"  # or "microsoft/DialoGPT-small" for conversation
            
            print(f"Loading {model_name} model...")
            self.tokenizer = GPT2Tokenizer.from_pretrained(model_name)
            self.model = GPT2LMHeadModel.from_pretrained(model_name)
            
            # Add padding token if not present
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token
            
            self.loaded = True
            print(f"✓ {self.name} loaded successfully")
            
        except ImportError:
            print("✗ Transformers library not available. Install with: pip install transformers torch")
            self.loaded = False
        except Exception as e:
            print(f"✗ Error loading {self.name}: {e}")
            self.loaded = False
    
    def generate_sentence(self, words: List[str], context: Optional[str] = None) -> Dict[str, Any]:
        """Generate sentence using language model"""
        if not self.loaded:
            self._load_model()
        
        if not self.loaded:
            # Fallback to rule-based generation
            return self._fallback_generation(words, context)
        
        try:
            # Prepare input prompt
            if context:
                prompt = f"{context} {' '.join(words)}"
            else:
                prompt = ' '.join(words)
            
            # Generate with model
            sentence = self._generate_with_model(prompt)
            confidence = self._calculate_model_confidence(sentence, words)
            alternatives = self._generate_model_alternatives(prompt)
            grammar_score = self._assess_grammar_advanced(sentence)
            
            return {
                "sentence": sentence,
                "confidence": round(confidence, 3),
                "alternatives": alternatives,
                "grammar_score": round(grammar_score, 3)
            }
            
        except Exception as e:
            print(f"Error in model generation: {e}")
            return self._fallback_generation(words, context)
    
    def _generate_with_model(self, prompt: str) -> str:
        """Generate text using the loaded model"""
        try:
            import torch
            
            # Tokenize input
            inputs = self.tokenizer.encode(prompt, return_tensors="pt")
            
            # Generate
            with torch.no_grad():
                outputs = self.model.generate(
                    inputs,
                    max_length=inputs.shape[1] + 20,
                    num_return_sequences=1,
                    temperature=0.7,
                    do_sample=True,
                    pad_token_id=self.tokenizer.eos_token_id
                )
            
            # Decode output
            generated_text = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            # Extract the generated part (remove original prompt)
            if generated_text.startswith(prompt):
                sentence = generated_text[len(prompt):].strip()
            else:
                sentence = generated_text.strip()
            
            # Clean up the sentence
            sentence = self._clean_sentence(sentence)
            
            return sentence if sentence else prompt
            
        except Exception as e:
            print(f"Model generation error: {e}")
            return prompt
    
    def _clean_sentence(self, sentence: str) -> str:
        """Clean and format the generated sentence"""
        if not sentence:
            return ""
        
        # Remove extra whitespace
        sentence = re.sub(r'\s+', ' ', sentence).strip()
        
        # Ensure proper capitalization
        if sentence and not sentence[0].isupper():
            sentence = sentence[0].upper() + sentence[1:]
        
        # Add period if missing and not a question/exclamation
        if sentence and not sentence.endswith(('.', '!', '?')):
            sentence += '.'
        
        return sentence
    
    def _calculate_model_confidence(self, sentence: str, original_words: List[str]) -> float:
        """Calculate confidence based on model output and input words"""
        base_confidence = 0.7
        
        # Check if original words are preserved
        sentence_words = set(sentence.lower().split())
        original_words_set = set(word.lower() for word in original_words)
        
        word_preservation = len(original_words_set.intersection(sentence_words)) / max(1, len(original_words_set))
        preservation_bonus = word_preservation * 0.2
        
        # Grammar quality bonus
        grammar_bonus = self._assess_grammar_advanced(sentence) * 0.1
        
        return min(0.95, base_confidence + preservation_bonus + grammar_bonus)
    
    def _generate_model_alternatives(self, prompt: str) -> List[str]:
        """Generate alternative sentences using the model"""
        alternatives = []
        
        if not self.loaded:
            return alternatives
        
        try:
            import torch
            
            inputs = self.tokenizer.encode(prompt, return_tensors="pt")
            
            # Generate multiple alternatives with different parameters
            for temp in [0.5, 0.9]:
                with torch.no_grad():
                    outputs = self.model.generate(
                        inputs,
                        max_length=inputs.shape[1] + 15,
                        num_return_sequences=1,
                        temperature=temp,
                        do_sample=True,
                        pad_token_id=self.tokenizer.eos_token_id
                    )
                
                generated = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
                if generated.startswith(prompt):
                    alternative = generated[len(prompt):].strip()
                else:
                    alternative = generated.strip()
                
                alternative = self._clean_sentence(alternative)
                if alternative and alternative not in alternatives:
                    alternatives.append(alternative)
            
        except Exception as e:
            print(f"Alternative generation error: {e}")
        
        return alternatives[:3]
    
    def _fallback_generation(self, words: List[str], context: Optional[str] = None) -> Dict[str, Any]:
        """Fallback rule-based sentence generation"""
        if not words:
            sentence = ""
            confidence = 0.0
        else:
            sentence = self._rule_based_sentence(words)
            confidence = 0.6
        
        return {
            "sentence": sentence,
            "confidence": confidence,
            "alternatives": [],
            "grammar_score": self._assess_grammar_advanced(sentence)
        }
    
    def _rule_based_sentence(self, words: List[str]) -> str:
        """Generate sentence using rules"""
        if len(words) == 1:
            word = words[0].lower()
            if word in ["hello", "hi"]:
                return "Hello, how are you?"
            elif word in ["thanks", "thank"]:
                return "Thank you very much."
            elif word in ["yes", "ok"]:
                return "Yes, I understand."
            elif word in ["no"]:
                return "No, I don't think so."
            else:
                return f"I see {word}."
        
        elif len(words) >= 2:
            return f"I {' '.join(words)}."
        
        return ' '.join(words)
    
    def assess_probability(self, sentence: str) -> Dict[str, Any]:
        """Assess sentence probability and quality"""
        if not sentence:
            return {
                "probability": 0.0,
                "grammar_score": 0.0,
                "fluency_score": 0.0,
                "suggestions": ["Please provide a sentence to assess"]
            }
        
        # Grammar assessment
        grammar_score = self._assess_grammar_advanced(sentence)
        
        # Fluency assessment
        fluency_score = self._assess_fluency(sentence)
        
        # Overall probability
        probability = (grammar_score + fluency_score) / 2
        
        # Generate suggestions
        suggestions = self._generate_improvement_suggestions(sentence)
        
        return {
            "probability": round(probability, 3),
            "grammar_score": round(grammar_score, 3),
            "fluency_score": round(fluency_score, 3),
            "suggestions": suggestions
        }
    
    def _assess_grammar_advanced(self, sentence: str) -> float:
        """Advanced grammar assessment"""
        if not sentence:
            return 0.0
        
        score = 0.5  # Base score
        
        # Capitalization
        if sentence[0].isupper():
            score += 0.1
        
        # Punctuation
        if sentence.endswith(('.', '!', '?')):
            score += 0.1
        
        # Pattern matching
        for pattern_name, pattern in self.grammar_patterns.items():
            if pattern.search(sentence):
                score += 0.1
                break
        
        # Word order (basic checks)
        words = sentence.lower().split()
        if len(words) >= 2:
            # Subject-verb order
            if words[0] in ["i", "you", "he", "she", "it", "we", "they"]:
                score += 0.15
        
        return min(1.0, score)
    
    def _assess_fluency(self, sentence: str) -> float:
        """Assess sentence fluency"""
        words = sentence.split()
        if not words:
            return 0.0
        
        score = 0.6  # Base score
        
        # Length appropriateness
        word_count = len(words)
        if 3 <= word_count <= 15:
            score += 0.2
        elif word_count < 3:
            score -= 0.2
        
        # Word variety
        unique_words = len(set(word.lower() for word in words))
        variety_ratio = unique_words / word_count
        score += variety_ratio * 0.2
        
        return min(1.0, score)
    
    def _generate_improvement_suggestions(self, sentence: str) -> List[str]:
        """Generate improvement suggestions"""
        suggestions = []
        
        if not sentence:
            return ["Please provide a sentence to analyze"]
        
        # Capitalization
        if not sentence[0].isupper():
            suggestions.append("Start the sentence with a capital letter")
        
        # Punctuation
        if not sentence.endswith(('.', '!', '?')):
            suggestions.append("Add appropriate punctuation at the end")
        
        # Length
        words = sentence.split()
        if len(words) < 3:
            suggestions.append("Consider adding more words for clarity")
        elif len(words) > 20:
            suggestions.append("Consider breaking into shorter sentences")
        
        # Grammar patterns
        if not any(pattern.search(sentence) for pattern in self.grammar_patterns.values()):
            suggestions.append("Consider restructuring for better grammar")
        
        return suggestions[:3]
    
    def complete_sentence(self, partial_sentence: str, words: List[str]) -> Dict[str, Any]:
        """Complete partial sentence with new words"""
        if not partial_sentence and not words:
            return {
                "completed_sentence": "",
                "confidence": 0.0,
                "alternatives": []
            }
        
        # Simple completion logic
        if partial_sentence and words:
            completed = f"{partial_sentence} {' '.join(words)}"
        elif partial_sentence:
            completed = partial_sentence
        else:
            completed = ' '.join(words)
        
        completed = self._clean_sentence(completed)
        confidence = self._assess_fluency(completed)
        
        # Generate alternatives
        alternatives = []
        if partial_sentence and words:
            alternatives.append(f"{partial_sentence}, {' '.join(words)}")
            if len(words) == 1:
                alternatives.append(f"{partial_sentence} and {words[0]}")
        
        return {
            "completed_sentence": completed,
            "confidence": round(confidence, 3),
            "alternatives": [alt for alt in alternatives if alt != completed][:2]
        }
    
    def get_word_suggestions(self, context: str, position: int) -> List[Dict[str, Any]]:
        """Get contextual word suggestions"""
        suggestions = []
        words = context.split()
        
        # Context-based suggestions
        if position == 0:
            # Sentence starters
            starters = [
                {"word": "I", "score": 0.9},
                {"word": "You", "score": 0.8},
                {"word": "Please", "score": 0.7},
                {"word": "Can", "score": 0.7},
                {"word": "The", "score": 0.6}
            ]
            suggestions.extend(starters)
        
        elif words and position == len(words):
            last_word = words[-1].lower()
            
            # Verb suggestions after subjects
            if last_word in ["i", "you", "we", "they"]:
                verbs = [
                    {"word": "want", "score": 0.8},
                    {"word": "need", "score": 0.8},
                    {"word": "have", "score": 0.7},
                    {"word": "like", "score": 0.7},
                    {"word": "see", "score": 0.6}
                ]
                suggestions.extend(verbs)
            
            # Object suggestions after verbs
            elif last_word in ["want", "need", "like"]:
                objects = [
                    {"word": "food", "score": 0.7},
                    {"word": "water", "score": 0.7},
                    {"word": "help", "score": 0.6},
                    {"word": "to", "score": 0.8}  # "want to", "need to"
                ]
                suggestions.extend(objects)
        
        return suggestions[:5]
    
    def get_name(self) -> str:
        """Get model name"""
        return self.name
    
    def get_version(self) -> str:
        """Get model version"""
        return self.version
    
    def is_loaded(self) -> bool:
        """Check if model is loaded"""
        return self.loaded
    
    def get_supported_languages(self) -> List[str]:
        """Get supported languages"""
        return self.languages.copy()
    
    def get_info(self) -> Dict[str, Any]:
        """Get model information"""
        return {
            "name": self.name,
            "version": self.version,
            "type": "real",
            "languages": self.languages,
            "loaded": self.is_loaded(),
            "backend": "Transformers (GPT-2)" if self.loaded else "Rule-based fallback",
            "description": "Real language model using transformers for sentence generation"
        }
