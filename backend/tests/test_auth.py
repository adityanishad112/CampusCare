import uuid

def test_public_registration_enforces_student_role(client):
    unique_email = f"newstudent_{uuid.uuid4().hex[:6]}@campuscare.edu"
    res = client.post("/api/v1/auth/register", json={
        "email": unique_email,
        "password": "Password123!",
        "full_name": "Test Enrolled Student"
    })
    assert res.status_code == 201
    data = res.json()
    assert data["email"] == unique_email
    assert data["role"] == "student"

def test_login_success(client):
    res = client.post("/api/v1/auth/login", json={
        "email": "alex.student@campuscare.edu",
        "password": "Student@123"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "student"

def test_login_failure_invalid_credentials(client):
    res = client.post("/api/v1/auth/login", json={
        "email": "alex.student@campuscare.edu",
        "password": "WrongPassword999"
    })
    assert res.status_code == 401

def test_get_current_user_profile(client, student_headers):
    res = client.get("/api/v1/auth/me", headers=student_headers)
    assert res.status_code == 200
    assert res.json()["email"] == "alex.student@campuscare.edu"

def test_admin_only_user_creation(client, student_headers, admin_headers):
    # Student cannot create admin or staff accounts
    res = client.post("/api/v1/auth/users", headers=student_headers, json={
        "email": "unauthorized@campuscare.edu",
        "password": "Pass123456",
        "full_name": "Bad Actor",
        "role": "staff",
        "department_id": 1
    })
    assert res.status_code == 403

    # Admin can create staff accounts
    staff_email = f"staff_{uuid.uuid4().hex[:6]}@campuscare.edu"
    res2 = client.post("/api/v1/auth/users", headers=admin_headers, json={
        "email": staff_email,
        "password": "Pass123456",
        "full_name": "Approved Staff",
        "role": "staff",
        "department_id": 1
    })
    assert res2.status_code == 201
    assert res2.json()["role"] == "staff"
