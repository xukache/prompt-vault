"use client";

import React, { useState, useEffect } from 'react';
import { KnowledgeBase } from '@/types';

interface KnowledgeSelectorProps {
  onSelect: (knowledge: KnowledgeBase) => void;
  onClose: () => void;
}

export const KnowledgeSelector: React.FC<KnowledgeSelectorProps> = ({
  onSelect,
  onClose
}) => {
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const typeOptions = [
    { value: 'all', label: '所有类型' },
    { value: 'domain', label: '领域知识' },
    { value: 'template', label: '格式模板' },
    { value: 'practice', label: '最佳实践' },
    { value: 'reference', label: '参考资料' }
  ];

  // 获取知识库条目
  const fetchKnowledgeItems = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search: searchQuery,
        type: typeFilter,
        sortBy: 'updated_at',
        page: '1',
        limit: '20'
      });

      const response = await fetch(`/api/knowledge?${params}`);
      if (!response.ok) throw new Error('获取知识库条目失败');

      const data = await response.json();
      setKnowledgeItems(data.items);
    } catch (error) {
      console.error('获取知识库条目失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取类型标签样式
  const getTypeTagClass = (type: string) => {
    const baseClass = "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium";
    switch (type) {
      case 'domain':
        return `${baseClass} bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300`;
      case 'template':
        return `${baseClass} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300`;
      case 'practice':
        return `${baseClass} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300`;
      case 'reference':
        return `${baseClass} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300`;
      default:
        return `${baseClass} bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300`;
    }
  };

  // 获取类型中文名
  const getTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      domain: '领域知识',
      template: '格式模板',
      practice: '最佳实践',
      reference: '参考资料'
    };
    return typeMap[type] || type;
  };

  // 处理选择知识库条目
  const handleSelect = async (item: KnowledgeBase) => {
    try {
      // 记录知识库条目的使用
      await fetch(`/api/knowledge/${item.id}/use`, {
        method: 'POST'
      });
      
      onSelect(item);
    } catch (error) {
      console.error('记录知识库使用失败:', error);
      // 即使记录失败，也继续选择操作
      onSelect(item);
    }
  };

  useEffect(() => {
    fetchKnowledgeItems();
  }, [searchQuery, typeFilter]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            选择知识库条目
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 搜索和筛选 */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="搜索知识库..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 知识库列表 */}
        <div className="p-6 overflow-y-auto max-h-96">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {knowledgeItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {searchQuery || typeFilter !== 'all' ? '没有找到符合条件的知识库条目' : '暂无知识库条目'}
                </div>
              ) : (
                knowledgeItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 cursor-pointer transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white mr-2">
                            {item.title}
                          </h4>
                          <span className={getTypeTagClass(item.type)}>
                            {getTypeLabel(item.type)}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                            {item.description}
                          </p>
                        )}
                        {/* 标签展示 */}
                        {item.tags && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {item.tags.split(',').map((tag, tagIndex) => (
                              <span
                                key={`tag-${item.id}-${tagIndex}`}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                              >
                                {tag.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          使用次数: {item.usage_count} | 最后更新: {new Date(item.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="ml-4">
                        <button className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">
                          选择
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* 底部 */}
        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-dark-600 transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}; 