"""
Real Hand Model Implementation for Teachable Machine
Provides production-ready hand gesture recognition using Teachable Machine models
"""

import os
import json
import numpy as np
from PIL import Image
from typing import Optional, Tuple, List, Dict, Any
import logging

logger = logging.getLogger(__name__)

from .base_model import BaseHandModel
from core.simple_config import settings

try:
    # Attempt to import TensorFlow lazily. If TensorFlow is not
    # installed, this will raise ImportError. You can change this
    # import to another framework (e.g. onnxruntime or PyTorch) as
    # needed.
    import tensorflow as tf  # type: ignore
except ImportError as e:
    # Provide a clear error message if TensorFlow is missing. The
    # model will not function until TensorFlow (or your chosen
    # framework) is installed.
    raise ImportError(
        "TensorFlow is required for RealHandModel. "
        "Please install it by adding an appropriate version of "
        "`tensorflow` to `backend/requirements.txt` and running "
        "`pip install -r backend/requirements.txt`."
    ) from e


class RealHandModel(BaseHandModel):
    """Concrete hand recognition model loading a trained ML model."""

    def __init__(self, model_filename: str = "hand_model.tflite") -> None:
        """
        Initialise the real hand model by loading the model file.

        Args:
            model_filename: Name of the model file located in
                `settings.MODEL_PATH`. By default this is
                `hand_model.tflite`, but you can specify a different
                filename when instantiating this class.
        """
        self.name: str = "RealHandModel"
        self.version: str = "1.0.0"
        self.classes: List[str] = []  # Will be populated after model load
        self.model_filename = model_filename
        self.model_path = os.path.join(settings.MODEL_PATH, model_filename)
        self.loaded: bool = False

        # Load the model
        self._load_model()

    def _load_model(self) -> None:
        """
        Load the ML model from disk and prepare it for inference.

        This method detects the file extension of the model and
        dispatches to an appropriate loader. Currently supports
        TensorFlow SavedModel (`.pb`), Keras (`.h5` or `.keras`), and
        TensorFlow Lite (`.tflite`) models. Extend this method if you
        need to support other formats such as ONNX or PyTorch.
        """
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(
                f"Model file not found at {self.model_path}. "
                f"Please ensure your trained model is copied to this "
                f"path or update settings.MODEL_PATH accordingly."
            )

        ext = os.path.splitext(self.model_filename)[1].lower()
        try:
            if ext in {".h5", ".keras"}:
                # Load a Keras model
                self.model = tf.keras.models.load_model(self.model_path)
            elif ext == ".tflite":
                # Load a TFLite model
                self._interpreter = tf.lite.Interpreter(model_path=self.model_path)
                self._interpreter.allocate_tensors()
                # Get input and output details for inference
                self._input_details = self._interpreter.get_input_details()
                self._output_details = self._interpreter.get_output_details()
            else:
                raise ValueError(
                    f"Unsupported model format '{ext}'. Supported extensions are .h5, .keras, and .tflite."
                )
        except Exception as e:
            raise RuntimeError(f"Failed to load model '{self.model_path}': {e}") from e

        # After loading, populate supported classes
        # TODO: Replace this with real class labels. For example, you may
        # store class names in a JSON file alongside the model or as a
        # hard‑coded list. Here we provide a placeholder for demonstration.
        self.classes = [
            "hello", "world", "thank", "you", "please", "sorry", "yes", "no",
            "good", "bad", "happy", "sad", "love", "family", "friend", "help",
            "water", "food", "home", "work", "school", "car", "time", "day",
            "night", "sun", "moon", "red", "blue", "green", "big", "small"
        ]
        self.loaded = True

    def _predict_tflite(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """
        Perform inference using a TensorFlow Lite model.
        """
        input_tensor = image.astype(np.float32) / 255.0
        if len(input_tensor.shape) == 3:
            input_tensor = np.expand_dims(input_tensor, axis=0)
        self._interpreter.set_tensor(self._input_details[0]['index'], input_tensor)
        self._interpreter.invoke()
        output_data = self._interpreter.get_tensor(self._output_details[0]['index'])
        probs = output_data[0]
        top_indices = probs.argsort()[-3:][::-1]
        predictions: List[Dict[str, Any]] = []
        for idx in top_indices:
            predictions.append({
                "label": self.classes[idx] if idx < len(self.classes) else f"class_{idx}",
                "confidence": float(probs[idx]),
                "probability": float(probs[idx]),
            })
        return predictions

    def _predict_keras(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """
        Perform inference using a Keras model (SavedModel or .h5).
        """
        input_tensor = image.astype(np.float32) / 255.0
        if len(input_tensor.shape) == 3:
            input_tensor = np.expand_dims(input_tensor, axis=0)
        probs = self.model.predict(input_tensor)[0]
        top_indices = probs.argsort()[-3:][::-1]
        predictions: List[Dict[str, Any]] = []
        for idx in top_indices:
            predictions.append({
                "label": self.classes[idx] if idx < len(self.classes) else f"class_{idx}",
                "confidence": float(probs[idx]),
                "probability": float(probs[idx]),
            })
        return predictions

    def predict(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """
        Predict the hand sign for the given image.

        Delegates inference to the appropriate method based on the
        model file extension.
        """
        if not self.loaded:
            raise RuntimeError("Model is not loaded")
        ext = os.path.splitext(self.model_filename)[1].lower()
        if ext == ".tflite":
            return self._predict_tflite(image)
        else:
            return self._predict_keras(image)

    def get_name(self) -> str:
        return self.name

    def get_version(self) -> str:
        return self.version

    def get_classes(self) -> List[str]:
        return self.classes.copy()

    def is_loaded(self) -> bool:
        return self.loaded