def test_student_submit_complaint(client, student_headers):
    payload = {
        "title": "Broken cold water dispenser valve near library 2nd floor",
        "description": "The water cooler is leaking and the push tap valve is stuck open.",
        "category": "Plumbing",
        "location": "Central Library, 2nd Floor Water Station",
        "priority": "Medium",
        "priority_reason": "Utility maintenance requiring standard attention."
    }
    res = client.post("/api/v1/complaints/", headers=student_headers, json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["tracking_number"].startswith("CMP-")
    assert data["status"] == "Submitted"
    assert data["category"] == "Plumbing"
    assert data["department_name"] == "Plumbing & Water Supply Department"

def test_workflow_status_transitions(client, student_headers, it_staff_headers):
    # 1. Student submits IT complaint
    res1 = client.post("/api/v1/complaints/", headers=student_headers, json={
        "title": "Lab 103 switch port disconnected",
        "description": "Ethernet wall socket has no link light.",
        "category": "IT and Wi-Fi",
        "location": "Computer Lab 103"
    })
    assert res1.status_code == 201
    cid = res1.json()["id"]

    # 2. Staff claims complaint -> In Progress
    res2 = client.post(f"/api/v1/complaints/{cid}/claim", headers=it_staff_headers)
    assert res2.status_code == 200
    assert res2.json()["status"] == "In Progress"

    # 3. Staff resolves complaint with resolution notes
    res3 = client.post(f"/api/v1/complaints/{cid}/transition", headers=it_staff_headers, json={
        "new_status": "Resolved",
        "remarks": "Re-crimped RJ45 connector and tested ping",
        "resolution_notes": "Re-terminated CAT6 cable and verified 1 Gbps link."
    })
    assert res3.status_code == 200
    assert res3.json()["status"] == "Resolved"
    assert res3.json()["resolution_notes"] is not None

    # 4. Student closes complaint
    res4 = client.post(f"/api/v1/complaints/{cid}/transition", headers=student_headers, json={
        "new_status": "Closed",
        "remarks": "Internet link is working now, thank you."
    })
    assert res4.status_code == 200
    assert res4.json()["status"] == "Closed"

    # 5. Invalid transition: cannot move directly from Closed to In Progress
    res5 = client.post(f"/api/v1/complaints/{cid}/transition", headers=it_staff_headers, json={
        "new_status": "In Progress"
    })
    assert res5.status_code == 400

def test_reopen_complaint_flow(client, student_headers, it_staff_headers):
    # 1. Create and fast-track to Resolved
    res1 = client.post("/api/v1/complaints/", headers=student_headers, json={
        "title": "Projector HDMI cable faulty in Room 202",
        "description": "HDMI cable has loose pin and blinks purple.",
        "category": "IT and Wi-Fi",
        "location": "Classroom 202"
    })
    cid = res1.json()["id"]
    client.post(f"/api/v1/complaints/{cid}/claim", headers=it_staff_headers)
    client.post(f"/api/v1/complaints/{cid}/transition", headers=it_staff_headers, json={
        "new_status": "Resolved",
        "resolution_notes": "Taped cable tightly."
    })

    # 2. Student reopens with reason
    reopen_res = client.post(f"/api/v1/complaints/{cid}/reopen", headers=student_headers, json={
        "reopened_reason": "Cable is still dropping signal when touched. Need brand new replacement cable."
    })
    assert reopen_res.status_code == 200
    data = reopen_res.json()
    assert data["status"] == "Reopened"
    assert "reopened_reason" in data

def test_complaint_photo_and_voice_attachments(client, student_headers):
    # 1. Create a complaint
    res = client.post("/api/v1/complaints/", headers=student_headers, json={
        "title": "Air conditioning unit leaking water in Lab 301",
        "description": "Water is dripping directly over computer terminal 12.",
        "category": "Electrical",
        "location": "Academic Block B, Lab 301"
    })
    assert res.status_code == 201
    cid = res.json()["id"]

    # 2. Upload photo evidence (PNG)
    dummy_photo = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR" + b"fake_png_content"
    photo_res = client.post(
        f"/api/v1/complaints/{cid}/attachments",
        headers=student_headers,
        files={"file": ("ac_leak.png", dummy_photo, "image/png")}
    )
    assert photo_res.status_code == 201
    photo_data = photo_res.json()
    assert photo_data["original_name"] == "ac_leak.png"
    assert photo_data["file_url"].startswith("/uploads/")
    photo_id = photo_data["id"]

    # 3. Upload voice note recording (WebM / Audio)
    dummy_voice = b"\x1a\x45\xdf\xa3fake_webm_audio_sample_bytes"
    voice_res = client.post(
        f"/api/v1/complaints/{cid}/attachments",
        headers=student_headers,
        files={"file": ("voice_memo.webm", dummy_voice, "audio/webm")}
    )
    assert voice_res.status_code == 201
    voice_data = voice_res.json()
    assert voice_data["original_name"] == "voice_memo.webm"
    assert "audio/webm" in voice_data["content_type"]
    voice_id = voice_data["id"]

    # 4. Fetch complaint detail to ensure attachments are listed
    detail_res = client.get(f"/api/v1/complaints/{cid}", headers=student_headers)
    assert detail_res.status_code == 200
    detail_data = detail_res.json()
    assert len(detail_data["attachments"]) == 2
    assert detail_data["attachments_count"] == 2

    # 5. Verify download endpoint with header auth
    dl_res = client.get(f"/api/v1/complaints/{cid}/attachments/{voice_id}/download", headers=student_headers)
    assert dl_res.status_code == 200
    assert dl_res.content == dummy_voice

    # 6. Verify download endpoint with ?token= query auth (for HTML5 <audio> / <img> tags)
    token = student_headers["Authorization"].split(" ")[1]
    dl_token_res = client.get(f"/api/v1/complaints/{cid}/attachments/{photo_id}/download?token={token}")
    assert dl_token_res.status_code == 200
    assert dl_token_res.content == dummy_photo
