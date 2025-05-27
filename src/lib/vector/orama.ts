"use client";

import { create, insert, search, insertMultiple, remove } from '@orama/orama';
import { pluginEmbeddings } from '@orama/plugin-embeddings';

// Orama数据库实例 - 使用any避免复杂的泛型类型冲突
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any = null;
let isInitialized = false;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let initializationPromise: Promise<any> | null = null;

// 文档类型定义
export interface PromptDocument {
  id: string;
  title: string;
  content: string;
  description?: string;
  category?: string;
  tags?: string[];
  embeddings?: number[];
}

// 搜索结果类型
export interface OramaSearchResult {
  id: string;
  content: string;
  title: string;
  metadata: {
    prompt_id: string;
    title: string;
    category?: string;
    tags?: string[];
  };
  score: number;
}

// 搜索参数类型
export interface SearchParams {
  term: string;
  mode?: 'fulltext' | 'vector' | 'hybrid';
  limit?: number;
  similarity?: number;
  includeVectors?: boolean;
  offset?: number;
}

// 数据库统计信息类型
export interface DatabaseStats {
  totalDocuments: number;
  isVectorSearchEnabled: boolean;
  isInitialized: boolean;
  lastUpdated: string;
}

// 初始化Orama数据库
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function initializeOrama(): Promise<any> {
  // 如果已经初始化，直接返回
  if (db && isInitialized) return db;
  
  // 如果正在初始化，等待完成
  if (initializationPromise) return initializationPromise;

  initializationPromise = (async () => {
    try {
      console.log('正在初始化Orama数据库...');

      // 尝试创建带嵌入功能的数据库
      try {
        const plugin = await pluginEmbeddings({
          embeddings: {
            defaultProperty: 'embeddings',
            onInsert: {
              generate: true,
              properties: ['title', 'content', 'description'],
              verbose: process.env.NODE_ENV === 'development',
            }
          }
        });

        db = await create({
          schema: {
            id: 'string',
            title: 'string',
            content: 'string',
            description: 'string',
            category: 'string',
            tags: 'string[]',
            embeddings: 'vector[512]', // Orama生成512维向量
          },
          plugins: [plugin]
        });

        isInitialized = true;
        console.log('Orama数据库初始化成功（支持向量搜索）');
      } catch (embeddingError) {
        console.warn('嵌入插件初始化失败，降级到基础版本:', embeddingError);
        
        // 降级到无嵌入的基础版本
        db = await create({
          schema: {
            id: 'string',
            title: 'string',
            content: 'string',
            description: 'string',
            category: 'string',
            tags: 'string[]',
          }
        });
        
        isInitialized = false; // 标记为不支持向量搜索
        console.log('Orama数据库初始化成功（基础版本，不支持向量搜索）');
      }

      return db;
    } catch (error) {
      console.error('Orama数据库初始化失败:', error);
      initializationPromise = null;
      throw error;
    }
  })();

  return initializationPromise;
}

// 添加文档到向量存储
export async function addDocumentToVectorStore(
  documentId: string,
  content: string,
  metadata: {
    prompt_id: string;
    title: string;
    description?: string;
    category?: string;
    tags?: string[];
  }
): Promise<void> {
  const database = await initializeOrama();
  
  try {
    const document = {
      id: documentId,
      title: metadata.title,
      content: content,
      description: metadata.description || '',
      category: metadata.category || '',
      tags: metadata.tags || [],
    };

    await insert(database, document);
    
    console.log(`文档 ${documentId} 添加成功`);
  } catch (error) {
    console.error(`添加文档 ${documentId} 失败:`, error);
    throw error;
  }
}

// 更新文档
export async function updateDocumentInVectorStore(
  documentId: string,
  content: string,
  metadata: {
    prompt_id: string;
    title: string;
    description?: string;
    category?: string;
    tags?: string[];
  }
): Promise<void> {
  const database = await initializeOrama();
  
  try {
    // Orama不支持直接更新，需要先删除再插入
    await remove(database, documentId);
    
    const document = {
      id: documentId,
      title: metadata.title,
      content: content,
      description: metadata.description || '',
      category: metadata.category || '',
      tags: metadata.tags || [],
    };

    await insert(database, document);
    
    console.log(`文档 ${documentId} 更新成功`);
  } catch (error) {
    console.error(`更新文档 ${documentId} 失败:`, error);
    throw error;
  }
}

// 删除文档
export async function deleteDocumentFromVectorStore(documentId: string): Promise<void> {
  const database = await initializeOrama();
  
  try {
    await remove(database, documentId);
    console.log(`文档 ${documentId} 删除成功`);
  } catch (error) {
    console.error(`删除文档 ${documentId} 失败:`, error);
    throw error;
  }
}

// 语义搜索
export async function searchSimilarDocuments(
  query: string, 
  limit: number = 10,
  mode: 'fulltext' | 'vector' | 'hybrid' = 'hybrid'
): Promise<OramaSearchResult[]> {
  const database = await initializeOrama();
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const searchParams: any = {
      term: query,
      limit: Math.min(limit, 100), // 限制最大结果数
    };

    // 如果支持向量搜索，设置搜索模式
    if (isInitialized && mode !== 'fulltext') {
      searchParams.mode = mode;
      searchParams.similarity = 0.75; // 设置相似度阈值
      searchParams.includeVectors = false; // 不返回向量数据以节省内存
    } else {
      // 基础版本只支持全文搜索
      searchParams.mode = 'fulltext';
    }

    const results = await search(database, searchParams);
    
    // 转换结果格式
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return results.hits.map((hit: any) => ({
      id: hit.document.id,
      content: hit.document.content,
      title: hit.document.title,
      metadata: {
        prompt_id: hit.document.id,
        title: hit.document.title,
        category: hit.document.category,
        tags: hit.document.tags,
      },
      score: hit.score,
    }));
  } catch (error) {
    console.error('搜索失败:', error);
    return [];
  }
}

// 批量添加文档
export async function batchAddDocuments(documents: Array<{
  id: string;
  content: string;
  metadata: {
    prompt_id: string;
    title: string;
    description?: string;
    category?: string;
    tags?: string[];
  };
}>): Promise<void> {
  const database = await initializeOrama();
  
  try {
    const oramaDocuments = documents.map(doc => ({
      id: doc.id,
      title: doc.metadata.title,
      content: doc.content,
      description: doc.metadata.description || '',
      category: doc.metadata.category || '',
      tags: doc.metadata.tags || [],
    }));
    
    if (isInitialized) {
      // 支持向量搜索的版本，需要逐个插入以生成嵌入
      for (const doc of oramaDocuments) {
        await insert(database, doc);
      }
    } else {
      // 基础版本可以批量插入
      await insertMultiple(database, oramaDocuments);
    }
    
    console.log(`批量添加 ${documents.length} 个文档成功`);
  } catch (error) {
    console.error('批量添加文档失败:', error);
    throw error;
  }
}

// 获取数据库统计信息
export async function getDatabaseStats(): Promise<DatabaseStats> {
  try {
    const database = await initializeOrama();
    
    // 执行空搜索获取所有文档
    const results = await search(database, { 
      term: '', 
      limit: 1000,
      mode: 'fulltext' 
    });
    
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      totalDocuments: (results as any).count || 0,
      isVectorSearchEnabled: isInitialized,
      isInitialized: db !== null,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('获取数据库统计信息失败:', error);
    return {
      totalDocuments: 0,
      isVectorSearchEnabled: false,
      isInitialized: false,
      lastUpdated: new Date().toISOString(),
    };
  }
}

// 清空数据库
export async function clearDatabase(): Promise<void> {
  try {
    db = null;
    isInitialized = false;
    initializationPromise = null;
    await initializeOrama();
    console.log('数据库清空成功');
  } catch (error) {
    console.error('清空数据库失败:', error);
    throw error;
  }
}

// 高级搜索功能
export async function advancedSearch(params: {
  term: string;
  mode?: 'fulltext' | 'vector' | 'hybrid';
  filters?: {
    category?: string;
    tags?: string[];
  };
  sort?: {
    field: 'score' | 'title' | 'category';
    order: 'asc' | 'desc';
  };
  limit?: number;
  offset?: number;
}): Promise<OramaSearchResult[]> {
  const database = await initializeOrama();
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const searchParams: any = {
      term: params.term,
      limit: Math.min(params.limit || 10, 100),
      offset: params.offset || 0,
    };

    // 设置搜索模式
    if (isInitialized && params.mode !== 'fulltext') {
      searchParams.mode = params.mode || 'hybrid';
    } else {
      searchParams.mode = 'fulltext';
    }

    // 添加过滤条件
    if (params.filters) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = {};
      
      if (params.filters.category) {
        where.category = params.filters.category;
      }
      
      if (params.filters.tags && params.filters.tags.length > 0) {
        // Orama支持数组字段的包含查询
        where.tags = { containsAll: params.filters.tags };
      }
      
      if (Object.keys(where).length > 0) {
        searchParams.where = where;
      }
    }

    // 添加排序
    if (params.sort) {
      searchParams.sortBy = {
        [params.sort.field]: params.sort.order
      };
    }

    const results = await search(database, searchParams);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (results as any).hits.map((hit: any) => ({
      id: hit.document.id,
      content: hit.document.content,
      title: hit.document.title,
      metadata: {
        prompt_id: hit.document.id,
        title: hit.document.title,
        category: hit.document.category,
        tags: hit.document.tags,
      },
      score: hit.score,
    }));
  } catch (error) {
    console.error('高级搜索失败:', error);
    return [];
  }
}

// 导出数据库实例（用于高级操作）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getDatabase(): Promise<any> {
  return await initializeOrama();
}

// 检查向量搜索是否可用
export function isVectorSearchAvailable(): boolean {
  return isInitialized;
}

// 获取搜索建议
export async function getSearchSuggestions(
  query: string, 
  limit: number = 5
): Promise<string[]> {
  if (!query || query.length < 2) return [];
  
  try {
    const results = await searchSimilarDocuments(query, limit, 'fulltext');
    
    // 提取标题作为搜索建议
    const suggestions = results
      .map(result => result.title)
      .filter((title, index, array) => array.indexOf(title) === index) // 去重
      .slice(0, limit);
    
    return suggestions;
  } catch (error) {
    console.error('获取搜索建议失败:', error);
    return [];
  }
} 