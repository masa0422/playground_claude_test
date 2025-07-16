import pytest
from fastapi.testclient import TestClient

def test_search_articles_empty(client: TestClient):
    """Test GET /api/v1/search/articles returns empty list when no articles match"""
    response = client.get("/api/v1/search/articles?q=nonexistent")
    assert response.status_code == 200
    assert response.json() == []

def test_search_articles_with_results(client: TestClient, sample_article_data):
    """Test GET /api/v1/search/articles returns matching articles"""
    # Create test articles
    article1_data = sample_article_data.copy()
    article1_data["title"] = "Python Programming Guide"
    article1_data["content"] = "Learn Python programming with this comprehensive guide."
    
    article2_data = sample_article_data.copy()
    article2_data["title"] = "JavaScript Basics"
    article2_data["content"] = "Introduction to JavaScript programming language."
    
    # Create the articles
    client.post("/api/v1/articles/", json=article1_data)
    client.post("/api/v1/articles/", json=article2_data)
    
    # Search for "Python"
    response = client.get("/api/v1/search/articles?q=Python")
    assert response.status_code == 200
    
    results = response.json()
    assert len(results) == 1
    assert "Python" in results[0]["title"]
    assert "Python" in results[0]["content"]

def test_search_articles_case_insensitive(client: TestClient, sample_article_data):
    """Test search is case insensitive"""
    # Create test article
    article_data = sample_article_data.copy()
    article_data["title"] = "React Tutorial"
    article_data["content"] = "Learn React framework for building user interfaces."
    
    client.post("/api/v1/articles/", json=article_data)
    
    # Search with different cases
    response1 = client.get("/api/v1/search/articles?q=react")
    response2 = client.get("/api/v1/search/articles?q=REACT")
    response3 = client.get("/api/v1/search/articles?q=React")
    
    assert response1.status_code == 200
    assert response2.status_code == 200
    assert response3.status_code == 200
    
    # All should return the same result
    assert len(response1.json()) == 1
    assert len(response2.json()) == 1
    assert len(response3.json()) == 1

def test_search_articles_with_pagination(client: TestClient, sample_article_data):
    """Test search with pagination parameters"""
    # Create multiple articles with similar content
    for i in range(5):
        article_data = sample_article_data.copy()
        article_data["title"] = f"Programming Tutorial {i}"
        article_data["content"] = f"This is a programming tutorial number {i}."
        client.post("/api/v1/articles/", json=article_data)
    
    # Test pagination
    response = client.get("/api/v1/search/articles?q=programming&skip=0&limit=2")
    assert response.status_code == 200
    assert len(response.json()) == 2
    
    response = client.get("/api/v1/search/articles?q=programming&skip=2&limit=2")
    assert response.status_code == 200
    assert len(response.json()) == 2

def test_search_articles_invalid_query(client: TestClient):
    """Test search with invalid query parameters"""
    # Empty query should return 422
    response = client.get("/api/v1/search/articles?q=")
    assert response.status_code == 422

def test_search_articles_multiple_terms(client: TestClient, sample_article_data):
    """Test search with multiple terms"""
    # Create test articles
    article1_data = sample_article_data.copy()
    article1_data["title"] = "Python Web Development"
    article1_data["content"] = "Building web applications with Python Flask framework."
    
    article2_data = sample_article_data.copy()
    article2_data["title"] = "Web Design Basics"
    article2_data["content"] = "Learn the fundamentals of web design and CSS."
    
    client.post("/api/v1/articles/", json=article1_data)
    client.post("/api/v1/articles/", json=article2_data)
    
    # Search for multiple terms
    response = client.get("/api/v1/search/articles?q=Python Web")
    assert response.status_code == 200
    
    results = response.json()
    assert len(results) == 1  # Should find the article with both terms
    assert "Python" in results[0]["title"]
    assert "Web" in results[0]["title"]

def test_search_suggestions_empty(client: TestClient):
    """Test GET /api/v1/search/suggestions returns empty when no matches"""
    response = client.get("/api/v1/search/suggestions?q=nonexistent")
    assert response.status_code == 200
    data = response.json()
    assert "suggestions" in data
    assert data["suggestions"] == []

def test_search_suggestions_with_results(client: TestClient, sample_article_data):
    """Test GET /api/v1/search/suggestions returns suggestions"""
    # Create test articles
    article_data = sample_article_data.copy()
    article_data["title"] = "Docker Container Guide"
    article_data["content"] = "Learn how to use Docker containers effectively."
    
    client.post("/api/v1/articles/", json=article_data)
    
    # Get suggestions
    response = client.get("/api/v1/search/suggestions?q=Docker")
    assert response.status_code == 200
    
    data = response.json()
    assert "suggestions" in data
    assert len(data["suggestions"]) == 1
    assert data["suggestions"][0]["title"] == "Docker Container Guide"
    assert data["suggestions"][0]["type"] == "article"

def test_search_suggestions_with_limit(client: TestClient, sample_article_data):
    """Test search suggestions respects limit parameter"""
    # Create multiple articles
    for i in range(5):
        article_data = sample_article_data.copy()
        article_data["title"] = f"Testing Article {i}"
        article_data["content"] = f"This is a testing article number {i}."
        client.post("/api/v1/articles/", json=article_data)
    
    # Test with limit
    response = client.get("/api/v1/search/suggestions?q=Testing&limit=2")
    assert response.status_code == 200
    
    data = response.json()
    assert len(data["suggestions"]) == 2