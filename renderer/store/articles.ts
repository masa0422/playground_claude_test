import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  ArticleResponse,
  ArticleListResponse,
  ArticleCreate,
  ArticleUpdate,
  PaginationQuery,
} from '../types/api';

interface ArticlesState {
  // State
  articles: ArticleListResponse[];
  currentArticle: ArticleResponse | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    total: number;
    skip: number;
    limit: number;
  };
  
  // Actions
  setArticles: (articles: ArticleListResponse[]) => void;
  setCurrentArticle: (article: ArticleResponse | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPagination: (pagination: { total: number; skip: number; limit: number }) => void;
  
  // Article operations
  addArticle: (article: ArticleListResponse) => void;
  updateArticle: (id: string, article: Partial<ArticleListResponse>) => void;
  removeArticle: (id: string) => void;
  
  // Reset functions
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  articles: [],
  currentArticle: null,
  isLoading: false,
  error: null,
  pagination: {
    total: 0,
    skip: 0,
    limit: 20,
  },
};

export const useArticlesStore = create<ArticlesState>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      // Basic setters
      setArticles: (articles) => 
        set({ articles }, false, 'setArticles'),
      
      setCurrentArticle: (article) => 
        set({ currentArticle: article }, false, 'setCurrentArticle'),
      
      setLoading: (loading) => 
        set({ isLoading: loading }, false, 'setLoading'),
      
      setError: (error) => 
        set({ error }, false, 'setError'),
      
      setPagination: (pagination) => 
        set({ pagination }, false, 'setPagination'),
      
      // Article operations
      addArticle: (article) => 
        set(
          (state) => ({
            articles: [article, ...state.articles],
            pagination: {
              ...state.pagination,
              total: state.pagination.total + 1,
            },
          }),
          false,
          'addArticle'
        ),
      
      updateArticle: (id, updatedData) => 
        set(
          (state) => ({
            articles: state.articles.map(article =>
              article.id === id ? { ...article, ...updatedData } : article
            ),
            currentArticle: state.currentArticle?.id === id
              ? { ...state.currentArticle, ...updatedData }
              : state.currentArticle,
          }),
          false,
          'updateArticle'
        ),
      
      removeArticle: (id) => 
        set(
          (state) => ({
            articles: state.articles.filter(article => article.id !== id),
            currentArticle: state.currentArticle?.id === id ? null : state.currentArticle,
            pagination: {
              ...state.pagination,
              total: Math.max(0, state.pagination.total - 1),
            },
          }),
          false,
          'removeArticle'
        ),
      
      // Utility functions
      clearError: () => 
        set({ error: null }, false, 'clearError'),
      
      reset: () => 
        set(initialState, false, 'reset'),
    }),
    {
      name: 'articles-store',
    }
  )
);