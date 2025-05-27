"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  Squares2X2Icon, 
  ListBulletIcon,
  ViewColumnsIcon,
  XMarkIcon,
  ShareIcon,
  CheckIcon
} from "@heroicons/react/24/outline";
import { useAppStore } from "@/stores/app-store";
import { toast } from "react-hot-toast";

const viewModeOptions = [
  { value: 'grid', label: '网格视图' },
  { value: 'list', label: '列表视图' },
  { value: 'kanban', label: '看板视图' }
];

interface PromptListHeaderProps {
  selectedPrompts?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  isSelectionMode?: boolean;
  onToggleSelectionMode?: () => void;
}

export const PromptListHeader = ({ 
  selectedPrompts = [], 
  onSelectionChange, 
  isSelectionMode = false, 
  onToggleSelectionMode 
}: PromptListHeaderProps) => {
  const router = useRouter();
  const [isSharing, setIsSharing] = useState(false);
  const [shareDescription, setShareDescription] = useState("");
  const [showShareDialog, setShowShareDialog] = useState(false);
  
  const { 
    searchQuery, 
    setSearchQuery, 
    currentView, 
    setCurrentView,
    selectedCategories,
    setSelectedCategories,
    selectedTags,
    setSelectedTags,
    minRating,
    setMinRating,
    categories,
    tags,
    fetchCategories,
    fetchTags,
    prompts,
    fetchPrompts
  } = useAppStore();

  // 获取分类和标签数据
  useEffect(() => {
    fetchCategories();
    fetchTags();
  }, [fetchCategories, fetchTags]);

  const handleCreatePrompt = () => {
    router.push('/editor');
  };

  const handleViewModeChange = (mode: string) => {
    setCurrentView(mode as 'grid' | 'list' | 'kanban');
  };

  const getViewIcon = (mode: string) => {
    switch (mode) {
      case 'grid':
        return <Squares2X2Icon className="h-4 w-4" />;
      case 'list':
        return <ListBulletIcon className="h-4 w-4" />;
      case 'kanban':
        return <ViewColumnsIcon className="h-4 w-4" />;
      default:
        return <Squares2X2Icon className="h-4 w-4" />;
    }
  };

  // 转换分类数据为选项格式
  const categoryOptions = [
    { value: 'all', label: '全部分类' },
    ...categories.map(category => ({
      value: category.id,
      label: category.name
    }))
  ];

  // 转换标签数据为选项格式
  const tagOptions = [
    { value: 'all', label: '全部标签' },
    ...tags.map(tag => ({
      value: tag.name,
      label: tag.name
    }))
  ];

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedTags([]);
    setMinRating(0);
    setSearchQuery('');
  };

  // 批量共享提示词
  const handleBatchShare = async () => {
    if (selectedPrompts.length === 0) {
      toast.error("请先选择要共享的提示词");
      return;
    }
    setShowShareDialog(true);
  };

  // 确认共享
  const confirmShare = async () => {
    if (!shareDescription.trim()) {
      toast.error("请填写共享描述");
      return;
    }

    setIsSharing(true);
    try {
      const response = await fetch('/api/prompts/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          promptIds: selectedPrompts,
          shareDescription: shareDescription.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`成功共享 ${data.sharedCount} 个提示词`);
        setShowShareDialog(false);
        setShareDescription("");
        onSelectionChange?.([]);
        onToggleSelectionMode?.();
        // 刷新列表
        const { fetchPrompts } = useAppStore.getState();
        fetchPrompts();
      } else {
        const error = await response.json();
        toast.error(error.error || "共享失败");
      }
    } catch (error) {
      console.error("共享失败:", error);
      toast.error("共享失败");
    } finally {
      setIsSharing(false);
    }
  };

  // 取消选择模式
  const handleCancelSelection = () => {
    onSelectionChange?.([]);
    onToggleSelectionMode?.();
  };

  return (
    <div className="space-y-4">
      {/* 顶部工具栏 */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          {/* 搜索框 */}
          <div className="w-full md:w-96 order-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索提示词..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 md:ml-auto order-2">
            {/* 视图切换按钮组 */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 border border-gray-200 dark:border-gray-600 shadow-sm">
              {viewModeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleViewModeChange(option.value)}
                  className={`
                    px-3 py-2 text-sm rounded-md transition-all duration-200 flex items-center justify-center min-w-[80px]
                    ${currentView === option.value
                      ? 'bg-primary-600 text-white font-medium shadow-sm'
                      : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-600 dark:hover:text-white'
                    }
                  `}
                  title={option.label}
                >
                  <span className="mr-1.5 text-lg">{getViewIcon(option.value)}</span>
                  {option.label.replace('视图', '')}
                </button>
              ))}
            </div>

            {/* 批量操作按钮 */}
            {isSelectionMode ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  已选择 {selectedPrompts.length} 项
                </span>
                <button
                  onClick={handleBatchShare}
                  disabled={selectedPrompts.length === 0}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm px-4 py-2.5 rounded-lg inline-flex items-center whitespace-nowrap transition-all duration-200"
                >
                  <ShareIcon className="h-4 w-4 mr-2" />
                  共享选中
                </button>
                <button
                  onClick={handleCancelSelection}
                  className="bg-gray-500 hover:bg-gray-600 text-white text-sm px-4 py-2.5 rounded-lg inline-flex items-center whitespace-nowrap transition-all duration-200"
                >
                  <XMarkIcon className="h-4 w-4 mr-2" />
                  取消选择
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onToggleSelectionMode}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2.5 rounded-lg inline-flex items-center whitespace-nowrap transition-all duration-200"
                >
                  <CheckIcon className="h-4 w-4 mr-2" />
                  批量选择
                </button>
                <button
                  onClick={handleCreatePrompt}
                  className="bg-primary-600 hover:bg-primary-700 text-white text-sm px-4 py-2.5 rounded-lg inline-flex items-center whitespace-nowrap transition-all duration-200 hover:-translate-y-0.5 shadow-sm hover:shadow-md"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  新建提示词
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 过滤器 */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-3">
          <h3 className="text-base font-medium text-gray-800 dark:text-gray-200">高级筛选</h3>
          <button
            onClick={clearAllFilters}
            className="ml-auto flex items-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          >
            <XMarkIcon className="h-4 w-4 mr-1" />
            重置过滤器
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 分类过滤 */}
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              分类
            </label>
            <select
              value={selectedCategories.length > 0 ? selectedCategories[0] : 'all'}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedCategories(value === 'all' ? [] : [value]);
              }}
              className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* 标签过滤 */}
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              标签
            </label>
            <select
              value={selectedTags.length > 0 ? selectedTags[0] : 'all'}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedTags(value === 'all' ? [] : [value]);
              }}
              className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
            >
              {tagOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* 评分过滤 */}
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              最低评分
            </label>
            <select 
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
            >
              <option value={0}>全部评分</option>
              <option value={3}>3星及以上</option>
              <option value={4}>4星及以上</option>
              <option value={5}>仅5星</option>
            </select>
          </div>
        </div>
      </div>

      {/* 共享对话框 */}
      {showShareDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              共享提示词到广场
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              将选中的 {selectedPrompts.length} 个提示词共享到提示词广场，让更多用户受益。
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                共享描述 *
              </label>
              <textarea
                value={shareDescription}
                onChange={(e) => setShareDescription(e.target.value)}
                placeholder="请简要描述这些提示词的用途和特点..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-primary-500 focus:border-primary-500"
                maxLength={200}
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {shareDescription.length}/200
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowShareDialog(false)}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmShare}
                disabled={isSharing || !shareDescription.trim()}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-md transition-colors flex items-center justify-center"
              >
                {isSharing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    共享中...
                  </>
                ) : (
                  "确认共享"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 