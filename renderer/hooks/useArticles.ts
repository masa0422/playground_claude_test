import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useArticlesStore } from '../store/articles';
import { api, APIError, ValidationAPIError } from '../utils/api';
import {
  ArticleResponse,
  ArticleListResponse,
  ArticleCreate,
  ArticleUpdate,
  ArticleHistoryResponse,
  PaginationQuery,
  API_ENDPOINTS,
} from '../types/api';

// Query keys
export const ARTICLE_QUERY_KEYS = {
  all: ['articles'] as const,
  lists: () => [...ARTICLE_QUERY_KEYS.all, 'list'] as const,
  list: (params: PaginationQuery) => [...ARTICLE_QUERY_KEYS.lists(), params] as const,
  details: () => [...ARTICLE_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...ARTICLE_QUERY_KEYS.details(), id] as const,
  history: (id: string) => [...ARTICLE_QUERY_KEYS.all, 'history', id] as const,
};

// Hook for fetching articles list
export const useArticlesList = (params: PaginationQuery = {}) => {
  const { setArticles, setError, setPagination } = useArticlesStore();
  
  return useQuery(
    ARTICLE_QUERY_KEYS.list(params),
    async () => {
      const response = await api.get<ArticleListResponse[]>(API_ENDPOINTS.ARTICLES, params);
      return response;
    },
    {
      onSuccess: (data) => {
        setArticles(data);
        setPagination({
          total: data.length, // Note: Real API should return pagination info
          skip: params.skip || 0,
          limit: params.limit || 20,
        });
        setError(null);
      },
      onError: (error: APIError) => {
        setError(error.message);
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    }
  );
};

// Hook for fetching single article
export const useArticle = (id: string | undefined) => {
  const { setCurrentArticle, setError } = useArticlesStore();
  
  return useQuery(
    ARTICLE_QUERY_KEYS.detail(id!),
    async () => {
      const response = await api.get<ArticleResponse>(API_ENDPOINTS.ARTICLE_BY_ID(id!));
      return response;
    },
    {
      enabled: !!id,
      onSuccess: (data) => {
        setCurrentArticle(data);
        setError(null);
      },
      onError: (error: APIError) => {
        setError(error.message);
        setCurrentArticle(null);
      },
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );
};

// Hook for fetching article history
export const useArticleHistory = (id: string | undefined) => {
  return useQuery(
    ARTICLE_QUERY_KEYS.history(id!),
    async () => {
      const response = await api.get<ArticleHistoryResponse[]>(
        API_ENDPOINTS.ARTICLE_HISTORY(id!)
      );
      return response;
    },
    {
      enabled: !!id,
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );
};

// Hook for creating articles
export const useCreateArticle = () => {
  const queryClient = useQueryClient();
  const { addArticle, setError } = useArticlesStore();
  
  return useMutation(
    async (data: ArticleCreate) => {
      const response = await api.post<ArticleResponse>(API_ENDPOINTS.ARTICLES, data);
      return response;
    },
    {
      onSuccess: (data) => {
        // Add to store (convert to list response format)
        const listArticle: ArticleListResponse = {
          id: data.id,
          title: data.title,
          content: data.content,
          tags: data.tags,
          version: data.version,
          categories: data.categories,
          created_at: data.created_at,
          updated_at: data.updated_at,
        };
        addArticle(listArticle);
        
        // Invalidate queries
        queryClient.invalidateQueries(ARTICLE_QUERY_KEYS.lists());
        setError(null);
      },
      onError: (error: APIError | ValidationAPIError) => {
        setError(error.message);
      },
    }
  );
};

// Hook for updating articles
export const useUpdateArticle = () => {
  const queryClient = useQueryClient();
  const { updateArticle, setError } = useArticlesStore();
  
  return useMutation(
    async ({ id, data }: { id: string; data: ArticleUpdate }) => {
      const response = await api.put<ArticleResponse>(
        API_ENDPOINTS.ARTICLE_BY_ID(id),
        data
      );
      return response;
    },
    {
      onSuccess: (data) => {
        // Update store
        updateArticle(data.id, {
          title: data.title,
          content: data.content,
          tags: data.tags,
          version: data.version,
          categories: data.categories,
          updated_at: data.updated_at,
        });
        
        // Invalidate queries
        queryClient.invalidateQueries(ARTICLE_QUERY_KEYS.detail(data.id));
        queryClient.invalidateQueries(ARTICLE_QUERY_KEYS.lists());
        queryClient.invalidateQueries(ARTICLE_QUERY_KEYS.history(data.id));
        setError(null);
      },
      onError: (error: APIError | ValidationAPIError) => {
        setError(error.message);
      },
    }
  );
};

// Hook for deleting articles
export const useDeleteArticle = () => {
  const queryClient = useQueryClient();
  const { removeArticle, setError } = useArticlesStore();
  
  return useMutation(
    async (id: string) => {
      await api.delete(API_ENDPOINTS.ARTICLE_BY_ID(id));
      return id;
    },
    {
      onSuccess: (id) => {
        // Remove from store
        removeArticle(id);
        
        // Invalidate queries
        queryClient.invalidateQueries(ARTICLE_QUERY_KEYS.lists());
        queryClient.removeQueries(ARTICLE_QUERY_KEYS.detail(id));
        queryClient.removeQueries(ARTICLE_QUERY_KEYS.history(id));
        setError(null);
      },
      onError: (error: APIError) => {
        setError(error.message);
      },
    }
  );
};

// Hook for managing article operations
export const useArticleOperations = () => {
  const createMutation = useCreateArticle();
  const updateMutation = useUpdateArticle();
  const deleteMutation = useDeleteArticle();
  const { clearError } = useArticlesStore();
  
  const createArticle = useCallback(
    async (data: ArticleCreate) => {
      try {
        const result = await createMutation.mutateAsync(data);
        return result;
      } catch (error) {
        throw error;
      }
    },
    [createMutation]
  );
  
  const updateArticle = useCallback(
    async (id: string, data: ArticleUpdate) => {
      try {
        const result = await updateMutation.mutateAsync({ id, data });
        return result;
      } catch (error) {
        throw error;
      }
    },
    [updateMutation]
  );
  
  const deleteArticle = useCallback(
    async (id: string) => {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        throw error;
      }
    },
    [deleteMutation]
  );
  
  return {
    createArticle,
    updateArticle,
    deleteArticle,
    clearError,
    isCreating: createMutation.isLoading,
    isUpdating: updateMutation.isLoading,
    isDeleting: deleteMutation.isLoading,
    isOperating: createMutation.isLoading || updateMutation.isLoading || deleteMutation.isLoading,
  };
};