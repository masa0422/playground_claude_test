import { useCallback, useState } from 'react';
import { useQuery } from 'react-query';
import { api, APIError } from '../utils/api';
import {
  SearchQuery,
  SearchResponse,
  SearchSuggestionsQuery,
  SearchSuggestionsResponse,
  API_ENDPOINTS,
} from '../types/api';

// Query keys
export const SEARCH_QUERY_KEYS = {
  all: ['search'] as const,
  results: () => [...SEARCH_QUERY_KEYS.all, 'results'] as const,
  result: (query: SearchQuery) => [...SEARCH_QUERY_KEYS.results(), query] as const,
  suggestions: () => [...SEARCH_QUERY_KEYS.all, 'suggestions'] as const,
  suggestion: (query: SearchSuggestionsQuery) => [...SEARCH_QUERY_KEYS.suggestions(), query] as const,
};

// Hook for searching articles
export const useSearchArticles = (query: SearchQuery, enabled: boolean = true) => {
  const [error, setError] = useState<string | null>(null);
  
  return useQuery(
    SEARCH_QUERY_KEYS.result(query),
    async () => {
      const params = new URLSearchParams();
      params.append('q', query.q);
      
      if (query.category_ids && query.category_ids.length > 0) {
        query.category_ids.forEach(id => params.append('category_ids', id));
      }
      
      if (query.tags && query.tags.length > 0) {
        query.tags.forEach(tag => params.append('tags', tag));
      }
      
      if (query.skip !== undefined) {
        params.append('skip', query.skip.toString());
      }
      
      if (query.limit !== undefined) {
        params.append('limit', query.limit.toString());
      }
      
      const response = await api.get<SearchResponse>(
        `${API_ENDPOINTS.SEARCH_ARTICLES}?${params.toString()}`
      );
      return response;
    },
    {
      enabled: enabled && !!query.q?.trim(),
      onSuccess: () => {
        setError(null);
      },
      onError: (error: APIError) => {
        setError(error.message);
      },
      staleTime: 30 * 1000, // 30 seconds
      refetchOnWindowFocus: false,
    }
  );
};

// Hook for getting search suggestions
export const useSearchSuggestions = (query: SearchSuggestionsQuery, enabled: boolean = true) => {
  const [error, setError] = useState<string | null>(null);
  
  return useQuery(
    SEARCH_QUERY_KEYS.suggestion(query),
    async () => {
      const params = new URLSearchParams();
      params.append('q', query.q);
      
      if (query.limit !== undefined) {
        params.append('limit', query.limit.toString());
      }
      
      const response = await api.get<SearchSuggestionsResponse>(
        `${API_ENDPOINTS.SEARCH_SUGGESTIONS}?${params.toString()}`
      );
      return response;
    },
    {
      enabled: enabled && !!query.q?.trim() && query.q.length >= 2,
      onSuccess: () => {
        setError(null);
      },
      onError: (error: APIError) => {
        setError(error.message);
      },
      staleTime: 10 * 1000, // 10 seconds
      refetchOnWindowFocus: false,
    }
  );
};

// Hook for managing search operations
export const useSearchOperations = () => {
  const [currentQuery, setCurrentQuery] = useState<SearchQuery>({
    q: '',
    category_ids: [],
    tags: [],
    skip: 0,
    limit: 20,
  });
  
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const search = useCallback(async (query: SearchQuery) => {
    setIsSearching(true);
    setCurrentQuery(query);
    setError(null);
    
    try {
      // The actual search is handled by useSearchArticles hook
      // This is just for state management
      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Search failed');
      return false;
    } finally {
      setIsSearching(false);
    }
  }, []);
  
  const clearSearch = useCallback(() => {
    setCurrentQuery({
      q: '',
      category_ids: [],
      tags: [],
      skip: 0,
      limit: 20,
    });
    setError(null);
  }, []);
  
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  return {
    search,
    clearSearch,
    clearError,
    currentQuery,
    isSearching,
    error,
  };
};