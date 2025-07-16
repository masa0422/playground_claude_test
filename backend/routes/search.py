from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from ..database.database import get_db
from ..database.crud import ArticleCRUD
from ..models.article import ArticleListResponse
from ..routes.articles import format_article_list_response

router = APIRouter()

@router.get("/articles", response_model=List[ArticleListResponse])
async def search_articles(
    q: str = Query(..., min_length=1, description="Search query"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    articles = ArticleCRUD.search_articles(db, q, skip=skip, limit=limit)
    return [format_article_list_response(article) for article in articles]

@router.get("/suggestions")
async def get_search_suggestions(
    q: str = Query(..., min_length=1, description="Search query prefix"),
    limit: int = Query(10, ge=1, le=20),
    db: Session = Depends(get_db)
):
    # This is a simple implementation - in production you might want to use a proper search engine
    articles = ArticleCRUD.search_articles(db, q, skip=0, limit=limit)
    
    suggestions = []
    for article in articles:
        suggestions.append({
            "id": article.id,
            "title": article.title,
            "type": "article"
        })
    
    return {"suggestions": suggestions}