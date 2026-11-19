import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token
from app.core.database import SessionLocal
from app.models.user import User

@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c

@pytest.fixture(scope="session")
def db():
    session = SessionLocal()
    yield session
    session.close()

@pytest.fixture(scope="session")
def student_headers(db):
    user = db.query(User).filter(User.email == "alex.student@campuscare.edu").first()
    token = create_access_token(subject=str(user.id), role=user.role)
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="session")
def other_student_headers(db):
    user = db.query(User).filter(User.email == "maria.student@campuscare.edu").first()
    token = create_access_token(subject=str(user.id), role=user.role)
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="session")
def it_staff_headers(db):
    user = db.query(User).filter(User.email == "it_staff@campuscare.edu").first()
    token = create_access_token(subject=str(user.id), role=user.role)
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="session")
def elec_staff_headers(db):
    user = db.query(User).filter(User.email == "electrical_staff@campuscare.edu").first()
    token = create_access_token(subject=str(user.id), role=user.role)
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="session")
def admin_headers(db):
    user = db.query(User).filter(User.email == "admin@campuscare.edu").first()
    token = create_access_token(subject=str(user.id), role=user.role)
    return {"Authorization": f"Bearer {token}"}
