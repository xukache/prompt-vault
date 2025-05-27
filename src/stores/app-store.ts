"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Prompt, Category, Tag } from "@/types";

interface AppState {
  // 提示词状态
  prompts: Prompt[];
  currentPrompt: Prompt | null;
  loading: boolean;
  error: string | null;
  
  // UI状态
  sidebarOpen: boolean;
  currentView: 'grid' | 'list' | 'kanban';
  
  // 搜索和筛选状态
  searchQuery: string;
  searchMode: 'keyword' | 'semantic' | 'hybrid';
  selectedCategories: string[];
  selectedTags: string[];
  minRating: number;
  
  // 分类和标签状态
  categories: Category[];
  tags: Tag[];
  
  // 操作方法 - 基础设置
  setPrompts: (prompts: Prompt[]) => void;
  setCurrentPrompt: (prompt: Prompt | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  toggleSidebar: () => void;
  setCurrentView: (view: 'grid' | 'list' | 'kanban') => void;
  setSearchQuery: (query: string) => void;
  setSearchMode: (mode: 'keyword' | 'semantic' | 'hybrid') => void;
  setSelectedCategories: (categories: string[]) => void;
  setSelectedTags: (tags: string[]) => void;
  setMinRating: (rating: number) => void;
  setCategories: (categories: Category[]) => void;
  setTags: (tags: Tag[]) => void;
  
  // 异步操作方法
  fetchPrompts: () => Promise<void>;
  fetchPromptById: (id: string) => Promise<Prompt>;
  addPrompt: (prompt: Omit<Prompt, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updatePrompt: (id: string, updates: Partial<Prompt>) => Promise<void>;
  deletePrompt: (id: string) => Promise<void>;
  searchPrompts: (query: string, mode?: 'keyword' | 'semantic' | 'hybrid') => Promise<void>;
  
  // 分类和标签操作
  fetchCategories: () => Promise<void>;
  fetchTags: () => Promise<void>;
  addCategory: (category: Omit<Category, 'id' | 'created_at'>) => Promise<void>;
  addTag: (tag: Omit<Tag, 'id' | 'created_at' | 'usage_count'>) => Promise<void>;
  
  reset: () => void;
}

// 初始状态
const initialState = {
  prompts: [],
  currentPrompt: null,
  loading: false,
  error: null,
  
  sidebarOpen: true,
  currentView: 'grid' as const,
  
  searchQuery: '',
  searchMode: 'keyword' as const,
  selectedCategories: [],
  selectedTags: [],
  minRating: 0,
  
  categories: [],
  tags: [],
};

// 创建应用状态存储
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // 基础设置方法
      setPrompts: (prompts) => set({ prompts }),
      setCurrentPrompt: (currentPrompt) => set({ currentPrompt }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setCurrentView: (currentView) => set({ currentView }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setSearchMode: (searchMode) => set({ searchMode }),
      setSelectedCategories: (selectedCategories) => set({ selectedCategories }),
      setSelectedTags: (selectedTags) => set({ selectedTags }),
      setMinRating: (minRating) => set({ minRating }),
      setCategories: (categories) => set({ categories }),
      setTags: (tags) => set({ tags }),
      
      // 异步操作方法
      fetchPrompts: async () => {
        set({ loading: true, error: null });
        try {
          const response = await fetch('/api/prompts');
          if (!response.ok) {
            throw new Error('Failed to fetch prompts');
          }
          const data = await response.json();
          set({ prompts: data, loading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch prompts', 
            loading: false 
          });
        }
      },

      fetchPromptById: async (id: string) => {
        try {
          const response = await fetch(`/api/prompts/${id}`);
          if (!response.ok) {
            throw new Error('Failed to fetch prompt');
          }
          const prompt = await response.json();
          set({ currentPrompt: prompt });
          return prompt;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch prompt';
          set({ error: errorMessage });
          throw new Error(errorMessage);
        }
      },
      
      addPrompt: async (promptData) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch('/api/prompts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(promptData),
          });
          
          if (!response.ok) {
            throw new Error('Failed to add prompt');
          }
          
          const newPrompt = await response.json();
          set((state) => ({ 
            prompts: [...state.prompts, newPrompt],
            loading: false 
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to add prompt';
          set({ 
            error: errorMessage, 
            loading: false 
          });
          throw new Error(errorMessage);
        }
      },
      
      updatePrompt: async (id, updates) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`/api/prompts/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates),
          });
          
          if (!response.ok) {
            throw new Error('Failed to update prompt');
          }
          
          const updatedPrompt = await response.json();
          set((state) => ({
            prompts: state.prompts.map(p => p.id === id ? updatedPrompt : p),
            currentPrompt: state.currentPrompt?.id === id ? updatedPrompt : state.currentPrompt,
            loading: false
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update prompt';
          set({ 
            error: errorMessage, 
            loading: false 
          });
          throw new Error(errorMessage);
        }
      },
      
      deletePrompt: async (id) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`/api/prompts/${id}`, {
            method: 'DELETE',
          });
          
          if (!response.ok) {
            throw new Error('Failed to delete prompt');
          }
          
          set((state) => ({
            prompts: state.prompts.filter(p => p.id !== id),
            currentPrompt: state.currentPrompt?.id === id ? null : state.currentPrompt,
            loading: false
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete prompt', 
            loading: false 
          });
        }
      },
      
      searchPrompts: async (query, mode = 'keyword') => {
        set({ loading: true, error: null, searchQuery: query, searchMode: mode });
        try {
          const searchParams = new URLSearchParams({
            q: query,
            mode,
          });
          
          const response = await fetch(`/api/prompts/search?${searchParams}`);
          if (!response.ok) {
            throw new Error('Failed to search prompts');
          }
          
          const data = await response.json();
          set({ prompts: data, loading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to search prompts', 
            loading: false 
          });
        }
      },
      
      // 分类操作
      fetchCategories: async () => {
        try {
          const response = await fetch('/api/categories');
          if (!response.ok) {
            throw new Error('Failed to fetch categories');
          }
          const data = await response.json();
          set({ categories: data });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch categories'
          });
        }
      },
      
      addCategory: async (categoryData) => {
        try {
          const response = await fetch('/api/categories', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(categoryData),
          });
          
          if (!response.ok) {
            throw new Error('Failed to add category');
          }
          
          const newCategory = await response.json();
          set((state) => ({ 
            categories: [...state.categories, newCategory]
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to add category'
          });
        }
      },
      
      // 标签操作
      fetchTags: async () => {
        try {
          const response = await fetch('/api/tags');
          if (!response.ok) {
            throw new Error('Failed to fetch tags');
          }
          const data = await response.json();
          set({ tags: data });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch tags'
          });
        }
      },
      
      addTag: async (tagData) => {
        try {
          const response = await fetch('/api/tags', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(tagData),
          });
          
          if (!response.ok) {
            throw new Error('Failed to add tag');
          }
          
          const newTag = await response.json();
          set((state) => ({ 
            tags: [...state.tags, newTag]
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to add tag'
          });
        }
      },
      
      reset: () => set(initialState),
    }),
    {
      name: 'app-store',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        currentView: state.currentView,
        searchMode: state.searchMode,
      }),
    }
  )
); 