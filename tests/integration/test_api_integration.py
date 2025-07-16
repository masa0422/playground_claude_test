import pytest
from fastapi.testclient import TestClient

def test_article_category_integration(client: TestClient, sample_article_data, sample_category_data):
    """Test integration between articles and categories"""
    # Create a category first
    category_response = client.post("/api/v1/categories/", json=sample_category_data)
    assert category_response.status_code == 200
    category = category_response.json()
    
    # Create an article with the category
    article_data = sample_article_data.copy()
    article_data["categories"] = [category["id"]]
    
    article_response = client.post("/api/v1/articles/", json=article_data)
    assert article_response.status_code == 200
    article = article_response.json()
    
    # Verify the article has the category
    assert len(article["categories"]) == 1
    assert article["categories"][0]["id"] == category["id"]
    assert article["categories"][0]["name"] == category["name"]

def test_search_with_categorized_articles(client: TestClient, sample_article_data, sample_category_data):
    """Test search functionality with categorized articles"""
    # Create categories
    tech_category = sample_category_data.copy()
    tech_category["name"] = "Technology"
    tech_response = client.post("/api/v1/categories/", json=tech_category)
    tech_cat = tech_response.json()
    
    # Create articles with categories
    article_data = sample_article_data.copy()
    article_data["title"] = "Machine Learning Basics"
    article_data["content"] = "Introduction to machine learning concepts."
    article_data["categories"] = [tech_cat["id"]]
    
    client.post("/api/v1/articles/", json=article_data)
    
    # Search for the article
    search_response = client.get("/api/v1/search/articles?q=machine")
    assert search_response.status_code == 200
    
    results = search_response.json()
    assert len(results) == 1
    assert results[0]["title"] == "Machine Learning Basics"
    assert len(results[0]["categories"]) == 1
    assert results[0]["categories"][0]["name"] == "Technology"

def test_article_history_integration(client: TestClient, sample_article_data):
    """Test article history is created and tracked properly"""
    # Create an article
    create_response = client.post("/api/v1/articles/", json=sample_article_data)
    assert create_response.status_code == 200
    article = create_response.json()
    
    # Update the article
    update_data = {
        "title": "Updated Title",
        "content": "Updated content"
    }
    update_response = client.put(f"/api/v1/articles/{article['id']}", json=update_data)
    assert update_response.status_code == 200
    
    # Check history
    history_response = client.get(f"/api/v1/articles/{article['id']}/history")
    assert history_response.status_code == 200
    
    history = history_response.json()
    assert len(history) == 2  # Creation and update
    
    # History should be in descending order (newest first)
    assert history[0]["change_type"] == "updated"
    assert history[0]["version"] == 2
    assert history[1]["change_type"] == "created"
    assert history[1]["version"] == 1

def test_category_hierarchy_integration(client: TestClient, sample_category_data):
    """Test category parent-child relationships"""
    # Create parent category
    parent_data = sample_category_data.copy()
    parent_data["name"] = "Programming"
    parent_response = client.post("/api/v1/categories/", json=parent_data)
    parent_category = parent_response.json()
    
    # Create child category
    child_data = sample_category_data.copy()
    child_data["name"] = "Python"
    child_data["parent_id"] = parent_category["id"]
    child_response = client.post("/api/v1/categories/", json=child_data)
    child_category = child_response.json()
    
    # Verify parent-child relationship
    assert child_category["parent_id"] == parent_category["id"]
    
    # Get parent category and check for children
    parent_get_response = client.get(f"/api/v1/categories/{parent_category['id']}")
    parent_full = parent_get_response.json()
    assert len(parent_full["children"]) == 1
    assert parent_full["children"][0]["id"] == child_category["id"]

def test_full_workflow_integration(client: TestClient, sample_article_data, sample_category_data):
    """Test complete workflow: create category, create article, search, update, delete"""
    # 1. Create a category
    category_response = client.post("/api/v1/categories/", json=sample_category_data)
    category = category_response.json()
    
    # 2. Create an article with the category
    article_data = sample_article_data.copy()
    article_data["title"] = "Full Stack Development"
    article_data["content"] = "Complete guide to full stack web development."
    article_data["categories"] = [category["id"]]
    
    article_response = client.post("/api/v1/articles/", json=article_data)
    article = article_response.json()
    
    # 3. Search for the article
    search_response = client.get("/api/v1/search/articles?q=full stack")
    search_results = search_response.json()
    assert len(search_results) == 1
    assert search_results[0]["id"] == article["id"]
    
    # 4. Update the article
    update_data = {
        "title": "Advanced Full Stack Development",
        "content": "Advanced techniques for full stack development."
    }
    update_response = client.put(f"/api/v1/articles/{article['id']}", json=update_data)
    updated_article = update_response.json()
    assert updated_article["version"] == 2
    
    # 5. Check updated search results
    search_response2 = client.get("/api/v1/search/articles?q=advanced")
    search_results2 = search_response2.json()
    assert len(search_results2) == 1
    assert search_results2[0]["title"] == "Advanced Full Stack Development"
    
    # 6. Get article history
    history_response = client.get(f"/api/v1/articles/{article['id']}/history")
    history = history_response.json()
    assert len(history) == 2
    
    # 7. Delete the article
    delete_response = client.delete(f"/api/v1/articles/{article['id']}")
    assert delete_response.status_code == 200
    
    # 8. Verify article is deleted
    get_response = client.get(f"/api/v1/articles/{article['id']}")
    assert get_response.status_code == 404
    
    # 9. Verify search no longer finds the article
    search_response3 = client.get("/api/v1/search/articles?q=advanced")
    search_results3 = search_response3.json()
    assert len(search_results3) == 0

def test_database_constraints_integration(client: TestClient, sample_category_data):
    """Test database constraints and error handling"""
    # Create a category
    category_response = client.post("/api/v1/categories/", json=sample_category_data)
    assert category_response.status_code == 200
    
    # Try to create another category with the same name (should fail due to unique constraint)
    duplicate_response = client.post("/api/v1/categories/", json=sample_category_data)
    assert duplicate_response.status_code == 400  # Should return error due to unique constraint