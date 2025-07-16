import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useCategoriesStore } from '../store/categories';
import { api, APIError, ValidationAPIError } from '../utils/api';
import {
  CategoryResponse,
  CategoryCreate,
  CategoryUpdate,
  PaginationQuery,
  API_ENDPOINTS,
} from '../types/api';

// Query keys
export const CATEGORY_QUERY_KEYS = {
  all: ['categories'] as const,
  lists: () => [...CATEGORY_QUERY_KEYS.all, 'list'] as const,
  list: (params: PaginationQuery) => [...CATEGORY_QUERY_KEYS.lists(), params] as const,
  roots: () => [...CATEGORY_QUERY_KEYS.all, 'roots'] as const,
  details: () => [...CATEGORY_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...CATEGORY_QUERY_KEYS.details(), id] as const,
};

// Hook for fetching categories list
export const useCategoriesList = (params: PaginationQuery = {}) => {
  const { setCategories, setError } = useCategoriesStore();
  
  return useQuery(
    CATEGORY_QUERY_KEYS.list(params),
    async () => {
      const response = await api.get<CategoryResponse[]>(API_ENDPOINTS.CATEGORIES, params);
      return response;
    },
    {
      onSuccess: (data) => {
        setCategories(data);
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

// Hook for fetching root categories
export const useRootCategories = () => {
  const { setRootCategories, setError } = useCategoriesStore();
  
  return useQuery(
    CATEGORY_QUERY_KEYS.roots(),
    async () => {
      const response = await api.get<CategoryResponse[]>(API_ENDPOINTS.ROOT_CATEGORIES);
      return response;
    },
    {
      onSuccess: (data) => {
        setRootCategories(data);
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

// Hook for fetching single category
export const useCategory = (id: string | undefined) => {
  const { setCurrentCategory, setError } = useCategoriesStore();
  
  return useQuery(
    CATEGORY_QUERY_KEYS.detail(id!),
    async () => {
      const response = await api.get<CategoryResponse>(API_ENDPOINTS.CATEGORY_BY_ID(id!));
      return response;
    },
    {
      enabled: !!id,
      onSuccess: (data) => {
        setCurrentCategory(data);
        setError(null);
      },
      onError: (error: APIError) => {
        setError(error.message);
        setCurrentCategory(null);
      },
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );
};

// Hook for creating categories
export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  const { addCategory, setError } = useCategoriesStore();
  
  return useMutation(
    async (data: CategoryCreate) => {
      const response = await api.post<CategoryResponse>(API_ENDPOINTS.CATEGORIES, data);
      return response;
    },
    {
      onSuccess: (data) => {
        // Add to store
        addCategory(data);
        
        // Invalidate queries
        queryClient.invalidateQueries(CATEGORY_QUERY_KEYS.lists());
        queryClient.invalidateQueries(CATEGORY_QUERY_KEYS.roots());
        setError(null);
      },
      onError: (error: APIError | ValidationAPIError) => {
        setError(error.message);
      },
    }
  );
};

// Hook for updating categories
export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  const { updateCategory, setError } = useCategoriesStore();
  
  return useMutation(
    async ({ id, data }: { id: string; data: CategoryUpdate }) => {
      const response = await api.put<CategoryResponse>(
        API_ENDPOINTS.CATEGORY_BY_ID(id),
        data
      );
      return response;
    },
    {
      onSuccess: (data) => {
        // Update store
        updateCategory(data.id, data);
        
        // Invalidate queries
        queryClient.invalidateQueries(CATEGORY_QUERY_KEYS.detail(data.id));
        queryClient.invalidateQueries(CATEGORY_QUERY_KEYS.lists());
        queryClient.invalidateQueries(CATEGORY_QUERY_KEYS.roots());
        setError(null);
      },
      onError: (error: APIError | ValidationAPIError) => {
        setError(error.message);
      },
    }
  );
};

// Hook for deleting categories
export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  const { removeCategory, setError } = useCategoriesStore();
  
  return useMutation(
    async (id: string) => {
      await api.delete(API_ENDPOINTS.CATEGORY_BY_ID(id));
      return id;
    },
    {
      onSuccess: (id) => {
        // Remove from store
        removeCategory(id);
        
        // Invalidate queries
        queryClient.invalidateQueries(CATEGORY_QUERY_KEYS.lists());
        queryClient.invalidateQueries(CATEGORY_QUERY_KEYS.roots());
        queryClient.removeQueries(CATEGORY_QUERY_KEYS.detail(id));
        setError(null);
      },
      onError: (error: APIError) => {
        setError(error.message);
      },
    }
  );
};

// Hook for managing category operations
export const useCategoryOperations = () => {
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();
  const { clearError } = useCategoriesStore();
  
  const createCategory = useCallback(
    async (data: CategoryCreate) => {
      try {
        const result = await createMutation.mutateAsync(data);
        return result;
      } catch (error) {
        throw error;
      }
    },
    [createMutation]
  );
  
  const updateCategory = useCallback(
    async (id: string, data: CategoryUpdate) => {
      try {
        const result = await updateMutation.mutateAsync({ id, data });
        return result;
      } catch (error) {
        throw error;
      }
    },
    [updateMutation]
  );
  
  const deleteCategory = useCallback(
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
    createCategory,
    updateCategory,
    deleteCategory,
    clearError,
    isCreating: createMutation.isLoading,
    isUpdating: updateMutation.isLoading,
    isDeleting: deleteMutation.isLoading,
    isOperating: createMutation.isLoading || updateMutation.isLoading || deleteMutation.isLoading,
  };
};

// Hook for building category hierarchy
export const useCategoryHierarchy = () => {
  const { categories } = useCategoriesStore();
  
  return useCallback(() => {
    const buildHierarchy = (categories: CategoryResponse[]) => {
      const categoryMap = new Map<string, CategoryResponse>();
      const rootCategories: CategoryResponse[] = [];
      
      // First pass: create map of all categories
      categories.forEach(category => {
        categoryMap.set(category.id, { ...category, children: [] });
      });
      
      // Second pass: build hierarchy
      categories.forEach(category => {
        if (category.parent_id) {
          const parent = categoryMap.get(category.parent_id);
          if (parent) {
            parent.children.push(categoryMap.get(category.id)!);
          }
        } else {
          rootCategories.push(categoryMap.get(category.id)!);
        }
      });
      
      return rootCategories;
    };
    
    return buildHierarchy(categories);
  }, [categories]);
};