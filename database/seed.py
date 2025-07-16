import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database.database import SessionLocal, create_tables
from backend.database.models import Article, Category, ArticleHistory
import uuid
import json
from datetime import datetime

def seed_database():
    """Seed the database with initial data"""
    
    # Create tables first
    create_tables()
    
    db = SessionLocal()
    
    try:
        # Create default categories
        categories = [
            {
                "id": str(uuid.uuid4()),
                "name": "Technology",
                "description": "Technology-related articles",
                "color": "#2196F3",
                "parent_id": None
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Development",
                "description": "Software development articles",
                "color": "#4CAF50",
                "parent_id": None
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Documentation",
                "description": "Documentation and guides",
                "color": "#FF9800",
                "parent_id": None
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Personal",
                "description": "Personal notes and thoughts",
                "color": "#9C27B0",
                "parent_id": None
            }
        ]
        
        # Add categories to database
        db_categories = []
        for cat_data in categories:
            db_category = Category(**cat_data)
            db.add(db_category)
            db_categories.append(db_category)
        
        db.commit()
        
        # Create sample articles
        articles = [
            {
                "id": str(uuid.uuid4()),
                "title": "Getting Started with Wiki Desktop App",
                "content": """# Getting Started with Wiki Desktop App

Welcome to your personal knowledge management system! This application helps you organize and store your thoughts, ideas, and information in a structured way.

## Features

- **Rich Text Editing**: Write in Markdown format with live preview
- **Categorization**: Organize your articles with categories and tags
- **Search**: Quickly find information across all your articles
- **History**: Track changes and versions of your articles
- **Export**: Export your knowledge base to various formats

## Quick Start

1. Create a new article by clicking the "New Article" button
2. Write your content in Markdown format
3. Add categories and tags to organize your content
4. Use the search function to find information quickly

Happy writing!
""",
                "tags": json.dumps(["tutorial", "getting-started", "help"]),
                "version": 1,
                "categories": [db_categories[2]]  # Documentation
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Python Development Best Practices",
                "content": """# Python Development Best Practices

## Code Style

Follow PEP 8 guidelines for Python code style:

- Use 4 spaces for indentation
- Keep lines under 79 characters
- Use meaningful variable names
- Add docstrings to functions and classes

## Virtual Environments

Always use virtual environments for Python projects:

```bash
python -m venv myenv
source myenv/bin/activate  # On Windows: myenv\\Scripts\\activate
pip install -r requirements.txt
```

## Testing

Write tests for your code:

```python
def test_my_function():
    result = my_function(input_data)
    assert result == expected_output
```

## Documentation

Document your code properly:

- Write clear docstrings
- Use type hints
- Keep README files updated
- Document APIs with tools like Sphinx
""",
                "tags": json.dumps(["python", "development", "best-practices", "coding"]),
                "version": 1,
                "categories": [db_categories[0], db_categories[1]]  # Technology, Development
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Personal Learning Goals",
                "content": """# Personal Learning Goals

## Current Quarter Goals

- [ ] Learn TypeScript fundamentals
- [ ] Complete React advanced course
- [ ] Build a full-stack application
- [ ] Contribute to open source projects

## Technical Skills to Develop

### Frontend
- Advanced React patterns
- State management with Redux/Zustand
- CSS-in-JS solutions
- Testing with Jest and React Testing Library

### Backend
- API design principles
- Database optimization
- Microservices architecture
- Cloud deployment strategies

### DevOps
- Docker containerization
- CI/CD pipelines
- Monitoring and logging
- Infrastructure as code

## Books to Read

1. "Clean Code" by Robert C. Martin
2. "System Design Interview" by Alex Xu
3. "Designing Data-Intensive Applications" by Martin Kleppmann
4. "You Don't Know JS" series

## Resources

- [Frontend Masters](https://frontendmasters.com)
- [Pluralsight](https://pluralsight.com)
- [YouTube - Traversy Media](https://youtube.com/traversymedia)
- [GitHub - Awesome Lists](https://github.com/sindresorhus/awesome)
""",
                "tags": json.dumps(["learning", "goals", "personal-development", "skills"]),
                "version": 1,
                "categories": [db_categories[3]]  # Personal
            }
        ]
        
        # Add articles to database
        for article_data in articles:
            categories = article_data.pop("categories", [])
            db_article = Article(**article_data)
            db_article.categories = categories
            db.add(db_article)
            
            # Create history record
            history = ArticleHistory(
                id=str(uuid.uuid4()),
                article_id=db_article.id,
                title=db_article.title,
                content=db_article.content,
                version=db_article.version,
                change_type="created"
            )
            db.add(history)
        
        db.commit()
        print("Database seeded successfully!")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()