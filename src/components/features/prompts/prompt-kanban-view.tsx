"use client";

import { useMemo, useEffect } from "react";
import { Prompt } from "@/types";
import { PromptCard } from "./prompt-card";
import { useAppStore } from "@/stores/app-store";

interface PromptKanbanViewProps {
  prompts: Prompt[];
  isSelectionMode?: boolean;
  selectedPrompts?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
}

export const PromptKanbanView = ({ 
  prompts,
  isSelectionMode = false,
  selectedPrompts = [],
  onSelectionChange
}: PromptKanbanViewProps) => {
  const { categories: categoriesData = [], fetchCategories } = useAppStore();

  // 获取分类数据
  useEffect(() => {
    fetchCategories().catch((error) => {
      console.error('Failed to fetch categories:', error);
    });
  }, [fetchCategories]);

  // 按分类分组提示词
  const groupedPrompts = useMemo(() => {
    const groups: Record<string, Prompt[]> = {};
    
    prompts.forEach(prompt => {
      const categoryId = prompt.category_id || 'uncategorized';
      if (!groups[categoryId]) {
        groups[categoryId] = [];
      }
      groups[categoryId].push(prompt);
    });
    
    return groups;
  }, [prompts]);

  const getCategoryName = (categoryId: string) => {
    if (categoryId === 'uncategorized') {
      return '未分类';
    }
    
    // 从真实的分类数据中查找
    const category = categoriesData.find(cat => cat.id === categoryId);
    return category ? category.name : categoryId;
  };

  const getCategoryColor = (categoryId: string) => {
    // 根据分类ID生成一致的颜色
    const colors = [
      'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950',
      'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950',
      'border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950',
      'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950',
      'border-pink-200 bg-pink-50 dark:border-pink-800 dark:bg-pink-950',
      'border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950',
      'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950',
      'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950',
    ];
    
    if (categoryId === 'uncategorized') {
      return 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950';
    }
    
    // 使用分类ID的哈希值来选择颜色，确保同一分类总是使用相同颜色
    let hash = 0;
    for (let i = 0; i < categoryId.length; i++) {
      const char = categoryId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    
    const colorIndex = Math.abs(hash) % colors.length;
    return colors[colorIndex];
  };

  const categories = Object.keys(groupedPrompts);

  if (categories.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-accent rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">📋</span>
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">暂无提示词</h3>
        <p className="text-muted-foreground">
          还没有创建任何提示词，点击上方的&ldquo;创建提示词&rdquo;按钮开始吧！
        </p>
      </div>
    );
  }

  return (
    <div className="flex gap-6 overflow-x-auto pb-4">
      {categories.map((categoryId, categoryIndex) => (
        <div 
          key={`category-${categoryId}-${categoryIndex}`}
          className={`flex-shrink-0 w-80 border-2 rounded-lg p-4 ${getCategoryColor(categoryId)}`}
        >
          {/* 分类标题 */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              {getCategoryName(categoryId)}
            </h3>
            <span className="text-sm text-muted-foreground bg-background px-2 py-1 rounded-full">
              {groupedPrompts[categoryId].length}
            </span>
          </div>

          {/* 提示词列表 */}
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {groupedPrompts[categoryId].map((prompt, promptIndex) => {
              const handlePromptSelect = (isSelected: boolean) => {
                if (!onSelectionChange) return;
                
                if (isSelected) {
                  onSelectionChange([...selectedPrompts, prompt.id]);
                } else {
                  onSelectionChange(selectedPrompts.filter(id => id !== prompt.id));
                }
              };

              return (
                <div key={`prompt-${prompt.id}-${categoryId}-${promptIndex}`} className="transform scale-95">
                  <PromptCard 
                    prompt={prompt}
                    isSelectionMode={isSelectionMode}
                    isSelected={selectedPrompts.includes(prompt.id)}
                    onSelect={handlePromptSelect}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}; 