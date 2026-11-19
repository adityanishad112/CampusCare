import os
import re
import joblib
import logging
from typing import Dict, Any, List
from app.core.config import settings

logger = logging.getLogger(__name__)

class MLClassifier:
    _instance = None

    def __init__(self):
        self.model = None
        self.vectorizer = None
        self.categories = []
        self._load_artifacts()

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = MLClassifier()
        return cls._instance

    def _load_artifacts(self):
        model_path = os.path.join(settings.ML_ARTIFACTS_DIR, "classifier.joblib")
        vec_path = os.path.join(settings.ML_ARTIFACTS_DIR, "vectorizer.joblib")

        if os.path.exists(model_path) and os.path.exists(vec_path):
            try:
                self.model = joblib.load(model_path)
                self.vectorizer = joblib.load(vec_path)
                self.categories = list(self.model.classes_)
                logger.info(f"Loaded ML model with {len(self.categories)} categories: {self.categories}")
            except Exception as e:
                logger.error(f"Failed to load ML artifacts: {e}")
        else:
            logger.warning(f"ML artifacts not found at {settings.ML_ARTIFACTS_DIR}")

    def clean_text(self, text: str) -> str:
        text = text.lower().strip()
        text = re.sub(r"[^a-zA-Z0-9\s]", " ", text)
        text = re.sub(r"\s+", " ", text)
        return text

    def predict(self, title: str, description: str) -> Dict[str, Any]:
        combined_text = f"{title} {description}"
        cleaned = self.clean_text(combined_text)

        if not self.model or not self.vectorizer:
            # Fallback if model is not yet loaded
            return {
                "suggested_category": "Other",
                "confidence": 0.50,
                "is_low_confidence": True,
                "top_categories": [{"category": "Other", "probability": 0.50}],
                "model_version": "v1.0-baseline-fallback"
            }

        vec = self.vectorizer.transform([cleaned])
        probabilities = self.model.predict_proba(vec)[0]

        cat_probs = [
            {"category": cat, "probability": round(float(prob), 4)}
            for cat, prob in zip(self.categories, probabilities)
        ]
        cat_probs.sort(key=lambda x: x["probability"], reverse=True)

        top_pred = cat_probs[0]
        confidence = top_pred["probability"]
        is_low_confidence = confidence < 0.60

        return {
            "suggested_category": top_pred["category"],
            "confidence": confidence,
            "is_low_confidence": is_low_confidence,
            "top_categories": cat_probs[:3],
            "model_version": "v1.0-tfidf-logistic-regression"
        }

classifier_service = MLClassifier.get_instance()
