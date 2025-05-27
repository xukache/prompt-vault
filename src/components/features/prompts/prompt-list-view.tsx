"use client";

import { useState } from "react";
import { Prompt } from "@/types";
import { PromptCard } from "./prompt-card";
import { PromptListItem } from "./prompt-list-item";
import { PromptKanbanView } from "./prompt-kanban-view";
import { Pagination } from "@/components/ui/pagination";

interface PromptListViewProps {
  prompts: Prompt[];
  loading: boolean;
  viewMode: 'grid' | 'list' | 'kanban';
  isSelectionMode?: boolean;
  selectedPrompts?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
}

export const PromptListView = ({ 
  prompts, 
  loading, 
  viewMode,
  isSelectionMode = false,
  selectedPrompts = [],
  onSelectionChange
}: PromptListViewProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // 分页逻辑
  const totalPages = Math.ceil(prompts.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentPrompts = prompts.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // 重置到第一页
  };

  // 处理单个提示词的选择
  const handlePromptSelect = (promptId: string, isSelected: boolean) => {
    if (!onSelectionChange) return;
    
    if (isSelected) {
      onSelectionChange([...selectedPrompts, promptId]);
    } else {
      onSelectionChange(selectedPrompts.filter(id => id !== promptId));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* 加载骨架屏 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={`skeleton-${index}`} className="animate-pulse">
              <div className="bg-accent rounded-lg p-4 space-y-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-5/6"></div>
                </div>
                <div className="flex space-x-2">
                  <div className="h-6 bg-muted rounded-full w-16"></div>
                  <div className="h-6 bg-muted rounded-full w-12"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (prompts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-accent rounded-full flex items-center justify-center mb-4">
          <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">暂无提示词</h3>
        <p className="text-muted-foreground mb-4">
          还没有创建任何提示词，点击上方的&ldquo;创建提示词&rdquo;按钮开始吧！
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 结果统计 */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          找到 {prompts.length} 个提示词
          {isSelectionMode && selectedPrompts.length > 0 && (
            <span className="ml-2 text-primary-600 dark:text-primary-400">
              (已选择 {selectedPrompts.length} 个)
            </span>
          )}
        </p>
      </div>

      {/* 不同视图模式的内容 */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {currentPrompts.map((prompt) => (
            <PromptCard 
              key={prompt.id} 
              prompt={prompt}
              isSelectionMode={isSelectionMode}
              isSelected={selectedPrompts.includes(prompt.id)}
              onSelect={(isSelected) => handlePromptSelect(prompt.id, isSelected)}
            />
          ))}
        </div>
      )}

      {viewMode === 'list' && (
        <div className="space-y-2">
          {currentPrompts.map((prompt) => (
            <PromptListItem 
              key={prompt.id} 
              prompt={prompt}
              isSelectionMode={isSelectionMode}
              isSelected={selectedPrompts.includes(prompt.id)}
              onSelect={(isSelected) => handlePromptSelect(prompt.id, isSelected)}
            />
          ))}
        </div>
      )}

      {viewMode === 'kanban' && (
        <PromptKanbanView 
          prompts={currentPrompts}
          isSelectionMode={isSelectionMode}
          selectedPrompts={selectedPrompts}
          onSelectionChange={onSelectionChange}
        />
      )}

      {/* 分页组件 */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={prompts.length}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          className="mt-8"
        />
      )}
    </div>
  );
}; 