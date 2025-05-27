"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  HeartIcon, 
  EyeIcon,
  ClockIcon,
  PencilIcon,
  TrashIcon
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon, StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";
import { Prompt } from "@/types";
import { useAppStore } from "@/stores/app-store";
import { ClientTime } from '@/components/ui/client-time';

interface PromptListItemProps {
  prompt: Prompt;
  onEdit?: (prompt: Prompt) => void;
  onDelete?: (promptId: string) => void;
  onDuplicate?: (prompt: Prompt) => void;
  onExport?: (prompt: Prompt) => void;
  onShare?: (prompt: Prompt) => void;
  onAddToFavorites?: (promptId: string) => void;
  onRemoveFromFavorites?: (promptId: string) => void;
  showActions?: boolean;
  className?: string;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: (isSelected: boolean) => void;
}

export const PromptListItem: React.FC<PromptListItemProps> = ({
  prompt,
  onEdit,
  onDelete,
  onDuplicate,
  onExport,
  onShare,
  onAddToFavorites,
  onRemoveFromFavorites,
  showActions = true,
  className = '',
  isSelectionMode = false,
  isSelected = false,
  onSelect
}) => {
  const { deletePrompt, categories: categoriesData = [], fetchCategories } = useAppStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 获取分类数据
  useEffect(() => {
    fetchCategories().catch((error) => {
      console.error('Failed to fetch categories:', error);
    });
  }, [fetchCategories]);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const response = await fetch(`/api/prompts/${prompt.id}/favorite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_favorite: !prompt.is_favorite
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '收藏操作失败');
      }

      const result = await response.json();
      
      // 直接更新本地状态，不调用updatePrompt
      const { setPrompts, prompts } = useAppStore.getState();
      const updatedPrompts = prompts.map(p => 
        p.id === prompt.id ? { ...p, is_favorite: result.is_favorite } : p
      );
      setPrompts(updatedPrompts);
      
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      alert('收藏操作失败，请重试');
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm('确定要删除这个提示词吗？此操作无法撤销。')) {
      try {
        await deletePrompt(prompt.id);
      } catch (error) {
        console.error('Failed to delete prompt:', error);
      }
    }
  };

  const truncateContent = (content: string | undefined, maxLength: number = 150) => {
    if (!content || content.length <= maxLength) return content || '';
    return content.substring(0, maxLength) + '...';
  };

  const getCategoryColor = (categoryId?: string) => {
    // 根据分类ID生成一致的颜色
    const colors = [
      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    ];
    
    if (!categoryId) {
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
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

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) {
      return '未分类';
    }
    
    // 从真实的分类数据中查找
    const category = categoriesData.find(cat => cat.id === categoryId);
    return category ? category.name : '未分类';
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onSelect?.(e.target.checked);
  };

  return (
    <div 
      className={`group bg-background border border-border rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:border-primary/50 ${
        isSelectionMode && isSelected ? 'border-primary bg-primary/5' : ''
      }`}
      onMouseEnter={() => setIsMenuOpen(true)}
      onMouseLeave={() => setIsMenuOpen(false)}
    >
      <div className="flex items-start justify-between">
        {/* 批量选择模式下的勾选框 */}
        {isSelectionMode && (
          <div className="flex items-center mr-3 mt-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleCheckboxChange}
              className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
        )}
        
        {/* 左侧内容 */}
        <Link 
          href={isSelectionMode ? '#' : `/prompts/${prompt.id}`} 
          className="flex-1 min-w-0"
          onClick={(e) => {
            if (isSelectionMode) {
              e.preventDefault();
              onSelect?.(!isSelected);
            }
          }}
        >
          <div className="flex items-start gap-4">
            {/* 主要信息 */}
            <div className="flex-1 min-w-0">
              {/* 标题和分类 */}
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                  {prompt.title}
                </h3>
                {prompt.version && (
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded border border-purple-200 dark:border-purple-700">
                    {prompt.version}
                  </span>
                )}
                {prompt.category_id && (
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(prompt.category_id)}`}>
                    {getCategoryName(prompt.category_id)}
                  </span>
                )}
                {prompt.is_favorite && (
                  <HeartSolidIcon className="h-4 w-4 text-red-500" title="已收藏" />
                )}
              </div>

              {/* 描述 */}
              {prompt.description && (
                <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                  {prompt.description}
                </p>
              )}

              {/* 内容预览 */}
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {truncateContent(prompt.content || '')}
              </p>

              {/* 标签 */}
              {prompt.tags && prompt.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {prompt.tags.slice(0, 5).map((tag, index) => (
                    <span 
                      key={`tag-${prompt.id}-${tag}-${index}`}
                      className="inline-block px-2 py-1 text-xs bg-accent text-accent-foreground rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                  {prompt.tags.length > 5 && (
                    <span className="inline-block px-2 py-1 text-xs text-muted-foreground">
                      +{prompt.tags.length - 5}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* 右侧统计信息 */}
            <div className="flex flex-col items-end gap-2 text-xs text-muted-foreground min-w-0">
              {/* 评分 */}
              <div className="flex items-center gap-1">
                <StarSolidIcon className="h-3 w-3 text-yellow-500" />
                <span>{prompt.rating || 0}</span>
              </div>
              
              {/* 更新时间 */}
              <div className="flex items-center gap-1">
                <ClockIcon className="h-3 w-3" />
                <span><ClientTime date={prompt.updated_at} /></span>
              </div>
            </div>
          </div>
        </Link>

        {/* 操作按钮 */}
        {isMenuOpen && (
          <div className="flex items-center gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={handleToggleFavorite}
              className="p-2 rounded-md hover:bg-accent transition-colors"
              title={prompt.is_favorite ? "取消收藏" : "收藏"}
            >
              {prompt.is_favorite ? (
                <HeartSolidIcon className="h-4 w-4 text-red-500" />
              ) : (
                <HeartIcon className="h-4 w-4 text-muted-foreground hover:text-red-500" />
              )}
            </button>
            
            <Link
              href={`/editor?id=${prompt.id}`}
              className="p-2 rounded-md hover:bg-accent transition-colors"
              title="编辑"
            >
              <PencilIcon className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </Link>
            
            <button
              onClick={handleDelete}
              className="p-2 rounded-md hover:bg-accent transition-colors"
              title="删除"
            >
              <TrashIcon className="h-4 w-4 text-muted-foreground hover:text-red-500" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}; 