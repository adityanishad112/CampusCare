from pydantic import BaseModel, Field
from typing import Optional, List

class PredictCategoryRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=5)
    location: Optional[str] = None

class CategoryConfidence(BaseModel):
    category: str
    probability: float

class PredictCategoryResponse(BaseModel):
    suggested_category: str
    confidence: float
    is_low_confidence: bool
    top_categories: List[CategoryConfidence]
    model_version: str

class PrioritySuggestionResponse(BaseModel):
    suggested_priority: str  # 'Low', 'Medium', 'High'
    reason: str
    is_rule_based: bool = True  # Transparently labeled as rule-based

class DuplicateSuggestionItem(BaseModel):
    complaint_id: int
    tracking_number: str
    title: str
    category: str
    location: str
    status: str
    similarity_score: float  # Distinct from classification confidence
    created_at: str

class DuplicateSuggestionResponse(BaseModel):
    has_potential_duplicates: bool
    suggestions: List[DuplicateSuggestionItem]

class LinkDuplicateRequest(BaseModel):
    primary_complaint_id: int
    duplicate_complaint_id: int
    notes: Optional[str] = None
