"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { KnowledgeItem } from "@/types";

interface KnowledgeState {
  // 知识库状态
  items: KnowledgeItem[];
  currentItem: KnowledgeItem | null;
  loading: boolean;
  error: string | null;
  
  // 筛选和搜索状态
  searchQuery: string;
  selectedType: 'all' | 'concept' | 'example' | 'template';
  selectedTags: string[];
  
  // 基础设置方法
  setItems: (items: KnowledgeItem[]) => void;
  setCurrentItem: (item: KnowledgeItem | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSelectedType: (type: 'all' | 'concept' | 'example' | 'template') => void;
  setSelectedTags: (tags: string[]) => void;
  
  // 异步操作方法
  fetchItems: () => Promise<void>;
  addItem: (item: Omit<KnowledgeItem, 'id' | 'createdAt'>) => Promise<void>;
  updateItem: (id: string, updates: Partial<KnowledgeItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  searchItems: (query: string) => Promise<void>;
  
  reset: () => void;
}

// 初始状态
const initialState = {
  items: [],
  currentItem: null,
  loading: false,
  error: null,
  
  searchQuery: '',
  selectedType: 'all' as const,
  selectedTags: [],
};

// 创建知识库状态存储
export const useKnowledgeStore = create<KnowledgeState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // 基础设置方法
      setItems: (items) => set({ items }),
      setCurrentItem: (currentItem) => set({ currentItem }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setSelectedType: (selectedType) => set({ selectedType }),
      setSelectedTags: (selectedTags) => set({ selectedTags }),
      
      // 异步操作方法
      fetchItems: async () => {
        set({ loading: true, error: null });
        try {
          const response = await fetch('/api/knowledge');
          if (!response.ok) {
            throw new Error('Failed to fetch knowledge items');
          }
          const data = await response.json();
          set({ items: data, loading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch knowledge items', 
            loading: false 
          });
        }
      },
      
      addItem: async (itemData) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch('/api/knowledge', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(itemData),
          });
          
          if (!response.ok) {
            throw new Error('Failed to add knowledge item');
          }
          
          const newItem = await response.json();
          set((state) => ({ 
            items: [...state.items, newItem],
            loading: false 
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to add knowledge item', 
            loading: false 
          });
        }
      },
      
      updateItem: async (id, updates) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`/api/knowledge/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates),
          });
          
          if (!response.ok) {
            throw new Error('Failed to update knowledge item');
          }
          
          const updatedItem = await response.json();
          set((state) => ({
            items: state.items.map(item => item.id === id ? updatedItem : item),
            currentItem: state.currentItem?.id === id ? updatedItem : state.currentItem,
            loading: false
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update knowledge item', 
            loading: false 
          });
        }
      },
      
      deleteItem: async (id) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`/api/knowledge/${id}`, {
            method: 'DELETE',
          });
          
          if (!response.ok) {
            throw new Error('Failed to delete knowledge item');
          }
          
          set((state) => ({
            items: state.items.filter(item => item.id !== id),
            currentItem: state.currentItem?.id === id ? null : state.currentItem,
            loading: false
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete knowledge item', 
            loading: false 
          });
        }
      },
      
      searchItems: async (query) => {
        set({ loading: true, error: null, searchQuery: query });
        try {
          const searchParams = new URLSearchParams({
            q: query,
            type: get().selectedType,
            tags: get().selectedTags.join(','),
          });
          
          const response = await fetch(`/api/knowledge/search?${searchParams}`);
          if (!response.ok) {
            throw new Error('Failed to search knowledge items');
          }
          
          const data = await response.json();
          set({ items: data, loading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to search knowledge items', 
            loading: false 
          });
        }
      },
      
      reset: () => set(initialState),
    }),
    {
      name: 'knowledge-store',
      partialize: (state) => ({
        selectedType: state.selectedType,
        selectedTags: state.selectedTags,
      }),
    }
  )
); 