from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Table, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

# Association table for many-to-many relationship between articles and categories
article_category_association = Table(
    'article_categories',
    Base.metadata,
    Column('article_id', String, ForeignKey('articles.id'), primary_key=True),
    Column('category_id', String, ForeignKey('categories.id'), primary_key=True)
)

class Article(Base):
    __tablename__ = "articles"
    
    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    content = Column(Text, nullable=False)
    tags = Column(Text, nullable=True)  # JSON string of tags
    version = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    
    # Relationships
    categories = relationship("Category", secondary=article_category_association, back_populates="articles")
    history = relationship("ArticleHistory", back_populates="article", cascade="all, delete-orphan")

class Category(Base):
    __tablename__ = "categories"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    color = Column(String, nullable=True)  # Hex color code
    parent_id = Column(String, ForeignKey('categories.id'), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    
    # Relationships
    articles = relationship("Article", secondary=article_category_association, back_populates="categories")
    parent = relationship("Category", remote_side="Category.id", back_populates="children")
    children = relationship("Category", back_populates="parent", cascade="all, delete-orphan")

class ArticleHistory(Base):
    __tablename__ = "article_history"
    
    id = Column(String, primary_key=True, index=True)
    article_id = Column(String, ForeignKey('articles.id'), nullable=False)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    version = Column(Integer, nullable=False)
    change_type = Column(String, nullable=False)  # 'created', 'updated', 'deleted'
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    article = relationship("Article", back_populates="history")

class SearchIndex(Base):
    __tablename__ = "search_index"
    
    id = Column(String, primary_key=True, index=True)
    article_id = Column(String, ForeignKey('articles.id'), nullable=False)
    title_tokens = Column(Text, nullable=False)  # Tokenized title for search
    content_tokens = Column(Text, nullable=False)  # Tokenized content for search
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())