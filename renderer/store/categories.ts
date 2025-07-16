import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  CategoryResponse,
  CategoryCreate,
  CategoryUpdate,
} from '../types/api';

interface CategoriesState {
  // State
  categories: CategoryResponse[];
  rootCategories: CategoryResponse[];
  currentCategory: CategoryResponse | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setCategories: (categories: CategoryResponse[]) => void;
  setRootCategories: (categories: CategoryResponse[]) => void;
  setCurrentCategory: (category: CategoryResponse | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Category operations
  addCategory: (category: CategoryResponse) => void;
  updateCategory: (id: string, category: Partial<CategoryResponse>) => void;
  removeCategory: (id: string) => void;
  
  // Utility functions
  getCategoryById: (id: string) => CategoryResponse | undefined;
  getCategoryByName: (name: string) => CategoryResponse | undefined;
  getCategoryChildren: (parentId: string) => CategoryResponse[];
  getCategoryPath: (id: string) => CategoryResponse[];
  
  // Reset functions
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  categories: [],
  rootCategories: [],
  currentCategory: null,
  isLoading: false,
  error: null,
};

export const useCategoriesStore = create<CategoriesState>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      // Basic setters
      setCategories: (categories) => 
        set({ categories }, false, 'setCategories'),
      
      setRootCategories: (rootCategories) => 
        set({ rootCategories }, false, 'setRootCategories'),
      
      setCurrentCategory: (category) => 
        set({ currentCategory: category }, false, 'setCurrentCategory'),
      
      setLoading: (loading) => 
        set({ isLoading: loading }, false, 'setLoading'),
      
      setError: (error) => 
        set({ error }, false, 'setError'),
      
      // Category operations
      addCategory: (category) => 
        set(
          (state) => {
            const updatedCategories = [category, ...state.categories];
            const updatedRootCategories = category.parent_id 
              ? state.rootCategories 
              : [category, ...state.rootCategories];
            
            return {
              categories: updatedCategories,
              rootCategories: updatedRootCategories,
            };
          },
          false,
          'addCategory'
        ),
      
      updateCategory: (id, updatedData) => 
        set(
          (state) => {
            const updateCategoryInArray = (categories: CategoryResponse[]) => 
              categories.map(category => 
                category.id === id ? { ...category, ...updatedData } : category
              );
            
            return {
              categories: updateCategoryInArray(state.categories),
              rootCategories: updateCategoryInArray(state.rootCategories),
              currentCategory: state.currentCategory?.id === id
                ? { ...state.currentCategory, ...updatedData }
                : state.currentCategory,
            };
          },
          false,
          'updateCategory'
        ),
      
      removeCategory: (id) => 
        set(
          (state) => {
            const removeCategoryFromArray = (categories: CategoryResponse[]) => 
              categories.filter(category => category.id !== id);
            
            return {
              categories: removeCategoryFromArray(state.categories),
              rootCategories: removeCategoryFromArray(state.rootCategories),
              currentCategory: state.currentCategory?.id === id ? null : state.currentCategory,
            };
          },
          false,
          'removeCategory'
        ),
      
      // Utility functions
      getCategoryById: (id) => {
        const { categories } = get();
        return categories.find(category => category.id === id);
      },
      
      getCategoryByName: (name) => {
        const { categories } = get();
        return categories.find(category => category.name === name);
      },
      
      getCategoryChildren: (parentId) => {
        const { categories } = get();
        return categories.filter(category => category.parent_id === parentId);
      },
      
      getCategoryPath: (id) => {
        const { categories } = get();
        const path: CategoryResponse[] = [];
        let currentId = id;
        
        while (currentId) {
          const category = categories.find(c => c.id === currentId);
          if (category) {
            path.unshift(category);
            currentId = category.parent_id || '';
          } else {
            break;
          }
        }
        
        return path;
      },
      
      // Reset functions
      clearError: () => 
        set({ error: null }, false, 'clearError'),
      
      reset: () => 
        set(initialState, false, 'reset'),
    }),
    {
      name: 'categories-store',
    }
  )
);