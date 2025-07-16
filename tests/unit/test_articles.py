import pytest
from fastapi.testclient import TestClient
import json

def test_get_articles_empty(client: TestClient):
    """Test GET /api/v1/articles returns empty list initially"""
    response = client.get("/api/v1/articles/")
    assert response.status_code == 200
    assert response.json() == []

def test_create_article(client: TestClient, sample_article_data):
    """Test POST /api/v1/articles creates a new article"""
    response = client.post("/api/v1/articles/", json=sample_article_data)
    assert response.status_code == 200
    
    data = response.json()
    assert data["title"] == sample_article_data["title"]
    assert data["content"] == sample_article_data["content"]
    assert data["tags"] == sample_article_data["tags"]
    assert data["version"] == 1
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data

def test_create_article_invalid_data(client: TestClient):
    """Test POST /api/v1/articles with invalid data returns 422"""
    invalid_data = {
        "title": "",  # Empty title should be invalid
        "content": "Test content"
    }
    response = client.post("/api/v1/articles/", json=invalid_data)
    assert response.status_code == 422

def test_get_article_by_id(client: TestClient, sample_article_data):
    """Test GET /api/v1/articles/{id} returns specific article"""
    # First create an article
    create_response = client.post("/api/v1/articles/", json=sample_article_data)
    assert create_response.status_code == 200
    created_article = create_response.json()
    
    # Then get it by ID
    response = client.get(f"/api/v1/articles/{created_article['id']}")
    assert response.status_code == 200
    
    data = response.json()
    assert data["id"] == created_article["id"]
    assert data["title"] == sample_article_data["title"]
    assert data["content"] == sample_article_data["content"]

def test_get_article_not_found(client: TestClient):
    """Test GET /api/v1/articles/{id} with non-existent ID returns 404"""
    response = client.get("/api/v1/articles/nonexistent-id")
    assert response.status_code == 404
    assert "Article not found" in response.json()["detail"]

def test_update_article(client: TestClient, sample_article_data):
    """Test PUT /api/v1/articles/{id} updates an existing article"""
    # First create an article
    create_response = client.post("/api/v1/articles/", json=sample_article_data)
    assert create_response.status_code == 200
    created_article = create_response.json()
    
    # Update the article
    update_data = {
        "title": "Updated Test Article",
        "content": "This is updated content.",
        "tags": ["updated", "test"]
    }
    
    response = client.put(f"/api/v1/articles/{created_article['id']}", json=update_data)
    assert response.status_code == 200
    
    data = response.json()
    assert data["title"] == update_data["title"]
    assert data["content"] == update_data["content"]
    assert data["tags"] == update_data["tags"]
    assert data["version"] == 2  # Version should increment

def test_update_article_not_found(client: TestClient):
    """Test PUT /api/v1/articles/{id} with non-existent ID returns 404"""
    update_data = {
        "title": "Updated Title",
        "content": "Updated content"
    }
    response = client.put("/api/v1/articles/nonexistent-id", json=update_data)
    assert response.status_code == 404
    assert "Article not found" in response.json()["detail"]

def test_delete_article(client: TestClient, sample_article_data):
    """Test DELETE /api/v1/articles/{id} deletes an existing article"""
    # First create an article
    create_response = client.post("/api/v1/articles/", json=sample_article_data)
    assert create_response.status_code == 200
    created_article = create_response.json()
    
    # Delete the article
    response = client.delete(f"/api/v1/articles/{created_article['id']}")
    assert response.status_code == 200
    assert "Article deleted successfully" in response.json()["message"]
    
    # Verify it's deleted
    get_response = client.get(f"/api/v1/articles/{created_article['id']}")
    assert get_response.status_code == 404

def test_delete_article_not_found(client: TestClient):
    """Test DELETE /api/v1/articles/{id} with non-existent ID returns 404"""
    response = client.delete("/api/v1/articles/nonexistent-id")
    assert response.status_code == 404
    assert "Article not found" in response.json()["detail"]

def test_get_articles_with_pagination(client: TestClient, sample_article_data):
    """Test GET /api/v1/articles with pagination parameters"""
    # Create multiple articles
    for i in range(5):
        article_data = sample_article_data.copy()
        article_data["title"] = f"Test Article {i}"
        client.post("/api/v1/articles/", json=article_data)
    
    # Test pagination
    response = client.get("/api/v1/articles/?skip=0&limit=2")
    assert response.status_code == 200
    assert len(response.json()) == 2
    
    response = client.get("/api/v1/articles/?skip=2&limit=2")
    assert response.status_code == 200
    assert len(response.json()) == 2

def test_get_article_history(client: TestClient, sample_article_data):
    """Test GET /api/v1/articles/{id}/history returns article history"""
    # Create an article
    create_response = client.post("/api/v1/articles/", json=sample_article_data)
    assert create_response.status_code == 200
    created_article = create_response.json()
    
    # Get history
    response = client.get(f"/api/v1/articles/{created_article['id']}/history")
    assert response.status_code == 200
    
    history = response.json()
    assert len(history) == 1  # Should have one history entry (creation)
    assert history[0]["change_type"] == "created"
    assert history[0]["article_id"] == created_article["id"]

def test_get_article_history_not_found(client: TestClient):
    """Test GET /api/v1/articles/{id}/history with non-existent ID returns 404"""
    response = client.get("/api/v1/articles/nonexistent-id/history")
    assert response.status_code == 404
    assert "Article not found" in response.json()["detail"]