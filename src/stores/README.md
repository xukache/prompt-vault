# 状态管理架构

本项目使用 Zustand 作为状态管理库，采用模块化的设计，将不同功能的状态分离到不同的 store 中。

## Store 结构

### 1. App Store (`app-store.ts`)
主应用状态管理，包含：
- **提示词管理**: prompts, currentPrompt
- **UI状态**: sidebarOpen, currentView
- **搜索筛选**: searchQuery, searchMode, selectedCategories, selectedTags
- **分类标签**: categories, tags
- **异步操作**: fetchPrompts, addPrompt, updatePrompt, deletePrompt, searchPrompts

```typescript
import { useAppStore } from '@/stores';

// 在组件中使用
const { prompts, loading, fetchPrompts } = useAppStore();
```

### 2. Settings Store (`settings-store.ts`)
用户设置管理，包含：
- **主题设置**: theme (light/dark/system)
- **语言设置**: language (zh-CN/en-US)
- **编辑器设置**: fontSize, tabSize, wordWrap, autoSave
- **搜索设置**: enableSemanticSearch, maxResults

```typescript
import { useSettingsStore } from '@/stores';

// 在组件中使用
const { theme, updateTheme } = useSettingsStore();
```

### 3. Knowledge Store (`knowledge-store.ts`)
知识库管理，包含：
- **知识条目**: items, currentItem
- **筛选搜索**: searchQuery, selectedType, selectedTags
- **异步操作**: fetchItems, addItem, updateItem, deleteItem, searchItems

```typescript
import { useKnowledgeStore } from '@/stores';

// 在组件中使用
const { items, fetchItems, addItem } = useKnowledgeStore();
```

### 4. Vector Store (`vector-store.ts`)
向量数据库管理，包含：
- **连接状态**: isConnected, config
- **搜索功能**: searchResults, searchSimilar
- **集合管理**: collections, currentCollection
- **文档操作**: addDocuments, deleteDocuments

```typescript
import { useVectorStore } from '@/stores';

// 在组件中使用
const { isConnected, connect, searchSimilar } = useVectorStore();
```

## 使用模式

### 1. 基础状态访问
```typescript
// 获取状态
const prompts = useAppStore(state => state.prompts);

// 获取多个状态
const { prompts, loading, error } = useAppStore(state => ({
  prompts: state.prompts,
  loading: state.loading,
  error: state.error
}));
```

### 2. 异步操作
```typescript
// 获取数据
useEffect(() => {
  useAppStore.getState().fetchPrompts();
}, []);

// 添加数据
const handleAddPrompt = async (promptData) => {
  await useAppStore.getState().addPrompt(promptData);
};
```

### 3. 状态持久化
部分状态会自动持久化到 localStorage：
- App Store: currentView, sidebarOpen, selectedCategories, selectedTags
- Settings Store: 所有设置
- Knowledge Store: selectedType, selectedTags
- Vector Store: config, searchMode, currentCollection

### 4. 错误处理
所有异步操作都包含错误处理：
```typescript
const { error, setError } = useAppStore();

// 清除错误
useEffect(() => {
  if (error) {
    const timer = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(timer);
  }
}, [error, setError]);
```

## 最佳实践

1. **选择器优化**: 使用选择器避免不必要的重渲染
2. **异步操作**: 在组件外部调用异步方法
3. **错误处理**: 始终处理异步操作的错误状态
4. **状态重置**: 在适当时机调用 reset 方法清理状态
5. **类型安全**: 充分利用 TypeScript 类型检查

## 扩展指南

添加新的状态管理：
1. 创建新的 store 文件
2. 定义状态接口和初始状态
3. 实现状态操作方法
4. 在 `index.ts` 中导出
5. 添加相应的类型定义 