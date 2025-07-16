from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from .models import Article, Category, ArticleHistory, SearchIndex
from ..models.article import ArticleCreate, ArticleUpdate
from ..models.category import CategoryCreate, CategoryUpdate
from typing import List, Optional
import uuid
import json
from datetime import datetime

class ArticleCRUD:
    @staticmethod
    def create_article(db: Session, article: ArticleCreate) -> Article:
        db_article = Article(
            id=str(uuid.uuid4()),
            title=article.title,
            content=article.content,
            tags=json.dumps(article.tags) if article.tags else None,
            version=1
        )
        db.add(db_article)
        
        # Add categories
        if article.categories:
            categories = db.query(Category).filter(Category.id.in_(article.categories)).all()
            db_article.categories = categories
        
        db.commit()
        db.refresh(db_article)
        
        # Create history record
        ArticleCRUD.create_history_record(db, db_article, "created")
        
        return db_article
    
    @staticmethod
    def get_article(db: Session, article_id: str) -> Optional[Article]:
        return db.query(Article).filter(Article.id == article_id).first()
    
    @staticmethod
    def get_articles(db: Session, skip: int = 0, limit: int = 100) -> List[Article]:
        return db.query(Article).offset(skip).limit(limit).all()
    
    @staticmethod
    def update_article(db: Session, article_id: str, article_update: ArticleUpdate) -> Optional[Article]:
        db_article = db.query(Article).filter(Article.id == article_id).first()
        if not db_article:
            return None
        
        # Update fields
        if article_update.title is not None:
            db_article.title = article_update.title
        if article_update.content is not None:
            db_article.content = article_update.content
        if article_update.tags is not None:
            db_article.tags = json.dumps(article_update.tags)
        
        db_article.version += 1
        db_article.updated_at = datetime.utcnow()
        
        # Update categories
        if article_update.categories is not None:
            categories = db.query(Category).filter(Category.id.in_(article_update.categories)).all()
            db_article.categories = categories
        
        db.commit()
        db.refresh(db_article)
        
        # Create history record
        ArticleCRUD.create_history_record(db, db_article, "updated")
        
        return db_article
    
    @staticmethod
    def delete_article(db: Session, article_id: str) -> bool:
        db_article = db.query(Article).filter(Article.id == article_id).first()
        if not db_article:
            return False
        
        # Create history record before deletion
        ArticleCRUD.create_history_record(db, db_article, "deleted")
        
        db.delete(db_article)
        db.commit()
        return True
    
    @staticmethod
    def create_history_record(db: Session, article: Article, change_type: str):
        history = ArticleHistory(
            id=str(uuid.uuid4()),
            article_id=article.id,
            title=article.title,
            content=article.content,
            version=article.version,
            change_type=change_type
        )
        db.add(history)
        db.commit()
    
    @staticmethod
    def get_article_history(db: Session, article_id: str) -> List[ArticleHistory]:
        return db.query(ArticleHistory).filter(
            ArticleHistory.article_id == article_id
        ).order_by(ArticleHistory.created_at.desc()).all()
    
    @staticmethod
    def search_articles(db: Session, query: str, skip: int = 0, limit: int = 50) -> List[Article]:
        search_terms = query.split()
        search_conditions = []
        
        for term in search_terms:
            search_conditions.append(
                or_(
                    Article.title.ilike(f"%{term}%"),
                    Article.content.ilike(f"%{term}%")
                )
            )
        
        if search_conditions:
            return db.query(Article).filter(
                and_(*search_conditions)
            ).offset(skip).limit(limit).all()
        
        return []

class CategoryCRUD:
    @staticmethod
    def create_category(db: Session, category: CategoryCreate) -> Category:
        db_category = Category(
            id=str(uuid.uuid4()),
            name=category.name,
            description=category.description,
            color=category.color,
            parent_id=category.parent_id
        )
        db.add(db_category)
        db.commit()
        db.refresh(db_category)
        return db_category
    
    @staticmethod
    def get_category(db: Session, category_id: str) -> Optional[Category]:
        return db.query(Category).filter(Category.id == category_id).first()
    
    @staticmethod
    def get_categories(db: Session, skip: int = 0, limit: int = 100) -> List[Category]:
        return db.query(Category).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_root_categories(db: Session) -> List[Category]:
        return db.query(Category).filter(Category.parent_id.is_(None)).all()
    
    @staticmethod
    def update_category(db: Session, category_id: str, category_update: CategoryUpdate) -> Optional[Category]:
        db_category = db.query(Category).filter(Category.id == category_id).first()
        if not db_category:
            return None
        
        if category_update.name is not None:
            db_category.name = category_update.name
        if category_update.description is not None:
            db_category.description = category_update.description
        if category_update.color is not None:
            db_category.color = category_update.color
        if category_update.parent_id is not None:
            db_category.parent_id = category_update.parent_id
        
        db_category.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_category)
        return db_category
    
    @staticmethod
    def delete_category(db: Session, category_id: str) -> bool:
        db_category = db.query(Category).filter(Category.id == category_id).first()
        if not db_category:
            return False
        
        # Move children to parent or make them root categories
        for child in db_category.children:
            child.parent_id = db_category.parent_id
        
        db.delete(db_category)
        db.commit()
        return True