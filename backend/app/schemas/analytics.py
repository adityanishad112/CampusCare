from pydantic import BaseModel
from typing import List, Dict, Optional

class CountByLabel(BaseModel):
    label: str
    count: int

class WeeklyTrendPoint(BaseModel):
    date: str  # e.g. "2026-03-01"
    submitted: int
    resolved: int

class DepartmentWorkload(BaseModel):
    department_id: int
    department_name: str
    total_complaints: int
    pending_complaints: int
    resolved_complaints: int
    avg_resolution_hours: float

class AnalyticsSummary(BaseModel):
    total_complaints: int
    submitted_count: int
    assigned_count: int
    in_progress_count: int
    resolved_count: int
    closed_count: int
    reopened_count: int
    avg_resolution_hours: float
    satisfaction_rate: float  # average feedback rating (1-5) or percentage
    categories_breakdown: List[CountByLabel]
    status_breakdown: List[CountByLabel]
    priority_breakdown: List[CountByLabel]
    weekly_trends: List[WeeklyTrendPoint]
    department_workloads: List[DepartmentWorkload]
