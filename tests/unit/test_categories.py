import pytest
from fastapi.testclient import TestClient

def test_get_categories_empty(client: TestClient):
    """Test GET /api/v1/categories returns empty list initially"""
    response = client.get("/api/v1/categories/")
    assert response.status_code == 200
    assert response.json() == []

def test_create_category(client: TestClient, sample_category_data):
    """Test POST /api/v1/categories creates a new category"""
    response = client.post("/api/v1/categories/", json=sample_category_data)
    assert response.status_code == 200
    
    data = response.json()
    assert data["name"] == sample_category_data["name"]
    assert data["description"] == sample_category_data["description"]
    assert data["color"] == sample_category_data["color"]
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data

def test_create_category_invalid_data(client: TestClient):
    """Test POST /api/v1/categories with invalid data returns 422"""
    invalid_data = {
        "name": "",  # Empty name should be invalid
        "description": "Test description"
    }
    response = client.post("/api/v1/categories/", json=invalid_data)
    assert response.status_code == 422

def test_create_category_invalid_color(client: TestClient):
    """Test POST /api/v1/categories with invalid color format returns 422"""
    invalid_data = {
        "name": "Test Category",
        "description": "Test description",
        "color": "invalid-color"  # Invalid hex color
    }
    response = client.post("/api/v1/categories/", json=invalid_data)
    assert response.status_code == 422

def test_get_category_by_id(client: TestClient, sample_category_data):
    """Test GET /api/v1/categories/{id} returns specific category"""
    # First create a category
    create_response = client.post("/api/v1/categories/", json=sample_category_data)
    assert create_response.status_code == 200
    created_category = create_response.json()
    
    # Then get it by ID
    response = client.get(f"/api/v1/categories/{created_category['id']}")
    assert response.status_code == 200
    
    data = response.json()
    assert data["id"] == created_category["id"]
    assert data["name"] == sample_category_data["name"]
    assert data["description"] == sample_category_data["description"]

def test_get_category_not_found(client: TestClient):
    """Test GET /api/v1/categories/{id} with non-existent ID returns 404"""
    response = client.get("/api/v1/categories/nonexistent-id")
    assert response.status_code == 404
    assert "Category not found" in response.json()["detail"]

def test_update_category(client: TestClient, sample_category_data):
    """Test PUT /api/v1/categories/{id} updates an existing category"""
    # First create a category
    create_response = client.post("/api/v1/categories/", json=sample_category_data)
    assert create_response.status_code == 200
    created_category = create_response.json()
    
    # Update the category
    update_data = {
        "name": "Updated Test Category",
        "description": "Updated description",
        "color": "#00FF00"
    }
    
    response = client.put(f"/api/v1/categories/{created_category['id']}", json=update_data)
    assert response.status_code == 200
    
    data = response.json()
    assert data["name"] == update_data["name"]
    assert data["description"] == update_data["description"]
    assert data["color"] == update_data["color"]

def test_update_category_not_found(client: TestClient):
    """Test PUT /api/v1/categories/{id} with non-existent ID returns 404"""
    update_data = {
        "name": "Updated Category",
        "description": "Updated description"
    }
    response = client.put("/api/v1/categories/nonexistent-id", json=update_data)
    assert response.status_code == 404
    assert "Category not found" in response.json()["detail"]

def test_delete_category(client: TestClient, sample_category_data):
    """Test DELETE /api/v1/categories/{id} deletes an existing category"""
    # First create a category
    create_response = client.post("/api/v1/categories/", json=sample_category_data)
    assert create_response.status_code == 200
    created_category = create_response.json()
    
    # Delete the category
    response = client.delete(f"/api/v1/categories/{created_category['id']}")
    assert response.status_code == 200
    assert "Category deleted successfully" in response.json()["message"]
    
    # Verify it's deleted
    get_response = client.get(f"/api/v1/categories/{created_category['id']}")
    assert get_response.status_code == 404

def test_delete_category_not_found(client: TestClient):
    """Test DELETE /api/v1/categories/{id} with non-existent ID returns 404"""
    response = client.delete("/api/v1/categories/nonexistent-id")
    assert response.status_code == 404
    assert "Category not found" in response.json()["detail"]

def test_get_root_categories(client: TestClient, sample_category_data):
    """Test GET /api/v1/categories/roots returns only root categories"""
    # Create a root category
    root_data = sample_category_data.copy()
    root_data["name"] = "Root Category"
    
    create_response = client.post("/api/v1/categories/", json=root_data)
    assert create_response.status_code == 200
    root_category = create_response.json()
    
    # Create a child category
    child_data = sample_category_data.copy()
    child_data["name"] = "Child Category"
    child_data["parent_id"] = root_category["id"]
    
    client.post("/api/v1/categories/", json=child_data)
    
    # Get root categories
    response = client.get("/api/v1/categories/roots")
    assert response.status_code == 200
    
    roots = response.json()
    assert len(roots) == 1
    assert roots[0]["id"] == root_category["id"]
    assert roots[0]["name"] == "Root Category"

def test_get_categories_with_pagination(client: TestClient, sample_category_data):
    """Test GET /api/v1/categories with pagination parameters"""
    # Create multiple categories
    for i in range(5):
        category_data = sample_category_data.copy()
        category_data["name"] = f"Test Category {i}"
        client.post("/api/v1/categories/", json=category_data)
    
    # Test pagination
    response = client.get("/api/v1/categories/?skip=0&limit=2")
    assert response.status_code == 200
    assert len(response.json()) == 2
    
    response = client.get("/api/v1/categories/?skip=2&limit=2")
    assert response.status_code == 200
    assert len(response.json()) == 2