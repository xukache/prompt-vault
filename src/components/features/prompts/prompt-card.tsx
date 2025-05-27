"use client";

import React from 'react';
import Link from "next/link";
import { 
  HeartIcon, 
  HeartIcon as HeartSolidIcon,
  ClockIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon
} from "@heroicons/react/24/outline";
import { Prompt } from "@/types";
import { useAppStore } from "@/stores/app-store";
import { LiveTime } from '@/components/ui/client-time';
import { Rating } from '@/components/ui/rating';

interface PromptCardProps {
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

export const PromptCard: React.FC<PromptCardProps> = ({
  prompt,
  onDelete,
  isSelectionMode = false,
  isSelected = false,
  onSelect
}) => {
  const { deletePrompt, categories: categoriesData = [], fetchCategories } = useAppStore();

  // 获取分类数据
  React.useEffect(() => {
    fetchCategories().catch((error) => {
      console.error('Failed to fetch categories:', error);
    });
  }, [fetchCategories]);

  // 截断内容函数
  const truncateContent = (content: string | undefined, maxLength: number = 120) => {
    if (!content || content.length <= maxLength) return content || '';
    return content.substring(0, maxLength) + '...';
  };

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
        if (onDelete) {
          onDelete(prompt.id);
        }
      } catch (error) {
        console.error('Failed to delete prompt:', error);
        alert('删除失败，请重试');
      }
    }
  };

  // 标签颜色映射
  const getTagStyle = (tag: string, index: number) => {
    const tagStyles = [
      'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200 dark:from-blue-900/20 dark:to-blue-800/30 dark:text-blue-300 dark:border-blue-700',
      'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-green-200 dark:from-green-900/20 dark:to-green-800/30 dark:text-green-300 dark:border-green-700',
      'bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-700 border-yellow-200 dark:from-yellow-900/20 dark:to-yellow-800/30 dark:text-yellow-300 dark:border-yellow-700',
      'bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 border-purple-200 dark:from-purple-900/20 dark:to-purple-800/30 dark:text-purple-300 dark:border-purple-700',
      'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border-red-200 dark:from-red-900/20 dark:to-red-800/30 dark:text-red-300 dark:border-red-700',
    ];
    return tagStyles[index % tagStyles.length];
  };

  // 分类颜色映射
  const getCategoryColor = (categoryId?: string) => {
    // 根据分类ID生成一致的颜色
    const colors = [
      'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200 dark:from-blue-900/20 dark:to-blue-800/30 dark:text-blue-300 dark:border-blue-700',
      'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-green-200 dark:from-green-900/20 dark:to-green-800/30 dark:text-green-300 dark:border-green-700',
      'bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 border-purple-200 dark:from-purple-900/20 dark:to-purple-800/30 dark:text-purple-300 dark:border-purple-700',
      'bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 border-orange-200 dark:from-orange-900/20 dark:to-orange-800/30 dark:text-orange-300 dark:border-orange-700',
      'bg-gradient-to-r from-pink-50 to-pink-100 text-pink-700 border-pink-200 dark:from-pink-900/20 dark:to-pink-800/30 dark:text-pink-300 dark:border-pink-700',
      'bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700 border-indigo-200 dark:from-indigo-900/20 dark:to-indigo-800/30 dark:text-indigo-300 dark:border-indigo-700',
      'bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-700 border-yellow-200 dark:from-yellow-900/20 dark:to-yellow-800/30 dark:text-yellow-300 dark:border-yellow-700',
      'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border-red-200 dark:from-red-900/20 dark:to-red-800/30 dark:text-red-300 dark:border-red-700',
    ];
    
    if (!categoryId) {
      return 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-gray-200 dark:from-gray-900/20 dark:to-gray-800/30 dark:text-gray-300 dark:border-gray-700';
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

  const handleCardClick = (e: React.MouseEvent) => {
    if (isSelectionMode) {
      e.preventDefault();
      onSelect?.(!isSelected);
    }
  };

  return (
    <div 
      className={`group relative bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/50 flex flex-col ${
        isSelectionMode && isSelected ? 'border-primary bg-primary/5' : ''
      }`}
      onClick={handleCardClick}
    >
      {/* 批量选择模式下的勾选框 */}
      {isSelectionMode && (
        <div className="absolute top-3 left-3 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleCheckboxChange}
            className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
      )}
      
      {/* 卡片内容区域 */}
      <div className="flex-1 p-5">
        {/* 标题和版本 */}
        <div className="flex items-start justify-between mb-3">
          <Link 
            href={isSelectionMode ? '#' : `/prompts/${prompt.id}`} 
            className="flex-1"
            onClick={(e) => {
              if (isSelectionMode) {
                e.preventDefault();
              }
            }}
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors line-clamp-2 pr-2">
              {prompt.title}
            </h3>
          </Link>
          <span className="inline-flex items-center bg-gradient-to-r from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/40 text-purple-700 dark:text-purple-300 text-xs font-semibold px-2 py-1 rounded border border-purple-200 dark:border-purple-700 whitespace-nowrap ml-2">
            {prompt.version || 'v1.0'}
          </span>
        </div>

        {/* 分类标签 */}
        {prompt.category_id && (
          <div className="mb-3">
            <span className={`inline-flex items-center text-xs font-medium px-3 py-1 rounded border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${getCategoryColor(prompt.category_id)}`}>
              {getCategoryName(prompt.category_id)}
            </span>
          </div>
        )}

        {/* 描述 */}
        <div className="mb-4" style={{ height: '4.5rem' }}>
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
            {prompt.description || truncateContent(prompt.content || '')}
          </p>
        </div>

        {/* 标签 */}
        {prompt.tags && prompt.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {prompt.tags.slice(0, 3).map((tag, index) => (
              <span 
                key={`tag-${prompt.id}-${tag}-${index}`}
                className={`inline-flex items-center text-xs font-medium px-3 py-1 rounded border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${getTagStyle(tag, index)}`}
              >
                {tag}
              </span>
            ))}
            {prompt.tags.length > 3 && (
              <span className="inline-flex items-center text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                +{prompt.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* 评分和时间信息 */}
        <div className="flex items-center justify-between">
          {/* 评分显示 */}
          <div className="flex items-center">
            <Rating 
              value={prompt.rating || 0} 
              readonly 
              size="sm" 
              showValue 
            />
          </div>

          {/* 时间徽章 - 使用真实数据 */}
          <div className="inline-flex items-center bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-md border border-blue-200 dark:border-blue-700 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200">
            <ClockIcon className="h-3 w-3 mr-1" />
            <span className="text-xs font-medium">
              <LiveTime date={prompt.updated_at} />
            </span>
          </div>
        </div>
      </div>

      {/* 卡片底部操作区域 */}
      <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
        {/* 左侧操作按钮 */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleToggleFavorite}
            className="p-1.5 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-sm hover:-translate-y-0.5"
            title={prompt.is_favorite ? "取消收藏" : "收藏"}
          >
            {prompt.is_favorite ? (
              <HeartSolidIcon className="h-4 w-4 text-red-500" />
            ) : (
              <HeartIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors" />
            )}
          </button>
        </div>

        {/* 右侧操作按钮 */}
        <div className="flex items-center space-x-2">
          <Link
            href={`/prompts/${prompt.id}`}
            className="p-1.5 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-sm hover:-translate-y-0.5"
            title="查看详情"
          >
            <EyeIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 hover:text-primary transition-colors" />
          </Link>
          
          <Link
            href={`/editor?id=${prompt.id}`}
            className="p-1.5 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-sm hover:-translate-y-0.5"
            title="编辑"
          >
            <PencilIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 hover:text-primary transition-colors" />
          </Link>

          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-sm hover:-translate-y-0.5"
            title="删除"
          >
            <TrashIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
}; 