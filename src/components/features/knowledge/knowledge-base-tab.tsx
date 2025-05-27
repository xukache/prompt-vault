"use client";

import React, { useState, useEffect } from 'react';
import { KnowledgeBase } from '@/types';
import { CreateKnowledgeModal } from './create-knowledge-modal';
import { EditKnowledgeModal } from './edit-knowledge-modal';
import { ImportKnowledgeModal } from './import-knowledge-modal';

export const KnowledgeBaseTab: React.FC = () => {
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('updated_at');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeBase | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [tagFilter, setTagFilter] = useState('all');
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  const typeOptions = [
    { value: 'all', label: '所有类型' },
    { value: 'domain', label: '领域知识' },
    { value: 'template', label: '格式模板' },
    { value: 'practice', label: '最佳实践' },
    { value: 'reference', label: '参考资料' }
  ];

  const sortOptions = [
    { value: 'updated_at', label: '最近更新' },
    { value: 'title', label: '名称' },
    { value: 'usage_count', label: '使用频率' }
  ];

  // 获取知识库条目
  const fetchKnowledgeItems = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search: searchQuery,
        type: typeFilter,
        tag: tagFilter,
        sortBy,
        page: currentPage.toString(),
        limit: '10'
      });

      const response = await fetch(`/api/knowledge?${params}`);
      if (!response.ok) throw new Error('获取知识库条目失败');

      const data = await response.json();
      setKnowledgeItems(data.items);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error('获取知识库条目失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取所有可用标签
  const fetchAvailableTags = async () => {
    try {
      const response = await fetch('/api/knowledge/tags');
      if (response.ok) {
        const tags = await response.json();
        setAvailableTags(tags);
      }
    } catch (error) {
      console.error('获取标签失败:', error);
    }
  };

  // 删除知识库条目
  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个知识库条目吗？')) return;

    try {
      const response = await fetch(`/api/knowledge/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('删除失败');

      await fetchKnowledgeItems();
    } catch (error) {
      console.error('删除知识库条目失败:', error);
      alert('删除失败，请重试');
    }
  };

  // 编辑知识库条目
  const handleEdit = (item: KnowledgeBase) => {
    setEditingItem(item);
    setShowEditModal(true);
  };

  // 编辑成功回调
  const handleEditSuccess = () => {
    setShowEditModal(false);
    setEditingItem(null);
    fetchKnowledgeItems();
  };

  // 在提示词中使用知识库条目
  const handleUseInPrompt = (item: KnowledgeBase) => {
    // 将知识库条目信息存储到sessionStorage，供编辑器使用
    sessionStorage.setItem('selectedKnowledge', JSON.stringify(item));
    
    // 跳转到提示词编辑器
    window.location.href = '/editor?insertKnowledge=true';
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

  useEffect(() => {
    fetchKnowledgeItems();
    fetchAvailableTags();
  }, [searchQuery, typeFilter, sortBy, currentPage, tagFilter]);

  return (
    <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-dark-700 p-6">
      {/* 头部 */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">我的知识库</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-dark-600 transition-colors"
          >
            导入
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors"
          >
            添加条目
          </button>
        </div>
      </div>

      <p className="text-gray-600 dark:text-gray-400 mb-6">
        知识库用于存储和管理可在提示词中复用的信息片段，如领域知识、格式模板、最佳实践等。
      </p>

      {/* 搜索和过滤 */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
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

        <div className="flex space-x-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">所有标签</option>
            {availableTags.map((tag) => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 知识库列表 */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          {knowledgeItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {searchQuery || typeFilter !== 'all' ? '没有找到符合条件的知识库条目' : '暂无知识库条目'}
            </div>
          ) : (
            knowledgeItems.map((item, index) => (
              <div key={item.id} className={`p-4 ${index !== knowledgeItems.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''} hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white mr-2">
                        {item.title}
                      </h3>
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
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-4">
                        <span>使用次数: {item.usage_count}</span>
                        <span>最后更新: {new Date(item.updated_at).toLocaleDateString()}</span>
                      </div>
                      <button className="text-xs text-primary-600 dark:text-primary-400 hover:underline" onClick={() => handleUseInPrompt(item)}>
                        在提示词中使用
                      </button>
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button 
                      onClick={() => handleEdit(item)}
                      className="text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            显示 {(currentPage - 1) * 10 + 1}-{Math.min(currentPage * 10, knowledgeItems.length)} 
            共 {knowledgeItems.length} 个条目
          </span>
          <div className="flex space-x-1">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一页
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 border rounded-md ${
                    currentPage === page
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一页
            </button>
          </div>
        </div>
      )}

      {/* 创建知识库条目模态框 */}
      {showCreateModal && (
        <CreateKnowledgeModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchKnowledgeItems();
          }}
        />
      )}

      {/* 编辑知识库条目模态框 */}
      {showEditModal && editingItem && (
        <EditKnowledgeModal
          knowledgeItem={editingItem}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* 导入知识库条目模态框 */}
      {showImportModal && (
        <ImportKnowledgeModal
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            setShowImportModal(false);
            fetchKnowledgeItems();
            fetchAvailableTags();
          }}
        />
      )}
    </div>
  );
}; 