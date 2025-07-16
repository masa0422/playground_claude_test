import pytest
import os
import tempfile
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from backend.main import app
from backend.database.database import Base, get_db
import sys

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Test database configuration
TEST_DATABASE_URL = "sqlite:///./test_wiki.db"

@pytest.fixture(scope="session")
def test_engine():
    engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)
    # Clean up test database file
    if os.path.exists("test_wiki.db"):
        os.remove("test_wiki.db")

@pytest.fixture(scope="function")
def test_db(test_engine):
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture(scope="function")
def client(test_db):
    def override_get_db():
        try:
            yield test_db
        finally:
            test_db.close()
    
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()

@pytest.fixture
def sample_article_data():
    return {
        "title": "Test Article",
        "content": "This is a test article content.",
        "tags": ["test", "sample"],
        "categories": []
    }

@pytest.fixture
def sample_category_data():
    return {
        "name": "Test Category",
        "description": "This is a test category",
        "color": "#FF0000"
    }

# Electron integration test fixtures
@pytest.fixture(scope="session")
def electron_test_env():
    """Setup environment for Electron integration tests"""
    # Set environment variables for testing
    os.environ["NODE_ENV"] = "test"
    os.environ["ELECTRON_IS_TEST"] = "true"
    os.environ["BACKEND_URL"] = "http://localhost:8000"
    
    yield
    
    # Cleanup
    os.environ.pop("NODE_ENV", None)
    os.environ.pop("ELECTRON_IS_TEST", None)
    os.environ.pop("BACKEND_URL", None)

@pytest.fixture
def health_check_endpoint():
    """Fixture for health check endpoint testing"""
    return "http://localhost:8000/health"