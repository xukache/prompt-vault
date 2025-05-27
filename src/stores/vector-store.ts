"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// Orama搜索结果类型
export interface VectorSearchResult {
  id: string;
  content: string;
  title: string;
  metadata: {
    prompt_id: string;
    title: string;
    category?: string;
    tags?: string[];
    [key: string]: unknown;
  };
  score: number;
}

// 向量数据库配置
export interface VectorConfig {
  enableEmbeddings: boolean;
  searchMode: 'fulltext' | 'vector' | 'hybrid';
  maxResults: number;
  enableVerboseLogging: boolean;
}

interface VectorState {
  // 连接状态
  isConnected: boolean;
  loading: boolean;
  error: string | null;
  
  // 配置
  config: VectorConfig;
  
  // 搜索状态
  searchResults: VectorSearchResult[];
  searchQuery: string;
  searchMode: 'fulltext' | 'vector' | 'hybrid';
  
  // 数据库统计
  totalDocuments: number;
  isVectorSearchEnabled: boolean;
  
  // 基础设置方法
  setConnected: (connected: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setConfig: (config: Partial<VectorConfig>) => void;
  setSearchResults: (results: VectorSearchResult[]) => void;
  setSearchQuery: (query: string) => void;
  setSearchMode: (mode: 'fulltext' | 'vector' | 'hybrid') => void;
  setTotalDocuments: (count: number) => void;
  setVectorSearchEnabled: (enabled: boolean) => void;
  
  // 异步操作方法
  initialize: () => Promise<void>;
  addDocument: (document: {
    id: string;
    content: string;
    metadata: {
      prompt_id: string;
      title: string;
      description?: string;
      category?: string;
      tags?: string[];
    };
  }) => Promise<void>;
  updateDocument: (document: {
    id: string;
    content: string;
    metadata: {
      prompt_id: string;
      title: string;
      description?: string;
      category?: string;
      tags?: string[];
    };
  }) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  searchSimilar: (query: string, limit?: number) => Promise<VectorSearchResult[]>;
  batchAddDocuments: (documents: Array<{
    id: string;
    content: string;
    metadata: {
      prompt_id: string;
      title: string;
      description?: string;
      category?: string;
      tags?: string[];
    };
  }>) => Promise<void>;
  getStats: () => Promise<void>;
  clearDatabase: () => Promise<void>;
  
  reset: () => void;
}

// 默认配置
const defaultConfig: VectorConfig = {
  enableEmbeddings: true,
  searchMode: 'hybrid',
  maxResults: 10,
  enableVerboseLogging: false,
};

// 初始状态
const initialState = {
  isConnected: false,
  loading: false,
  error: null,
  
  config: defaultConfig,
  
  searchResults: [],
  searchQuery: '',
  searchMode: 'hybrid' as const,
  
  totalDocuments: 0,
  isVectorSearchEnabled: false,
};

// 创建向量数据库状态存储
export const useVectorStore = create<VectorState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // 基础设置方法
      setConnected: (isConnected) => set({ isConnected }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setConfig: (configUpdate) => 
        set((state) => ({ 
          config: { ...state.config, ...configUpdate } 
        })),
      setSearchResults: (searchResults) => set({ searchResults }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setSearchMode: (searchMode) => set({ searchMode }),
      setTotalDocuments: (totalDocuments) => set({ totalDocuments }),
      setVectorSearchEnabled: (isVectorSearchEnabled) => set({ isVectorSearchEnabled }),
      
      // 异步操作方法
      initialize: async () => {
        set({ loading: true, error: null });
        try {
          // 动态导入Orama模块（避免SSR问题）
          const { initializeOrama, getDatabaseStats } = await import('@/lib/vector/orama');
          
          await initializeOrama();
          const stats = await getDatabaseStats();
          
          set({ 
            isConnected: true, 
            loading: false,
            totalDocuments: stats.totalDocuments,
            isVectorSearchEnabled: stats.isVectorSearchEnabled,
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to initialize vector database',
            isConnected: false,
            loading: false 
          });
        }
      },
      
      addDocument: async (document) => {
        set({ loading: true, error: null });
        try {
          const { addDocumentToVectorStore } = await import('@/lib/vector/orama');
          
          await addDocumentToVectorStore(
            document.id,
            document.content,
            document.metadata
          );
          
          // 更新统计信息
          await get().getStats();
          set({ loading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to add document',
            loading: false 
          });
        }
      },
      
      updateDocument: async (document) => {
        set({ loading: true, error: null });
        try {
          const { updateDocumentInVectorStore } = await import('@/lib/vector/orama');
          
          await updateDocumentInVectorStore(
            document.id,
            document.content,
            document.metadata
          );
          
          set({ loading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update document',
            loading: false 
          });
        }
      },
      
      deleteDocument: async (id) => {
        set({ loading: true, error: null });
        try {
          const { deleteDocumentFromVectorStore } = await import('@/lib/vector/orama');
          
          await deleteDocumentFromVectorStore(id);
          
          // 更新统计信息
          await get().getStats();
          set({ loading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete document',
            loading: false 
          });
        }
      },
      
      searchSimilar: async (query, limit = 10) => {
        set({ loading: true, error: null, searchQuery: query });
        try {
          const { searchSimilarDocuments } = await import('@/lib/vector/orama');
          const { searchMode } = get();
          
          const results = await searchSimilarDocuments(query, limit, searchMode);
          
          set({ searchResults: results, loading: false });
          return results;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to search documents',
            loading: false 
          });
          return [];
        }
      },
      
      batchAddDocuments: async (documents) => {
        set({ loading: true, error: null });
        try {
          const { batchAddDocuments } = await import('@/lib/vector/orama');
          
          await batchAddDocuments(documents);
          
          // 更新统计信息
          await get().getStats();
          set({ loading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to batch add documents',
            loading: false 
          });
        }
      },
      
      getStats: async () => {
        try {
          const { getDatabaseStats } = await import('@/lib/vector/orama');
          const stats = await getDatabaseStats();
          
          set({ 
            totalDocuments: stats.totalDocuments,
            isVectorSearchEnabled: stats.isVectorSearchEnabled,
          });
        } catch (error) {
          console.error('Failed to get database stats:', error);
        }
      },
      
      clearDatabase: async () => {
        set({ loading: true, error: null });
        try {
          const { clearDatabase } = await import('@/lib/vector/orama');
          
          await clearDatabase();
          
          set({ 
            loading: false,
            searchResults: [],
            totalDocuments: 0,
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to clear database',
            loading: false 
          });
        }
      },
      
      reset: () => set(initialState),
    }),
    {
      name: 'vector-store',
      partialize: (state) => ({
        config: state.config,
        searchMode: state.searchMode,
      }),
    }
  )
); 