"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/stores/app-store";
import { Header } from "@/components/layout/header";
import { Breadcrumb, BreadcrumbItem } from "@/components/ui/breadcrumb";
import { PromptListHeader } from "@/components/features/prompts/prompt-list-header";
import { PromptListView } from "@/components/features/prompts/prompt-list-view";
import { CategoriesTab } from "@/components/features/knowledge/categories-tab";
import { TagsTab } from "@/components/features/knowledge/tags-tab";
import { ProtectedRoute } from "@/components/auth/protected-route";

const breadcrumbItems: BreadcrumbItem[] = [
  { label: "提示词管理", current: true }
];

type TabType = 'prompts' | 'categories' | 'tags';

export default function PromptsPage() {
  const { 
    prompts, 
    loading, 
    error, 
    fetchPrompts,
    searchQuery,
    currentView,
    selectedCategories,
    selectedTags,
    minRating
  } = useAppStore();

  const [filteredPrompts, setFilteredPrompts] = useState(prompts);
  const [activeTab, setActiveTab] = useState<TabType>('prompts');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>([]);

  const tabs = [
    { id: 'prompts', label: '提示词库' },
    { id: 'categories', label: '分类管理' },
    { id: 'tags', label: '标签管理' }
  ] as const;

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  // 筛选提示词
  useEffect(() => {
    let filtered = [...prompts];

    // 搜索筛选
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(prompt => 
        prompt.title.toLowerCase().includes(query) ||
        (prompt.content && prompt.content.toLowerCase().includes(query)) ||
        prompt.description?.toLowerCase().includes(query)
      );
    }

    // 分类筛选
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(prompt => 
        prompt.category_id && selectedCategories.includes(prompt.category_id)
      );
    }

    // 标签筛选
    if (selectedTags.length > 0) {
      filtered = filtered.filter(prompt => 
        prompt.tags?.some(tag => selectedTags.includes(tag))
      );
    }

    // 评分筛选
    if (minRating > 0) {
      filtered = filtered.filter(prompt => 
        (prompt.rating || 0) >= minRating
      );
    }

    setFilteredPrompts(filtered);
  }, [prompts, searchQuery, selectedCategories, selectedTags, minRating]);

  // 处理批量选择
  const handleToggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedPrompts([]);
  };

  const handleSelectionChange = (selectedIds: string[]) => {
    setSelectedPrompts(selectedIds);
  };

  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
          <Header />
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-destructive mb-4">加载失败</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <button 
                onClick={() => fetchPrompts()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                重试
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        {/* 导航栏 */}
        <Header />
        
        {/* 主要内容 */}
        <main className="container mx-auto px-4 py-6 space-y-6">
          {/* 面包屑导航 */}
          <Breadcrumb items={breadcrumbItems} />

          {/* 页面标题和选项卡 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground">提示词管理</h1>
                <p className="text-muted-foreground mt-1">
                  管理和组织您的提示词库，支持多种视图和高级搜索
                </p>
              </div>
            </div>

            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex overflow-x-auto" aria-label="选项卡">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      px-4 py-3 mr-4 font-medium text-sm border-b-2 transition-all duration-200
                      ${activeTab === tab.id
                        ? 'text-primary-600 dark:text-primary-400 border-primary-600 dark:border-primary-400'
                        : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-primary-600 dark:hover:text-primary-400'
                      }
                    `}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* 选项卡内容 */}
          <div className="tab-content">
            {activeTab === 'prompts' && (
              <div className="space-y-6">
                {/* 搜索和筛选头部 */}
                <PromptListHeader 
                  selectedPrompts={selectedPrompts}
                  onSelectionChange={handleSelectionChange}
                  isSelectionMode={isSelectionMode}
                  onToggleSelectionMode={handleToggleSelectionMode}
                />

                {/* 提示词列表视图 */}
                <PromptListView 
                  prompts={filteredPrompts}
                  loading={loading}
                  viewMode={currentView}
                  isSelectionMode={isSelectionMode}
                  selectedPrompts={selectedPrompts}
                  onSelectionChange={handleSelectionChange}
                />
              </div>
            )}
            {activeTab === 'categories' && <CategoriesTab />}
            {activeTab === 'tags' && <TagsTab />}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
} 