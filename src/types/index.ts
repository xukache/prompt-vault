// 提示词类型
export interface Prompt {
  id: string;
  title: string;
  content: string;
  description?: string;
  category_id?: string;
  rating: number;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  tags?: string[];
  usage_count?: number;
  versions?: PromptVersion[];
  version?: string;
  instructions?: string;
  notes?: string;
  variables?: Record<string, string>;
}

// 分类类型
export interface Category {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  color: string;
  icon: string;
  order_index: number;
  created_at: string;
  children?: Category[];
}

// 标签类型
export interface Tag {
  id: string;
  name: string;
  color: string;
  description?: string;
  usage_count: number;
  created_at: string;
}

// 版本类型
export interface PromptVersion {
  id: string;
  prompt_id: string;
  version_number: number;
  title: string;
  content: string;
  change_description?: string;
  created_at: string;
}

// 使用统计类型
export interface UsageStat {
  id: string;
  prompt_id: string;
  used_at: string;
  context?: string;
}

// 用户设置类型
export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'zh-CN' | 'en-US';
  editor: {
    fontSize: number;
    tabSize: number;
    wordWrap: boolean;
    autoSave: boolean;
  };
  search: {
    enableSemanticSearch: boolean;
    maxResults: number;
  };
}

// 应用缓存类型
export interface AppCache {
  recentPrompts: string[];
  searchHistory: string[];
  favoriteCategories: string[];
  lastBackup: string;
}

// 知识库条目类型
export interface KnowledgeBase {
  id: string;
  title: string;
  content: string;
  type: 'domain' | 'template' | 'practice' | 'reference';
  description?: string;
  tags?: string;
  usage_count: number;
  created_at: string;
  updated_at: string;
  tag_list?: Tag[];
}

// 知识库引用类型
export interface KnowledgeBaseReference {
  id: string;
  knowledge_id: string;
  prompt_id: string;
  created_at: string;
}

// 保持向后兼容的旧接口
export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  type: 'concept' | 'example' | 'template';
  tags: string[];
  references: string[];
  createdAt: string;
}

// 效果记录类型
export interface PromptResult {
  id: string;
  prompt_id: string;
  title?: string;
  cover_image?: string;
  generated_content?: string;
  result_type: 'text' | 'image' | 'html' | 'other';
  result_data?: string;
  rating: number;
  feedback?: string;
  created_at: string;
  updated_at: string;
}

// 效果评价类型
export interface ResultRating {
  id: string;
  result_id: string;
  rating_type: 'like' | 'dislike' | 'star' | 'score';
  rating_value: number;
  comment?: string;
  created_at: string;
} 