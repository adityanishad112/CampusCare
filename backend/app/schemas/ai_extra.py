from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class SentimentAnalysisRequest(BaseModel):
    text: str = Field(..., min_length=3)

class SentimentAnalysisResponse(BaseModel):
    sentiment: str = Field(..., description="'Frustrated', 'Urgent', 'Neutral', 'Positive'")
    urgency_score: int = Field(..., ge=1, le=100)
    escalation_risk: str = Field(..., description="'High', 'Medium', 'Low'")
    emotional_signals: List[str] = []
    explanation: str

class ETAPredictionRequest(BaseModel):
    category: str
    priority: str
    department_id: Optional[int] = None
    location: Optional[str] = ""

class ETAPredictionResponse(BaseModel):
    predicted_hours: float
    target_date: str
    confidence: float
    queue_length: int
    staff_count: int
    workload_status: str
    explanation: str

class ResolutionDraftRequest(BaseModel):
    complaint_id: Optional[int] = None
    title: str
    category: str
    description: str
    location: Optional[str] = ""
    action_taken: Optional[str] = ""

class ResolutionDraftResponse(BaseModel):
    technical_notes: str
    student_remarks: str
    preventive_measure: Optional[str] = None
    model_used: str = "v1.0-rule-template-hybrid"

class ExecutiveInsightItem(BaseModel):
    type: str = Field(..., description="'trend', 'bottleneck', 'anomaly', 'recommendation'")
    title: str
    description: str
    severity: str = Field(..., description="'info', 'warning', 'critical'")
    metric: Optional[str] = None

class ExecutiveInsightsResponse(BaseModel):
    summary: str
    total_active_complaints: int
    high_frustration_count: int
    bottleneck_departments: List[str]
    insights: List[ExecutiveInsightItem]
    generated_at: str
