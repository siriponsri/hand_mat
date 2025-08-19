"""
LLM (Language Model) API endpoints
"""

from flask import Blueprint, request, jsonify
from typing import List, Dict, Any

from ..core.logging import get_logger
from ..services.llm_backend import MockLLMModel, RealLLMModel, REAL_MODEL_AVAILABLE

logger = get_logger(__name__)
llm_api = Blueprint('llm', __name__)

# Initialize LLM model (use real if available, otherwise mock)
if REAL_MODEL_AVAILABLE:
    llm_model = RealLLMModel()
    logger.info("Using Real LLM Model")
else:
    llm_model = MockLLMModel()
    logger.info("Using Mock LLM Model")

@llm_api.route('/generate-sentence', methods=['POST'])
def generate_sentence():
    """
    Generate sentence from detected sign language words
    
    Expected payload:
    {
        "words": ["hello", "world"],
        "context": "greeting" (optional)
    }
    
    Returns:
    {
        "success": true,
        "sentence": "Hello, world!",
        "confidence": 0.85,
        "alternatives": ["Hi there!", "Hello everyone!"],
        "grammar_score": 0.9,
        "model_info": {...}
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'words' not in data:
            return jsonify({
                'success': False,
                'error': 'No words provided'
            }), 400
        
        words = data.get('words', [])
        context = data.get('context', None)
        
        if not isinstance(words, list):
            return jsonify({
                'success': False,
                'error': 'Words must be a list'
            }), 400
        
        # Generate sentence
        result = llm_model.generate_sentence(words, context)
        
        logger.info(f"Generated sentence: '{result['sentence']}' from words: {words}")
        
        return jsonify({
            'success': True,
            'sentence': result['sentence'],
            'confidence': result['confidence'],
            'alternatives': result['alternatives'],
            'grammar_score': result['grammar_score'],
            'model_info': llm_model.get_info()
        })
        
    except Exception as e:
        logger.error(f"Error in sentence generation: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@llm_api.route('/assess-probability', methods=['POST'])
def assess_probability():
    """
    Assess the probability and quality of a sentence
    
    Expected payload:
    {
        "sentence": "Hello world"
    }
    
    Returns:
    {
        "success": true,
        "probability": 0.8,
        "grammar_score": 0.9,
        "fluency_score": 0.7,
        "suggestions": ["Add punctuation at the end"],
        "model_info": {...}
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'sentence' not in data:
            return jsonify({
                'success': False,
                'error': 'No sentence provided'
            }), 400
        
        sentence = data.get('sentence', '')
        
        if not isinstance(sentence, str):
            return jsonify({
                'success': False,
                'error': 'Sentence must be a string'
            }), 400
        
        # Assess probability
        result = llm_model.assess_probability(sentence)
        
        logger.info(f"Assessed sentence: '{sentence}' - probability: {result['probability']}")
        
        return jsonify({
            'success': True,
            'probability': result['probability'],
            'grammar_score': result['grammar_score'],
            'fluency_score': result['fluency_score'],
            'suggestions': result['suggestions'],
            'model_info': llm_model.get_info()
        })
        
    except Exception as e:
        logger.error(f"Error in probability assessment: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@llm_api.route('/complete-sentence', methods=['POST'])
def complete_sentence():
    """
    Complete a partial sentence with additional words
    
    Expected payload:
    {
        "partial_sentence": "I want to",
        "words": ["eat", "food"]
    }
    
    Returns:
    {
        "success": true,
        "completed_sentence": "I want to eat food.",
        "confidence": 0.85,
        "alternatives": ["I want to eat some food.", "I want to have food."],
        "model_info": {...}
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        partial_sentence = data.get('partial_sentence', '')
        words = data.get('words', [])
        
        if not isinstance(partial_sentence, str):
            return jsonify({
                'success': False,
                'error': 'Partial sentence must be a string'
            }), 400
        
        if not isinstance(words, list):
            return jsonify({
                'success': False,
                'error': 'Words must be a list'
            }), 400
        
        # Complete sentence
        result = llm_model.complete_sentence(partial_sentence, words)
        
        logger.info(f"Completed sentence: '{result['completed_sentence']}'")
        
        return jsonify({
            'success': True,
            'completed_sentence': result['completed_sentence'],
            'confidence': result['confidence'],
            'alternatives': result['alternatives'],
            'model_info': llm_model.get_info()
        })
        
    except Exception as e:
        logger.error(f"Error in sentence completion: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@llm_api.route('/word-suggestions', methods=['POST'])
def get_word_suggestions():
    """
    Get word suggestions for a specific position in context
    
    Expected payload:
    {
        "context": "I want to",
        "position": 3
    }
    
    Returns:
    {
        "success": true,
        "suggestions": [
            {"word": "eat", "score": 0.8},
            {"word": "go", "score": 0.7},
            {"word": "play", "score": 0.6}
        ],
        "model_info": {...}
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'context' not in data:
            return jsonify({
                'success': False,
                'error': 'No context provided'
            }), 400
        
        context = data.get('context', '')
        position = data.get('position', 0)
        
        if not isinstance(context, str):
            return jsonify({
                'success': False,
                'error': 'Context must be a string'
            }), 400
        
        if not isinstance(position, int) or position < 0:
            return jsonify({
                'success': False,
                'error': 'Position must be a non-negative integer'
            }), 400
        
        # Get word suggestions
        suggestions = llm_model.get_word_suggestions(context, position)
        
        logger.info(f"Generated {len(suggestions)} word suggestions for context: '{context}' at position {position}")
        
        return jsonify({
            'success': True,
            'suggestions': suggestions,
            'model_info': llm_model.get_info()
        })
        
    except Exception as e:
        logger.error(f"Error getting word suggestions: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@llm_api.route('/info', methods=['GET'])
def get_llm_model_info():
    """
    Get LLM model information
    
    Returns:
    {
        "success": true,
        "model_info": {
            "name": "MockLLMModel",
            "version": "1.0.0-dev",
            "type": "mock",
            "languages": ["en", "th"],
            "loaded": true
        }
    }
    """
    try:
        model_info = llm_model.get_info()
        
        return jsonify({
            'success': True,
            'model_info': model_info
        })
        
    except Exception as e:
        logger.error(f"Error getting LLM model info: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@llm_api.route('/languages', methods=['GET'])
def get_supported_languages():
    """
    Get list of supported languages
    
    Returns:
    {
        "success": true,
        "languages": ["en", "th"]
    }
    """
    try:
        languages = llm_model.get_supported_languages()
        
        return jsonify({
            'success': True,
            'languages': languages
        })
        
    except Exception as e:
        logger.error(f"Error getting supported languages: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
