#!/usr/bin/env python3
"""
基本的なエンドポイントテスト
実際のAPI実装に基づいたテスト
"""

import httpx
import uuid
import json

BASE_URL = "http://backend:8000"

def test_basic_functionality():
    """基本的な機能テスト"""
    
    client = httpx.Client(base_url=BASE_URL, follow_redirects=True)
    
    print("🔍 基本的なエンドポイントテスト開始...")
    
    # 1. Health check
    print("\n1. Health check...")
    resp = client.get("/health")
    print(f"   Status: {resp.status_code}")
    print(f"   Response: {resp.json()}")
    assert resp.status_code == 200
    assert resp.json()["status"] == "healthy"
    
    # 2. Categories list
    print("\n2. Categories list...")
    resp = client.get("/api/v1/categories")
    print(f"   Status: {resp.status_code}")
    categories = resp.json()
    print(f"   Categories count: {len(categories)}")
    assert resp.status_code == 200
    assert isinstance(categories, list)
    
    # 3. Root categories
    print("\n3. Root categories...")
    resp = client.get("/api/v1/categories/roots")
    print(f"   Status: {resp.status_code}")
    root_categories = resp.json()
    print(f"   Root categories count: {len(root_categories)}")
    assert resp.status_code == 200
    assert isinstance(root_categories, list)
    
    # 4. Articles search
    print("\n4. Articles search...")
    resp = client.get("/api/v1/search/articles", params={"q": "test"})
    print(f"   Status: {resp.status_code}")
    articles = resp.json()
    print(f"   Articles count: {len(articles)}")
    assert resp.status_code == 200
    assert isinstance(articles, list)
    
    # 5. Category creation (with unique name)
    print("\n5. Category creation...")
    unique_name = f"Test Category {uuid.uuid4().hex[:8]}"
    new_category = {
        "name": unique_name,
        "description": "Test Description",
        "color": "#FF0000",
        "parent_id": None
    }
    resp = client.post("/api/v1/categories", json=new_category)
    print(f"   Status: {resp.status_code}")
    print(f"   Response: {resp.text[:200]}")
    
    if resp.status_code == 200:
        created_category = resp.json()
        category_id = created_category["id"]
        print(f"   Created category ID: {category_id}")
        
        # 6. Category retrieval
        print("\n6. Category retrieval...")
        resp = client.get(f"/api/v1/categories/{category_id}")
        print(f"   Status: {resp.status_code}")
        assert resp.status_code == 200
        
        # 7. Category update
        print("\n7. Category update...")
        update_data = {
            "name": unique_name + " (Updated)",
            "description": "Updated Description",
            "color": "#00FF00",
            "parent_id": None
        }
        resp = client.put(f"/api/v1/categories/{category_id}", json=update_data)
        print(f"   Status: {resp.status_code}")
        assert resp.status_code == 200
        
        # 8. Category deletion
        print("\n8. Category deletion...")
        resp = client.delete(f"/api/v1/categories/{category_id}")
        print(f"   Status: {resp.status_code}")
        assert resp.status_code == 200
        
        # 9. Verify deletion
        print("\n9. Verify deletion...")
        resp = client.get(f"/api/v1/categories/{category_id}")
        print(f"   Status: {resp.status_code}")
        assert resp.status_code == 404
        
        print("\n✅ カテゴリCRUD操作テスト完了")
    else:
        print(f"   ❌ カテゴリ作成失敗: {resp.status_code}")
        print(f"   Response: {resp.text}")
    
    # 10. Search suggestions
    print("\n10. Search suggestions...")
    resp = client.get("/api/v1/search/suggestions", params={"q": "test"})
    print(f"   Status: {resp.status_code}")
    if resp.status_code == 200:
        suggestions = resp.json()
        print(f"   Suggestions: {suggestions}")
    else:
        print(f"   Error: {resp.text}")
    
    client.close()
    print("\n🎉 基本的なエンドポイントテスト完了")

if __name__ == "__main__":
    test_basic_functionality()