"""Quick smoke test for all AI services - no DB required."""
import sys
import os
# Ensure backend root is in sys.path for 'app' imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.ai_sentiment_service import analyze_sentiment
from app.services.ai_eta_service import predict_resolution_eta
from app.services.ai_insights_service import generate_executive_insights
from app.services.ai_resolution_service import generate_resolution_draft

# 1. Sentiment Analysis
s = analyze_sentiment("The wifi is disconnected AGAIN!! This is unacceptable, third time this week!")
assert s["sentiment"] == "Frustrated", f"Expected Frustrated, got {s['sentiment']}"
assert s["urgency_score"] >= 60, f"Low urgency: {s['urgency_score']}"
assert s["escalation_risk"] == "High"
print(f"[PASS] Sentiment={s['sentiment']} Urgency={s['urgency_score']} Risk={s['escalation_risk']}")

# 2. Neutral sentiment
s2 = analyze_sentiment("The light bulb in Room 210 is not working.")
assert s2["sentiment"] in ("Neutral", "Urgent")
print(f"[PASS] Neutral sentiment={s2['sentiment']} score={s2['urgency_score']}")

# 3. ETA Prediction (no DB)
e = predict_resolution_eta("IT and Wi-Fi", "High", db=None, department_id=None)
assert e["predicted_hours"] > 0
assert e["target_date"] is not None
print(f"[PASS] ETA={e['predicted_hours']}h target={e['target_date']}")

# 4. Resolution Draft
r = generate_resolution_draft("Wifi not working in hostel room 310", "IT and Wi-Fi", "Wifi keeps dropping every hour")
assert len(r["technical_notes"]) > 20
assert len(r["student_remarks"]) > 10
print(f"[PASS] Draft snippet: {r['technical_notes'][:80]}...")

# 5. Executive Insights (requires DB - test with mock)
from unittest.mock import MagicMock
mock_db = MagicMock()
mock_db.query.return_value.filter.return_value.count.return_value = 5
mock_db.query.return_value.count.return_value = 50
mock_db.query.return_value.all.return_value = []
mock_db.query.return_value.filter.return_value.all.return_value = []
mock_db.query.return_value.group_by.return_value.order_by.return_value.all.return_value = [("IT and Wi-Fi", 20)]
mock_db.query.return_value.filter.return_value.limit.return_value.all.return_value = []
insights_result = generate_executive_insights(db=mock_db)
assert "insights" in insights_result
assert isinstance(insights_result["insights"], list)
print(f"[PASS] Insights count={len(insights_result['insights'])} | First: {insights_result['insights'][0]['type']}")

print("\n=== ALL 5 AI SERVICE TESTS PASSED ===")
import sys
sys.path.insert(0, ".")

from app.services.ai_sentiment_service import analyze_sentiment
from app.services.ai_eta_service import predict_resolution_eta
from app.services.ai_insights_service import generate_executive_insights
from app.services.ai_resolution_service import generate_resolution_draft

# 1. Sentiment Analysis
s = analyze_sentiment("The wifi is disconnected AGAIN!! This is unacceptable, third time this week!")
assert s["sentiment"] == "Frustrated", f"Expected Frustrated, got {s['sentiment']}"
assert s["urgency_score"] >= 60, f"Low urgency: {s['urgency_score']}"
assert s["escalation_risk"] == "High"
print(f"[PASS] Sentiment={s['sentiment']} Urgency={s['urgency_score']} Risk={s['escalation_risk']}")

# 2. Neutral sentiment
s2 = analyze_sentiment("The light bulb in Room 210 is not working.")
assert s2["sentiment"] in ("Neutral", "Urgent")
print(f"[PASS] Neutral sentiment={s2['sentiment']} score={s2['urgency_score']}")

# 3. ETA Prediction (no DB)
e = predict_resolution_eta("IT and Wi-Fi", "High", db=None, department_id=None)
assert e["predicted_hours"] > 0
assert e["target_date"] is not None
print(f"[PASS] ETA={e['predicted_hours']}h target={e['target_date']}")

# 4. Resolution Draft
r = generate_resolution_draft("Wifi not working in hostel room 310", "IT and Wi-Fi", "Wifi keeps dropping every hour")
assert len(r["technical_notes"]) > 20
assert len(r["student_remarks"]) > 10
print(f"[PASS] Draft snippet: {r['technical_notes'][:80]}...")

# 5. Executive Insights (requires DB - test with mock)
from unittest.mock import MagicMock
mock_db = MagicMock()
mock_db.query.return_value.filter.return_value.count.return_value = 5
mock_db.query.return_value.count.return_value = 50
mock_db.query.return_value.all.return_value = []
mock_db.query.return_value.filter.return_value.all.return_value = []
mock_db.query.return_value.group_by.return_value.order_by.return_value.all.return_value = [("IT and Wi-Fi", 20)]
mock_db.query.return_value.filter.return_value.limit.return_value.all.return_value = []
insights_result = generate_executive_insights(db=mock_db)
assert "insights" in insights_result
assert isinstance(insights_result["insights"], list)
print(f"[PASS] Insights count={len(insights_result['insights'])} | First: {insights_result['insights'][0]['type']}")

print("\n=== ALL 5 AI SERVICE TESTS PASSED ===")
