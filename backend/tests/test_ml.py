def test_ml_category_prediction(client, student_headers):
    payload = {
        "title": "Wi-Fi disconnected frequently in Hostel 4 Wing B",
        "description": "The wireless access point drops connection every 5 minutes."
    }
    res = client.post("/api/v1/ml/predict-category", headers=student_headers, json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["suggested_category"] == "IT and Wi-Fi"
    assert data["confidence"] > 0.50
    assert len(data["top_categories"]) > 0

def test_rule_based_priority_suggestion_high(client, student_headers):
    # Sparking / Fire triggers High priority
    res = client.post(
        "/api/v1/ml/suggest-priority?title=Sparking+in+switchboard&description=Smoke+and+flames+seen+outside+lab",
        headers=student_headers
    )
    assert res.status_code == 200
    data = res.json()
    assert data["suggested_priority"] == "High"
    assert data["is_rule_based"] is True
    assert "Rule match" in data["reason"]

def test_rule_based_priority_suggestion_low(client, student_headers):
    # Minor aesthetic triggers Low priority
    res = client.post(
        "/api/v1/ml/suggest-priority?title=Paint+peeling+in+hallway&description=Cosmetic+wear+on+the+wall",
        headers=student_headers
    )
    assert res.status_code == 200
    data = res.json()
    assert data["suggested_priority"] == "Low"
    assert data["is_rule_based"] is True

def test_metrics_reporting(client, student_headers):
    res = client.get("/api/v1/ml/metrics", headers=student_headers)
    assert res.status_code == 200
    data = res.json()
    assert "macro_f1" in data
    assert "confusion_matrix" in data
    assert "per_category" in data
