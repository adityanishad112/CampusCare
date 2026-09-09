import re
from typing import Dict, Any

HIGH_PRIORITY_PATTERNS = [
    (r"\b(spark|sparking|fire|smoke|shock|short circuit|burning smell|flame)\b", "Immediate electrical or fire hazard detected"),
    (r"\b(burst|flood|flooding|water leakage near|ceiling collapse|cracked glass falling)\b", "Structural or rapid water flooding hazard"),
    (r"\b(exam|examination|practical|viva|midterm|final|evaluation)\b", "Disrupts active examinations or academic evaluations"),
    (r"\b(fume hood|chemical spill|acid|toxic|biohazard|cylinder leak)\b", "Hazardous laboratory safety risk"),
    (r"\b(blackout|total power failure|ups dead|server down|data center)\b", "Critical campus-wide infrastructure interruption"),
    (r"\b(locked inside|jammed door|trapped|security breach|broken lock)\b", "Personal safety or physical security vulnerability")
]

LOW_PRIORITY_PATTERNS = [
    (r"\b(cosmetic|paint peeling|squeak|squeaky|dusty|minor scratch|faded)\b", "Cosmetic wear with no functional disruption"),
    (r"\b(suggestion|feature request|future improvement|feedback|aesthetic)\b", "Non-urgent enhancement request"),
    (r"\b(lost umbrella|lost water bottle|bicycle bell)\b", "Minor personal item query")
]

def suggest_priority(title: str, description: str, category: str = "") -> Dict[str, Any]:
    """
    Deterministically evaluates complaint text against campus safety,
    critical infrastructure, and academic urgency rules.
    This is explicitly rule-based, not an ML black box.
    """
    combined = f"{title} {description}".lower()

    # Check High Priority triggers
    for pattern, reason in HIGH_PRIORITY_PATTERNS:
        if re.search(pattern, combined):
            return {
                "suggested_priority": "High",
                "reason": f"Rule match: {reason}.",
                "is_rule_based": True
            }

    # Check Low Priority triggers
    for pattern, reason in LOW_PRIORITY_PATTERNS:
        if re.search(pattern, combined):
            return {
                "suggested_priority": "Low",
                "reason": f"Rule match: {reason}.",
                "is_rule_based": True
            }

    # Category-based default considerations
    if category in ["Electrical", "Plumbing"] and any(w in combined for w in ["leak", "broken", "overflow", "stuck"]):
        return {
            "suggested_priority": "Medium",
            "reason": "Utility maintenance requiring standard departmental attention within 24-48 hours.",
            "is_rule_based": True
        }

    # Default Medium
    return {
        "suggested_priority": "Medium",
        "reason": "Standard operational issue with moderate impact on daily activities.",
        "is_rule_based": True
    }
