"""
Comprehensive Endpoint Tests for Docker Environment
Tests all API endpoints to ensure they return status_code == 200 and proper JSON response
"""
import pytest
import httpx
import json
from typing import Dict, Any
from datetime import datetime

# Base URL for Docker environment
BASE_URL = "http://backend:8000"

class TestEndpoints:
    """Test all API endpoints in Docker environment"""
    
    def setup_method(self):
        """Setup test client for each test method"""
        self.client = httpx.Client(base_url=BASE_URL, timeout=30.0)
        # Clear any existing data
        self.cleanup_test_data()

    def teardown_method(self):
        """Cleanup after each test"""
        self.cleanup_test_data()
        self.client.close()

    def cleanup_test_data(self):
        """Clean up any test data"""
        try:
            # Get all articles and delete them
            articles_response = self.client.get("/api/v1/articles/")
            if articles_response.status_code == 200:
                articles = articles_response.json()
                for article in articles:
                    self.client.delete(f"/api/v1/articles/{article['id']}")
            
            # Get all categories and delete them
            categories_response = self.client.get("/api/v1/categories/")
            if categories_response.status_code == 200:
                categories = categories_response.json()
                for category in categories:
                    self.client.delete(f"/api/v1/categories/{category['id']}")
        except Exception as e:
            print(f"Cleanup error: {e}")

    def test_root_endpoint(self):
        """Test root endpoint"""
        response = self.client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "Wiki Desktop API is running"

    def test_health_endpoint(self):
        """Test health check endpoint"""
        response = self.client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert data["status"] == "healthy"
        assert "service" in data

    def test_articles_create_endpoint(self):
        """Test POST /api/v1/articles/"""
        article_data = {
            "title": "Test Article",
            "content": "This is a test article content",
            "tags": ["test", "article"]
        }
        
        response = self.client.post("/api/v1/articles/", json=article_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "id" in data
        assert data["title"] == article_data["title"]
        assert data["content"] == article_data["content"]
        assert data["tags"] == article_data["tags"]
        assert data["version"] == 1
        assert "created_at" in data
        assert "updated_at" in data
        
        # Store for cleanup
        self.test_article_id = data["id"]

    def test_articles_list_endpoint(self):
        """Test GET /api/v1/articles/"""
        # Create test article first
        article_data = {
            "title": "List Test Article",
            "content": "Content for list test",
            "tags": ["list", "test"]
        }
        create_response = self.client.post("/api/v1/articles/", json=article_data)
        assert create_response.status_code == 200
        
        # Test list endpoint
        response = self.client.get("/api/v1/articles/")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        
        # Check first article structure
        article = data[0]
        assert "id" in article
        assert "title" in article
        assert "content" in article
        assert "tags" in article
        assert "version" in article
        assert "created_at" in article
        assert "updated_at" in article
        assert "categories" in article
        assert "excerpt" in article

    def test_articles_get_single_endpoint(self):
        """Test GET /api/v1/articles/{article_id}"""
        # Create test article first
        article_data = {
            "title": "Single Test Article",
            "content": "Content for single test",
            "tags": ["single", "test"]
        }
        create_response = self.client.post("/api/v1/articles/", json=article_data)
        assert create_response.status_code == 200
        created_article = create_response.json()
        
        # Test get single endpoint
        response = self.client.get(f"/api/v1/articles/{created_article['id']}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["id"] == created_article["id"]
        assert data["title"] == article_data["title"]
        assert data["content"] == article_data["content"]
        assert data["tags"] == article_data["tags"]

    def test_articles_update_endpoint(self):
        """Test PUT /api/v1/articles/{article_id}"""
        # Create test article first
        article_data = {
            "title": "Update Test Article",
            "content": "Original content",
            "tags": ["update", "test"]
        }
        create_response = self.client.post("/api/v1/articles/", json=article_data)
        assert create_response.status_code == 200
        created_article = create_response.json()
        
        # Update the article
        update_data = {
            "title": "Updated Test Article",
            "content": "Updated content",
            "tags": ["updated", "test"]
        }
        
        response = self.client.put(f"/api/v1/articles/{created_article['id']}", json=update_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["id"] == created_article["id"]
        assert data["title"] == update_data["title"]
        assert data["content"] == update_data["content"]
        assert data["tags"] == update_data["tags"]
        assert data["version"] == 2  # Version should increment

    def test_articles_delete_endpoint(self):
        """Test DELETE /api/v1/articles/{article_id}"""
        # Create test article first
        article_data = {
            "title": "Delete Test Article",
            "content": "Content to be deleted",
            "tags": ["delete", "test"]
        }
        create_response = self.client.post("/api/v1/articles/", json=article_data)
        assert create_response.status_code == 200
        created_article = create_response.json()
        
        # Delete the article
        response = self.client.delete(f"/api/v1/articles/{created_article['id']}")
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
        assert "deleted" in data["message"].lower()
        
        # Verify article is deleted
        get_response = self.client.get(f"/api/v1/articles/{created_article['id']}")
        assert get_response.status_code == 404

    def test_articles_history_endpoint(self):
        """Test GET /api/v1/articles/{article_id}/history"""
        # Create test article first
        article_data = {
            "title": "History Test Article",
            "content": "Original content",
            "tags": ["history", "test"]
        }
        create_response = self.client.post("/api/v1/articles/", json=article_data)
        assert create_response.status_code == 200
        created_article = create_response.json()
        
        # Update the article to create history
        update_data = {
            "title": "Updated History Test Article",
            "content": "Updated content"
        }
        update_response = self.client.put(f"/api/v1/articles/{created_article['id']}", json=update_data)
        assert update_response.status_code == 200
        
        # Test history endpoint
        response = self.client.get(f"/api/v1/articles/{created_article['id']}/history")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        
        # Check history entry structure
        history_entry = data[0]
        assert "id" in history_entry
        assert "article_id" in history_entry
        assert "change_type" in history_entry
        assert "version" in history_entry
        assert "created_at" in history_entry

    def test_search_articles_endpoint(self):
        """Test GET /api/v1/search/articles"""
        # Create test article first
        article_data = {
            "title": "Search Test Article",
            "content": "This article contains searchable content",
            "tags": ["search", "test"]
        }
        create_response = self.client.post("/api/v1/articles/", json=article_data)
        assert create_response.status_code == 200
        
        # Test search endpoint
        response = self.client.get("/api/v1/search/articles?q=searchable")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        
        # Check search result structure
        result = data[0]
        assert "id" in result
        assert "title" in result
        assert "content" in result
        assert "tags" in result
        assert "excerpt" in result

    def test_search_suggestions_endpoint(self):
        """Test GET /api/v1/search/suggestions"""
        # Create test article first
        article_data = {
            "title": "Suggestions Test Article",
            "content": "Content for suggestions",
            "tags": ["suggestions", "test"]
        }
        create_response = self.client.post("/api/v1/articles/", json=article_data)
        assert create_response.status_code == 200
        
        # Test suggestions endpoint
        response = self.client.get("/api/v1/search/suggestions?q=suggestions")
        assert response.status_code == 200
        
        data = response.json()
        assert "suggestions" in data
        assert isinstance(data["suggestions"], list)
        
        if len(data["suggestions"]) > 0:
            suggestion = data["suggestions"][0]
            assert "id" in suggestion
            assert "title" in suggestion
            assert "type" in suggestion

    def test_categories_create_endpoint(self):
        """Test POST /api/v1/categories/"""
        category_data = {
            "name": "Test Category",
            "description": "This is a test category",
            "color": "#FF0000"
        }
        
        response = self.client.post("/api/v1/categories/", json=category_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "id" in data
        assert data["name"] == category_data["name"]
        assert data["description"] == category_data["description"]
        assert data["color"] == category_data["color"]
        assert "created_at" in data
        assert "updated_at" in data
        assert "children" in data

    def test_categories_list_endpoint(self):
        """Test GET /api/v1/categories/"""
        # Create test category first
        category_data = {
            "name": "List Test Category",
            "description": "Category for list test",
            "color": "#00FF00"
        }
        create_response = self.client.post("/api/v1/categories/", json=category_data)
        assert create_response.status_code == 200
        
        # Test list endpoint
        response = self.client.get("/api/v1/categories/")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        
        # Check first category structure
        category = data[0]
        assert "id" in category
        assert "name" in category
        assert "description" in category
        assert "color" in category
        assert "created_at" in category
        assert "updated_at" in category
        assert "article_count" in category

    def test_categories_get_single_endpoint(self):
        """Test GET /api/v1/categories/{category_id}"""
        # Create test category first
        category_data = {
            "name": "Single Test Category",
            "description": "Category for single test",
            "color": "#0000FF"
        }
        create_response = self.client.post("/api/v1/categories/", json=category_data)
        assert create_response.status_code == 200
        created_category = create_response.json()
        
        # Test get single endpoint
        response = self.client.get(f"/api/v1/categories/{created_category['id']}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["id"] == created_category["id"]
        assert data["name"] == category_data["name"]
        assert data["description"] == category_data["description"]
        assert data["color"] == category_data["color"]

    def test_categories_update_endpoint(self):
        """Test PUT /api/v1/categories/{category_id}"""
        # Create test category first
        category_data = {
            "name": "Update Test Category",
            "description": "Original description",
            "color": "#FF00FF"
        }
        create_response = self.client.post("/api/v1/categories/", json=category_data)
        assert create_response.status_code == 200
        created_category = create_response.json()
        
        # Update the category
        update_data = {
            "name": "Updated Test Category",
            "description": "Updated description",
            "color": "#00FFFF"
        }
        
        response = self.client.put(f"/api/v1/categories/{created_category['id']}", json=update_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["id"] == created_category["id"]
        assert data["name"] == update_data["name"]
        assert data["description"] == update_data["description"]
        assert data["color"] == update_data["color"]

    def test_categories_delete_endpoint(self):
        """Test DELETE /api/v1/categories/{category_id}"""
        # Create test category first
        category_data = {
            "name": "Delete Test Category",
            "description": "Category to be deleted",
            "color": "#FFFF00"
        }
        create_response = self.client.post("/api/v1/categories/", json=category_data)
        assert create_response.status_code == 200
        created_category = create_response.json()
        
        # Delete the category
        response = self.client.delete(f"/api/v1/categories/{created_category['id']}")
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
        assert "deleted" in data["message"].lower()
        
        # Verify category is deleted
        get_response = self.client.get(f"/api/v1/categories/{created_category['id']}")
        assert get_response.status_code == 404

    def test_categories_roots_endpoint(self):
        """Test GET /api/v1/categories/roots"""
        # Create test root category first
        category_data = {
            "name": "Root Test Category",
            "description": "Root category for test",
            "color": "#800000"
        }
        create_response = self.client.post("/api/v1/categories/", json=category_data)
        assert create_response.status_code == 200
        
        # Test roots endpoint
        response = self.client.get("/api/v1/categories/roots")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        
        # Check root category structure
        root_category = data[0]
        assert "id" in root_category
        assert "name" in root_category
        assert "description" in root_category
        assert "color" in root_category
        assert root_category["parent_id"] is None
        assert "children" in root_category

    def test_endpoint_error_handling(self):
        """Test error handling for non-existent resources"""
        # Test non-existent article
        response = self.client.get("/api/v1/articles/non-existent-id")
        assert response.status_code == 404
        
        # Test non-existent category
        response = self.client.get("/api/v1/categories/non-existent-id")
        assert response.status_code == 404
        
        # Test invalid search query
        response = self.client.get("/api/v1/search/articles?q=")
        assert response.status_code == 422  # Validation error

    def test_endpoint_pagination(self):
        """Test pagination parameters"""
        # Create multiple articles
        for i in range(5):
            article_data = {
                "title": f"Pagination Test Article {i}",
                "content": f"Content for pagination test {i}",
                "tags": ["pagination", "test"]
            }
            self.client.post("/api/v1/articles/", json=article_data)
        
        # Test pagination
        response = self.client.get("/api/v1/articles/?skip=0&limit=2")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        
        # Test second page
        response = self.client.get("/api/v1/articles/?skip=2&limit=2")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

    def test_integration_article_with_categories(self):
        """Test integration between articles and categories"""
        # Create category first
        category_data = {
            "name": "Integration Test Category",
            "description": "Category for integration test",
            "color": "#123456"
        }
        cat_response = self.client.post("/api/v1/categories/", json=category_data)
        assert cat_response.status_code == 200
        category = cat_response.json()
        
        # Create article with category
        article_data = {
            "title": "Integration Test Article",
            "content": "Article with category",
            "tags": ["integration", "test"],
            "categories": [category["id"]]
        }
        
        response = self.client.post("/api/v1/articles/", json=article_data)
        assert response.status_code == 200
        
        article = response.json()
        assert len(article["categories"]) == 1
        assert article["categories"][0]["id"] == category["id"]
        assert article["categories"][0]["name"] == category["name"]

if __name__ == "__main__":
    # Run tests directly
    test_instance = TestEndpoints()
    test_instance.setup_method()
    
    # Run all test methods
    test_methods = [method for method in dir(test_instance) if method.startswith('test_')]
    
    passed = 0
    failed = 0
    
    for method_name in test_methods:
        try:
            print(f"Running {method_name}...")
            method = getattr(test_instance, method_name)
            method()
            print(f"✓ {method_name} PASSED")
            passed += 1
        except Exception as e:
            print(f"✗ {method_name} FAILED: {e}")
            failed += 1
        finally:
            # Reset for next test
            test_instance.cleanup_test_data()
    
    print(f"\nTest Results: {passed} passed, {failed} failed")
    test_instance.teardown_method()