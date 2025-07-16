// API type definitions for Wiki Desktop Application

// Base types
export interface BaseResponse {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface PaginationQuery {
  skip?: number;
  limit?: number;
}

export interface PaginationResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}

// Article types
export interface ArticleCreate {
  title: string;
  content: string;
  tags?: string[];
  category_ids?: string[];
}

export interface ArticleUpdate {
  title?: string;
  content?: string;
  tags?: string[];
  category_ids?: string[];
}

export interface ArticleResponse extends BaseResponse {
  title: string;
  content: string;
  tags: string[];
  version: number;
  categories: CategoryResponse[];
}

export interface ArticleListResponse extends BaseResponse {
  title: string;
  content: string;
  tags: string[];
  version: number;
  categories: CategoryResponse[];
}

export interface ArticleHistoryResponse extends BaseResponse {
  article_id: string;
  title: string;
  content: string;
  version: number;
  change_type: 'created' | 'updated' | 'deleted';
}

// Category types
export interface CategoryCreate {
  name: string;
  description?: string;
  color?: string;
  parent_id?: string;
}

export interface CategoryUpdate {
  name?: string;
  description?: string;
  color?: string;
  parent_id?: string;
}

export interface CategoryResponse extends BaseResponse {
  name: string;
  description?: string;
  color?: string;
  parent_id?: string;
  parent?: CategoryResponse;
  children: CategoryResponse[];
  articles: ArticleResponse[];
}

// Search types
export interface SearchQuery {
  q: string;
  category_ids?: string[];
  tags?: string[];
  skip?: number;
  limit?: number;
}

export interface SearchResponse {
  articles: ArticleListResponse[];
  total: number;
  skip: number;
  limit: number;
}

export interface SearchSuggestionsQuery {
  q: string;
  limit?: number;
}

export interface SearchSuggestionsResponse {
  suggestions: string[];
}

// Error types
export interface ErrorResponse {
  detail: string;
  status_code: number;
}

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface ValidationErrorResponse {
  detail: ValidationError[];
}

// API endpoints
export const API_ENDPOINTS = {
  // Articles
  ARTICLES: '/api/v1/articles/',
  ARTICLE_BY_ID: (id: string) => `/api/v1/articles/${id}/`,
  ARTICLE_HISTORY: (id: string) => `/api/v1/articles/${id}/history/`,
  
  // Categories
  CATEGORIES: '/api/v1/categories/',
  CATEGORY_BY_ID: (id: string) => `/api/v1/categories/${id}/`,
  ROOT_CATEGORIES: '/api/v1/categories/roots/',
  
  // Search
  SEARCH_ARTICLES: '/api/v1/search/articles/',
  SEARCH_SUGGESTIONS: '/api/v1/search/suggestions/',
  
  // Health
  HEALTH: '/health',
  ROOT: '/',
} as const;