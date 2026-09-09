def test_student_data_isolation(client, student_headers, other_student_headers):
    # Student 1 creates a complaint
    res = client.post("/api/v1/complaints/", headers=student_headers, json={
        "title": "Private student test issue",
        "description": "Student 1 private confidential complaint text.",
        "category": "Hostel maintenance",
        "location": "Room 101"
    })
    cid = res.json()["id"]

    # Student 2 tries to view Student 1's complaint -> 403 Forbidden!
    forbidden_res = client.get(f"/api/v1/complaints/{cid}", headers=other_student_headers)
    assert forbidden_res.status_code == 403

def test_staff_department_isolation(client, student_headers, it_staff_headers, elec_staff_headers):
    # Submit electrical complaint
    res = client.post("/api/v1/complaints/", headers=student_headers, json={
        "title": "Circuit breaker issue in workshop",
        "description": "Electrical tripping problem.",
        "category": "Electrical",
        "location": "Workshop B"
    })
    cid = res.json()["id"]

    # IT Staff tries to view or claim electrical complaint -> 403 Forbidden!
    it_view = client.get(f"/api/v1/complaints/{cid}", headers=it_staff_headers)
    assert it_view.status_code == 403

    it_claim = client.post(f"/api/v1/complaints/{cid}/claim", headers=it_staff_headers)
    assert it_claim.status_code == 403

    # Electrical staff CAN view complaint
    elec_view = client.get(f"/api/v1/complaints/{cid}", headers=elec_staff_headers)
    assert elec_view.status_code == 200

def test_internal_notes_hidden_from_student(client, student_headers, it_staff_headers):
    # IT staff adds internal note to complaint 1
    client.post("/api/v1/complaints/1/comments", headers=it_staff_headers, json={
        "content": "Secret technician password and internal diagnostic notes.",
        "is_internal": True
    })

    # Student views complaint 1
    res = client.get("/api/v1/complaints/1", headers=student_headers)
    assert res.status_code == 200
    comments = res.json()["comments"]
    # Verify no internal notes are visible to student
    for c in comments:
        assert c["is_internal"] is False
        assert "Secret technician password" not in c["content"]
