import re
import os
import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

FRUSTRATION_KEYWORDS = [
    "unacceptable", "disgusting", "terrible", "worst", "fed up", "ridiculous", "shame",
    "useless", "pathetic", "no one cares", "nobody cares", "third time", "3rd time",
    "second time", "2nd time", "again and again", "how many times", "still not fixed",
    "ignored", "no response", "days ago", "sick of this", "repeatedly", "suffering",
    "ruined", "horrible", "unbearable", "waste of time"
]

URGENT_SAFETY_KEYWORDS = [
    "fire", "smoke", "spark", "sparking", "shock", "flood", "flooding", "burst",
    "urgent", "danger", "hazard", "bleeding", "injury", "exam", "tomorrow",
    "immediate", "cannot sleep", "cannot study", "overflowing", "chemical", "spill",
    "trapped", "locked out", "unsafe"
]

POSITIVE_KEYWORDS = [
    "thanks", "thank you", "great", "excellent", "fast", "appreciate", "helpful",
    "good job", "satisfied", "resolved", "awesome"
]

def analyze_sentiment(text: str) -> Dict[str, Any]:
    """
    NLP sentiment, frustration, and escalation risk evaluation.
    Evaluates emotional distress, urgency, and repeat grievance indicators.
    """
    clean_text = text.lower().strip()
    words = set(re.findall(r"\b\w+\b", clean_text))

    signals: List[str] = []
    urgency_score = 35  # baseline score for standard complaint

    # Check frustration indicators
    frustration_count = 0
    for pattern in FRUSTRATION_KEYWORDS:
        if pattern in clean_text:
            frustration_count += 1
            signals.append(f"Repeat/Frustration phrase: '{pattern}'")

    # Check urgent safety indicators
    urgent_count = 0
    for pattern in URGENT_SAFETY_KEYWORDS:
        if pattern in clean_text:
            urgent_count += 1
            signals.append(f"Safety/Urgency trigger: '{pattern}'")

    # Check positive indicators
    positive_count = 0
    for pattern in POSITIVE_KEYWORDS:
        if pattern in clean_text:
            positive_count += 1

    # Check typographical emotional cues (multiple exclamation marks or caps lock)
    if re.search(r"!{2,}", text):
        urgency_score += 10
        signals.append("High typographical emphasis ('!!')")

    caps_words = [w for w in text.split() if w.isupper() and len(w) >= 3 and w not in ["CMP", "FAQ", "RAM", "LAN", "DNS", "POE", "MCB", "RGB", "UPS", "HDMI", "VGA"]]
    if len(caps_words) >= 2:
        urgency_score += 10
        signals.append(f"Capitals emphasis ({', '.join(caps_words[:3])})")

    # Score calculations
    urgency_score += (frustration_count * 18) + (urgent_count * 20)
    if positive_count > 0:
        urgency_score -= (positive_count * 15)

    urgency_score = max(5, min(99, urgency_score))

    # Categorize Sentiment and Escalation Risk
    if frustration_count >= 1 or urgency_score >= 75:
        sentiment = "Frustrated"
        escalation_risk = "High"
        explanation = f"Student shows significant distress or reported recurring issue ({len(signals)} emotional signal{'s' if len(signals) > 1 else ''}). Priority attention recommended."
    elif urgent_count >= 1 or urgency_score >= 60:
        sentiment = "Urgent"
        escalation_risk = "Medium"
        explanation = "Time-sensitive or safety-impacting issue detected. Requires standard timely departmental action."
    elif positive_count >= 1 and frustration_count == 0:
        sentiment = "Positive"
        escalation_risk = "Low"
        explanation = "Constructive or courteous tone with zero conflict indicators."
    else:
        sentiment = "Neutral"
        escalation_risk = "Low"
        explanation = "Objective factual report with standard impact on daily campus activities."

    return {
        "sentiment": sentiment,
        "urgency_score": urgency_score,
        "escalation_risk": escalation_risk,
        "emotional_signals": signals[:5],
        "explanation": explanation
    }
