from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from ..database.database import get_db
from ..database.crud import CategoryCRUD
from ..models.category import (
    CategoryCreate, 
    CategoryUpdate, 
    CategoryResponse, 
    CategoryListResponse
)

router = APIRouter()

@router.post("/", response_model=CategoryResponse)
async def create_category(
    category: CategoryCreate,
    db: Session = Depends(get_db)
):
    try:
        db_category = CategoryCRUD.create_category(db, category)
        return format_category_response(db_category)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[CategoryListResponse])
async def get_categories(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    categories = CategoryCRUD.get_categories(db, skip=skip, limit=limit)
    return [format_category_list_response(category) for category in categories]

@router.get("/roots", response_model=List[CategoryResponse])
async def get_root_categories(
    db: Session = Depends(get_db)
):
    categories = CategoryCRUD.get_root_categories(db)
    return [format_category_response(category) for category in categories]

@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(
    category_id: str,
    db: Session = Depends(get_db)
):
    category = CategoryCRUD.get_category(db, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return format_category_response(category)

@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: str,
    category_update: CategoryUpdate,
    db: Session = Depends(get_db)
):
    category = CategoryCRUD.update_category(db, category_id, category_update)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return format_category_response(category)

@router.delete("/{category_id}")
async def delete_category(
    category_id: str,
    db: Session = Depends(get_db)
):
    if not CategoryCRUD.delete_category(db, category_id):
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted successfully"}

def format_category_response(category) -> CategoryResponse:
    children = []
    if category.children:
        children = [format_category_response(child) for child in category.children]
    
    return CategoryResponse(
        id=category.id,
        name=category.name,
        description=category.description,
        color=category.color,
        parent_id=category.parent_id,
        created_at=category.created_at,
        updated_at=category.updated_at,
        children=children
    )

def format_category_list_response(category) -> CategoryListResponse:
    article_count = len(category.articles) if category.articles else 0
    
    return CategoryListResponse(
        id=category.id,
        name=category.name,
        description=category.description,
        color=category.color,
        parent_id=category.parent_id,
        created_at=category.created_at,
        updated_at=category.updated_at,
        article_count=article_count
    )