"""
Electron integration tests
Tests for Electron application integration with backend API
"""

import pytest
import asyncio
import subprocess
import time
import requests
import json
import os
from pathlib import Path
from typing import Dict, Any, Optional


class ElectronTestRunner:
    """Helper class to manage Electron test processes"""
    
    def __init__(self, app_path: str = None):
        self.app_path = app_path or os.path.join(os.path.dirname(__file__), '..', '..')
        self.electron_process = None
        self.backend_process = None
        
    def start_backend(self) -> subprocess.Popen:
        """Start the backend server for testing"""
        backend_cmd = [
            'python', '-m', 'uvicorn',
            'backend.main:app',
            '--host', '0.0.0.0',
            '--port', '8000',
            '--reload'
        ]
        
        return subprocess.Popen(
            backend_cmd,
            cwd=self.app_path,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
    
    def wait_for_backend(self, timeout: int = 30) -> bool:
        """Wait for backend to be ready"""
        start_time = time.time()
        while time.time() - start_time < timeout:
            try:
                response = requests.get('http://localhost:8000/health')
                if response.status_code == 200:
                    return True
            except requests.exceptions.ConnectionError:
                pass
            time.sleep(1)
        return False
    
    def start_electron(self) -> subprocess.Popen:
        """Start the Electron application"""
        electron_cmd = ['npm', 'start']
        
        return subprocess.Popen(
            electron_cmd,
            cwd=self.app_path,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
    
    def wait_for_electron(self, timeout: int = 30) -> bool:
        """Wait for Electron application to be ready"""
        start_time = time.time()
        while time.time() - start_time < timeout:
            try:
                # Check if Electron process is running
                if self.electron_process and self.electron_process.poll() is None:
                    return True
            except Exception:
                pass
            time.sleep(1)
        return False
    
    def stop_processes(self):
        """Stop all test processes"""
        if self.electron_process:
            self.electron_process.terminate()
            try:
                self.electron_process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                self.electron_process.kill()
        
        if self.backend_process:
            self.backend_process.terminate()
            try:
                self.backend_process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                self.backend_process.kill()


@pytest.fixture(scope="session")
def electron_runner():
    """Fixture to provide Electron test runner"""
    runner = ElectronTestRunner()
    yield runner
    runner.stop_processes()


@pytest.fixture(scope="session")
def backend_server(electron_runner):
    """Start backend server for integration tests"""
    process = electron_runner.start_backend()
    electron_runner.backend_process = process
    
    # Wait for backend to be ready
    if not electron_runner.wait_for_backend():
        pytest.fail("Backend server failed to start")
    
    yield process
    
    # Cleanup handled by electron_runner fixture


@pytest.fixture(scope="session")
def electron_app(electron_runner, backend_server):
    """Start Electron application for integration tests"""
    # Build the application first
    build_cmd = ['npm', 'run', 'build']
    build_process = subprocess.run(
        build_cmd,
        cwd=electron_runner.app_path,
        capture_output=True,
        text=True
    )
    
    if build_process.returncode != 0:
        pytest.fail(f"Failed to build application: {build_process.stderr}")
    
    # Start Electron application
    process = electron_runner.start_electron()
    electron_runner.electron_process = process
    
    # Wait for Electron to be ready
    if not electron_runner.wait_for_electron():
        pytest.fail("Electron application failed to start")
    
    yield process
    
    # Cleanup handled by electron_runner fixture


class TestElectronIntegration:
    """Integration tests for Electron application"""
    
    def test_backend_health(self, backend_server):
        """Test that backend server is healthy"""
        response = requests.get('http://localhost:8000/health')
        assert response.status_code == 200
        assert response.json() == {"status": "healthy"}
    
    def test_electron_startup(self, electron_app):
        """Test that Electron application starts successfully"""
        assert electron_app.poll() is None, "Electron process should be running"
    
    def test_api_endpoints_accessibility(self, backend_server):
        """Test that API endpoints are accessible"""
        # Test articles endpoint
        response = requests.get('http://localhost:8000/api/articles')
        assert response.status_code == 200
        
        # Test categories endpoint
        response = requests.get('http://localhost:8000/api/categories')
        assert response.status_code == 200
        
        # Test search endpoint
        response = requests.get('http://localhost:8000/api/search?q=test')
        assert response.status_code == 200
    
    def test_article_crud_operations(self, backend_server):
        """Test article CRUD operations through API"""
        # Create article
        article_data = {
            "title": "Integration Test Article",
            "content": "This is an integration test article",
            "tags": ["integration", "test"],
            "categories": []
        }
        
        response = requests.post('http://localhost:8000/api/articles', json=article_data)
        assert response.status_code == 201
        created_article = response.json()
        article_id = created_article["id"]
        
        # Read article
        response = requests.get(f'http://localhost:8000/api/articles/{article_id}')
        assert response.status_code == 200
        retrieved_article = response.json()
        assert retrieved_article["title"] == article_data["title"]
        
        # Update article
        updated_data = {
            "title": "Updated Integration Test Article",
            "content": "Updated content",
            "tags": ["updated", "test"],
            "categories": []
        }
        
        response = requests.put(f'http://localhost:8000/api/articles/{article_id}', json=updated_data)
        assert response.status_code == 200
        updated_article = response.json()
        assert updated_article["title"] == updated_data["title"]
        
        # Delete article
        response = requests.delete(f'http://localhost:8000/api/articles/{article_id}')
        assert response.status_code == 200
        
        # Verify deletion
        response = requests.get(f'http://localhost:8000/api/articles/{article_id}')
        assert response.status_code == 404
    
    def test_category_crud_operations(self, backend_server):
        """Test category CRUD operations through API"""
        # Create category
        category_data = {
            "name": "Integration Test Category",
            "description": "This is an integration test category",
            "color": "#FF0000"
        }
        
        response = requests.post('http://localhost:8000/api/categories', json=category_data)
        assert response.status_code == 201
        created_category = response.json()
        category_id = created_category["id"]
        
        # Read category
        response = requests.get(f'http://localhost:8000/api/categories/{category_id}')
        assert response.status_code == 200
        retrieved_category = response.json()
        assert retrieved_category["name"] == category_data["name"]
        
        # Update category
        updated_data = {
            "name": "Updated Integration Test Category",
            "description": "Updated description",
            "color": "#00FF00"
        }
        
        response = requests.put(f'http://localhost:8000/api/categories/{category_id}', json=updated_data)
        assert response.status_code == 200
        updated_category = response.json()
        assert updated_category["name"] == updated_data["name"]
        
        # Delete category
        response = requests.delete(f'http://localhost:8000/api/categories/{category_id}')
        assert response.status_code == 200
        
        # Verify deletion
        response = requests.get(f'http://localhost:8000/api/categories/{category_id}')
        assert response.status_code == 404
    
    def test_search_functionality(self, backend_server):
        """Test search functionality through API"""
        # Create test articles for search
        test_articles = [
            {
                "title": "Python Programming",
                "content": "Python is a programming language",
                "tags": ["python", "programming"],
                "categories": []
            },
            {
                "title": "JavaScript Guide",
                "content": "JavaScript is a scripting language",
                "tags": ["javascript", "web"],
                "categories": []
            }
        ]
        
        article_ids = []
        for article_data in test_articles:
            response = requests.post('http://localhost:8000/api/articles', json=article_data)
            assert response.status_code == 201
            article_ids.append(response.json()["id"])
        
        # Test search
        response = requests.get('http://localhost:8000/api/search?q=python')
        assert response.status_code == 200
        search_results = response.json()
        assert len(search_results) >= 1
        assert any("python" in result["title"].lower() for result in search_results)
        
        # Test category search
        response = requests.get('http://localhost:8000/api/search/categories?q=programming')
        assert response.status_code == 200
        
        # Cleanup
        for article_id in article_ids:
            requests.delete(f'http://localhost:8000/api/articles/{article_id}')
    
    @pytest.mark.skip(reason="Requires actual Electron IPC testing infrastructure")
    def test_electron_ipc_communication(self, electron_app):
        """Test IPC communication between Electron processes"""
        # This test would require actual Electron IPC testing
        # For now, we skip it as it requires more complex setup
        pass
    
    def test_application_configuration(self, electron_app):
        """Test application configuration and settings"""
        # Test that configuration files exist
        config_path = Path(os.path.dirname(__file__)) / ".." / ".." / "package.json"
        assert config_path.exists(), "package.json should exist"
        
        # Test that build outputs exist
        dist_path = Path(os.path.dirname(__file__)) / ".." / ".." / "dist"
        renderer_out_path = Path(os.path.dirname(__file__)) / ".." / ".." / "renderer" / "out"
        
        # These should exist after build
        assert dist_path.exists(), "dist directory should exist after build"
        assert renderer_out_path.exists(), "renderer/out directory should exist after build"


class TestElectronPerformance:
    """Performance tests for Electron application"""
    
    def test_backend_response_time(self, backend_server):
        """Test backend API response times"""
        import time
        
        # Test multiple requests to measure average response time
        response_times = []
        for _ in range(5):
            start_time = time.time()
            response = requests.get('http://localhost:8000/api/articles')
            end_time = time.time()
            
            assert response.status_code == 200
            response_times.append(end_time - start_time)
        
        avg_response_time = sum(response_times) / len(response_times)
        assert avg_response_time < 1.0, f"Average response time should be < 1s, got {avg_response_time}s"
    
    def test_large_content_handling(self, backend_server):
        """Test handling of large content"""
        # Create article with large content
        large_content = "Large content " * 1000  # ~13KB content
        article_data = {
            "title": "Large Content Test",
            "content": large_content,
            "tags": ["large", "test"],
            "categories": []
        }
        
        response = requests.post('http://localhost:8000/api/articles', json=article_data)
        assert response.status_code == 201
        article_id = response.json()["id"]
        
        # Retrieve and verify large content
        response = requests.get(f'http://localhost:8000/api/articles/{article_id}')
        assert response.status_code == 200
        retrieved_article = response.json()
        assert len(retrieved_article["content"]) > 10000
        
        # Cleanup
        requests.delete(f'http://localhost:8000/api/articles/{article_id}')