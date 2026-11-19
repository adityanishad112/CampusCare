import os
import json
from fastapi import APIRouter, HTTPException, Depends
from app.core.config import settings
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.ml import (
    PredictCategoryRequest, PredictCategoryResponse, PrioritySuggestionResponse
)
from app.services.ml_classifier import classifier_service
from app.services.priority_engine import suggest_priority

router = APIRouter(prefix="/ml", tags=["Machine Learning"])

@router.post("/predict-category", response_model=PredictCategoryResponse)
def predict_complaint_category(request: PredictCategoryRequest, current_user: User = Depends(get_current_user)):
    """
    Real-time machine learning prediction using TF-IDF + Logistic Regression.
    Returns suggested category, model confidence, and top candidate probabilities.
    Low confidence (< 60%) flags the prediction for administrative routing.
    """
    result = classifier_service.predict(request.title, request.description)
    return PredictCategoryResponse(**result)

@router.post("/suggest-priority", response_model=PrioritySuggestionResponse)
def get_priority_suggestion(
    title: str,
    description: str,
    category: str = "",
    current_user: User = Depends(get_current_user)
):
    """
    Deterministic rule-based priority suggestions.
    Transparently evaluates hazards, exam urgency, and infrastructure impact.
    """
    res = suggest_priority(title, description, category)
    return PrioritySuggestionResponse(**res)

@router.get("/metrics")
def get_model_evaluation_metrics(current_user: User = Depends(get_current_user)):
    """
    Returns the held-out evaluation report including Macro F1,
    per-category precision/recall, and confusion matrix.
    """
    metrics_path = os.path.join(settings.ML_ARTIFACTS_DIR, "evaluation_metrics.json")
    if not os.path.exists(metrics_path):
        raise HTTPException(
            status_code=404,
            detail="Evaluation metrics not found. Please run evaluate_classifier.py."
        )
    with open(metrics_path, "r") as f:
        data = json.load(f)
    return data
