"""
Pydantic models for DailyOS data structures.
"""

from datetime import datetime, date
from typing import Optional
from uuid import UUID, uuid4
from pydantic import BaseModel, Field, field_validator
import re


class RawEntry(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    user_id: UUID = Field(default_factory=uuid4)
    type: str = Field(...)  # thought|idea|action|event|mood|reminder|win|blocker|note
    content: str = Field(...)
    created_at: str = Field(...)  # ISO-8601
    tags: list[str] = Field(default_factory=list)
    mood_score: Optional[float] = None
    energy_score: Optional[float] = None
    metadata: dict = Field(default_factory=dict)

    @field_validator('type')
    @classmethod
    def validate_type(cls, v: str) -> str:
        allowed = {'thought', 'idea', 'action', 'event', 'mood', 'reminder', 'win', 'blocker', 'note'}
        if v not in allowed:
            raise ValueError(f"type must be one of {allowed}, got '{v}'")
        return v

    @field_validator('created_at')
    @classmethod
    def validate_created_at(cls, v: str) -> str:
        try:
            datetime.fromisoformat(v)
        except (ValueError, TypeError):
            raise ValueError(f"created_at must be ISO-8601, got '{v}'")
        return v

    @field_validator('mood_score')
    @classmethod
    def validate_mood_score(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and (v < 0 or v > 10):
            raise ValueError(f"mood_score must be between 0 and 10, got {v}")
        return v

    @field_validator('energy_score')
    @classmethod
    def validate_energy_score(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and (v < 0 or v > 10):
            raise ValueError(f"energy_score must be between 0 and 10, got {v}")
        return v


class DailySummary(BaseModel):
    date: str = Field(...)  # YYYY-MM-DD
    headline: str = Field(default='')
    summary: str = Field(default='')
    mood: dict = Field(default_factory=lambda: {
        'score': 0.0, 'energy': 0.0, 'stress': 0.0,
        'clarity': 0.0, 'satisfaction': 0.0, 'tags': []
    })
    highlights: list[str] = Field(default_factory=list)
    actions: dict = Field(default_factory=lambda: {
        'completed': [], 'in_progress': [], 'blocked': []
    })
    ideas: list[str] = Field(default_factory=list)
    events: list[str] = Field(default_factory=list)
    lessons: list[str] = Field(default_factory=list)
    tomorrow_focus: list[str] = Field(default_factory=list)
    reminder_ids: list[str] = Field(default_factory=list)
    source_entry_ids: list[str] = Field(default_factory=list)
    generated_at: str = Field(...)
    model_metadata: dict = Field(default_factory=lambda: {
        'provider': 'local', 'model': 'deterministic', 'prompt_version': '1.0'
    })

    @field_validator('date')
    @classmethod
    def validate_date(cls, v: str) -> str:
        if not re.match(r'^\d{4}-\d{2}-\d{2}$', v):
            raise ValueError(f"date must be YYYY-MM-DD format, got '{v}'")
        return v

    @field_validator('generated_at')
    @classmethod
    def validate_generated_at(cls, v: str) -> str:
        try:
            datetime.fromisoformat(v)
        except (ValueError, TypeError):
            raise ValueError(f"generated_at must be ISO-8601, got '{v}'")
        return v


class Idea(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    user_id: UUID = Field(default_factory=uuid4)
    content: str = Field(...)
    created_at: str = Field(...)  # ISO-8601
    tags: list[str] = Field(default_factory=list)
    theme: Optional[str] = None
    potential: Optional[int] = None
    status: str = Field(default='inbox')  # inbox|exploring|active|parked|archived
    next_action: Optional[str] = None
    review_date: Optional[str] = None

    @field_validator('status')
    @classmethod
    def validate_status(cls, v: str) -> str:
        allowed = {'inbox', 'exploring', 'active', 'parked', 'archived'}
        if v not in allowed:
            raise ValueError(f"status must be one of {allowed}, got '{v}'")
        return v

    @field_validator('created_at')
    @classmethod
    def validate_created_at(cls, v: str) -> str:
        try:
            datetime.fromisoformat(v)
        except (ValueError, TypeError):
            raise ValueError(f"created_at must be ISO-8601, got '{v}'")
        return v

    @field_validator('potential')
    @classmethod
    def validate_potential(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and (v < 1 or v > 10):
            raise ValueError(f"potential must be between 1 and 10, got {v}")
        return v


class Reminder(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    user_id: UUID = Field(default_factory=uuid4)
    title: str = Field(...)
    source: str = Field(default='manual')
    due_date: Optional[str] = None
    priority: str = Field(default='medium')  # high|medium|low
    status: str = Field(default='active')  # active|done|snoozed|cancelled
    category: str = Field(default='action')  # action|follow_up|review|open_loop
    created_at: str = Field(...)  # ISO-8601

    @field_validator('priority')
    @classmethod
    def validate_priority(cls, v: str) -> str:
        allowed = {'high', 'medium', 'low'}
        if v not in allowed:
            raise ValueError(f"priority must be one of {allowed}, got '{v}'")
        return v

    @field_validator('status')
    @classmethod
    def validate_status(cls, v: str) -> str:
        allowed = {'active', 'done', 'snoozed', 'cancelled'}
        if v not in allowed:
            raise ValueError(f"status must be one of {allowed}, got '{v}'")
        return v

    @field_validator('category')
    @classmethod
    def validate_category(cls, v: str) -> str:
        allowed = {'action', 'follow_up', 'review', 'open_loop'}
        if v not in allowed:
            raise ValueError(f"category must be one of {allowed}, got '{v}'")
        return v

    @field_validator('created_at')
    @classmethod
    def validate_created_at(cls, v: str) -> str:
        try:
            datetime.fromisoformat(v)
        except (ValueError, TypeError):
            raise ValueError(f"created_at must be ISO-8601, got '{v}'")
        return v


class WeeklyReview(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    user_id: UUID = Field(default_factory=uuid4)
    week_start: str = Field(...)  # YYYY-MM-DD
    week_end: str = Field(...)  # YYYY-MM-DD
    summary: str = Field(default='')
    wins: list[str] = Field(default_factory=list)
    challenges: list[str] = Field(default_factory=list)
    lessons: list[str] = Field(default_factory=list)
    next_week_focus: list[str] = Field(default_factory=list)
    avg_mood: float = 0.0
    avg_energy: float = 0.0
    total_entries: int = 0
    completed_actions: int = 0
    ideas_captured: int = 0
    generated_at: str = Field(...)

    @field_validator('week_start', 'week_end')
    @classmethod
    def validate_date(cls, v: str) -> str:
        if not re.match(r'^\d{4}-\d{2}-\d{2}$', v):
            raise ValueError(f"date must be YYYY-MM-DD format, got '{v}'")
        return v

    @field_validator('generated_at')
    @classmethod
    def validate_generated_at(cls, v: str) -> str:
        try:
            datetime.fromisoformat(v)
        except (ValueError, TypeError):
            raise ValueError(f"generated_at must be ISO-8601, got '{v}'")
        return v


class MonthlyReview(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    user_id: UUID = Field(default_factory=uuid4)
    month: str = Field(...)  # YYYY-MM
    year: int = Field(...)
    summary: str = Field(default='')
    wins: list[str] = Field(default_factory=list)
    challenges: list[str] = Field(default_factory=list)
    trends: list[str] = Field(default_factory=list)
    avg_mood: float = 0.0
    avg_energy: float = 0.0
    total_entries: int = 0
    completed_actions: int = 0
    ideas_captured: int = 0
    generated_at: str = Field(...)

    @field_validator('month')
    @classmethod
    def validate_month(cls, v: str) -> str:
        if not re.match(r'^\d{4}-\d{2}$', v):
            raise ValueError(f"month must be YYYY-MM format, got '{v}'")
        return v

    @field_validator('generated_at')
    @classmethod
    def validate_generated_at(cls, v: str) -> str:
        try:
            datetime.fromisoformat(v)
        except (ValueError, TypeError):
            raise ValueError(f"generated_at must be ISO-8601, got '{v}'")
        return v


class Insight(BaseModel):
    type: str = Field(...)
    observation: str = Field(...)
    hypothesis: Optional[str] = None
    confidence: Optional[str] = None
    source_entry_ids: list[str] = Field(default_factory=list)
    period_start: str = Field(...)
    period_end: str = Field(...)

    @field_validator('period_start', 'period_end')
    @classmethod
    def validate_date(cls, v: str) -> str:
        if not re.match(r'^\d{4}-\d{2}-\d{2}$', v):
            raise ValueError(f"date must be YYYY-MM-DD format, got '{v}'")
        return v


class UserSettings(BaseModel):
    user_id: UUID = Field(default_factory=uuid4)
    name: str = Field(default='')
    language: str = Field(default='fr')
    timezone: str = Field(default='Europe/Paris')
    theme: str = Field(default='light')
    notifications_enabled: bool = True
    auto_summarize: bool = True
    summary_time: str = Field(default='20:00')
    weekly_review_day: str = Field(default='Sunday')
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now().isoformat())
