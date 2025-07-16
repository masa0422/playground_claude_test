from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database.database import get_db
from ..database.crud import ArticleCRUD
from ..models.article import (
    ArticleCreate, 
    ArticleUpdate, 
    ArticleResponse, 
    ArticleListResponse,
    ArticleHistoryResponse
)
import json

router = APIRouter()

@router.post("/", response_model=ArticleResponse)
async def create_article(
    article: ArticleCreate,
    db: Session = Depends(get_db)
):
    try:
        db_article = ArticleCRUD.create_article(db, article)
        return format_article_response(db_article)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[ArticleListResponse])
async def get_articles(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    articles = ArticleCRUD.get_articles(db, skip=skip, limit=limit)
    return [format_article_list_response(article) for article in articles]

@router.get("/{article_id}", response_model=ArticleResponse)
async def get_article(
    article_id: str,
    db: Session = Depends(get_db)
):
    article = ArticleCRUD.get_article(db, article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return format_article_response(article)

@router.put("/{article_id}", response_model=ArticleResponse)
async def update_article(
    article_id: str,
    article_update: ArticleUpdate,
    db: Session = Depends(get_db)
):
    article = ArticleCRUD.update_article(db, article_id, article_update)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return format_article_response(article)

@router.delete("/{article_id}")
async def delete_article(
    article_id: str,
    db: Session = Depends(get_db)
):
    if not ArticleCRUD.delete_article(db, article_id):
        raise HTTPException(status_code=404, detail="Article not found")
    return {"message": "Article deleted successfully"}

@router.get("/{article_id}/history", response_model=List[ArticleHistoryResponse])
async def get_article_history(
    article_id: str,
    db: Session = Depends(get_db)
):
    # First check if article exists
    article = ArticleCRUD.get_article(db, article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    history = ArticleCRUD.get_article_history(db, article_id)
    return history

def format_article_response(article) -> ArticleResponse:
    tags = []
    if article.tags:
        try:
            tags = json.loads(article.tags)
        except json.JSONDecodeError:
            tags = []
    
    categories = []
    if article.categories:
        categories = [
            {
                "id": cat.id,
                "name": cat.name,
                "description": cat.description,
                "color": cat.color,
                "parent_id": cat.parent_id,
                "created_at": cat.created_at,
                "updated_at": cat.updated_at
            }
            for cat in article.categories
        ]
    
    return ArticleResponse(
        id=article.id,
        title=article.title,
        content=article.content,
        tags=tags,
        version=article.version,
        created_at=article.created_at,
        updated_at=article.updated_at,
        categories=categories
    )

def format_article_list_response(article) -> ArticleListResponse:
    tags = []
    if article.tags:
        try:
            tags = json.loads(article.tags)
        except json.JSONDecodeError:
            tags = []
    
    categories = []
    if article.categories:
        categories = [
            {
                "id": cat.id,
                "name": cat.name,
                "description": cat.description,
                "color": cat.color,
                "parent_id": cat.parent_id,
                "created_at": cat.created_at,
                "updated_at": cat.updated_at
            }
            for cat in article.categories
        ]
    
    # Create excerpt from content
    excerpt = article.content[:200] + "..." if len(article.content) > 200 else article.content
    
    return ArticleListResponse(
        id=article.id,
        title=article.title,
        content=article.content,
        tags=tags,
        version=article.version,
        created_at=article.created_at,
        updated_at=article.updated_at,
        categories=categories,
        excerpt=excerpt
    )