from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class ArticleBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    tags: Optional[List[str]] = None
    categories: Optional[List[str]] = None

class ArticleCreate(ArticleBase):
    pass

class ArticleUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = Field(None, min_length=1)
    tags: Optional[List[str]] = None
    categories: Optional[List[str]] = None

class ArticleResponse(BaseModel):
    id: str
    title: str
    content: str
    tags: Optional[List[str]] = None
    version: int
    created_at: datetime
    updated_at: datetime
    categories: Optional[List['CategoryResponse']] = None

    class Config:
        from_attributes = True

class ArticleHistoryResponse(BaseModel):
    id: str
    article_id: str
    title: str
    content: str
    version: int
    change_type: str
    created_at: datetime

    class Config:
        from_attributes = True

class ArticleListResponse(BaseModel):
    id: str
    title: str
    content: str
    tags: Optional[List[str]] = None
    version: int
    created_at: datetime
    updated_at: datetime
    categories: Optional[List['CategoryResponse']] = None
    excerpt: Optional[str] = None

    class Config:
        from_attributes = True

# Import here to avoid circular imports
from .category import CategoryResponse
ArticleResponse.model_rebuild()
ArticleListResponse.model_rebuild()