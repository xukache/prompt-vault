"use client";

import React, { useState, useEffect } from 'react';
import { KnowledgeBase } from '@/types';

interface KnowledgeTag {
  name: string;
  count: number;
  items: string[];
}

interface RenameTagModalProps {
  tag: KnowledgeTag;
  onClose: () => void;
  onSuccess: () => void;
}

interface MergeTagsModalProps {
  tags: KnowledgeTag[];
  onClose: () => void;
  onSuccess: () => void;
}

const RenameTagModal: React.FC<RenameTagModalProps> = ({ tag, onClose, onSuccess }) => {
  const [newName, setNewName] = useState(tag.name);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newName.trim()) {
      alert('请输入新的标签名称');
      return;
    }

    if (newName.trim() === tag.name) {
      alert('新标签名称与原标签相同');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/knowledge/tags/manage', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldTag: tag.name,
          newTag: newName.trim()
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '重命名失败');
      }

      onSuccess();
    } catch (error) {
      console.error('重命名标签失败:', error);
      alert(error instanceof Error ? error.message : '重命名失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold dark:text-white">重命名标签</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <i className="bi bi-x-lg text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              原标签名称
            </label>
            <div className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded">
              {tag.name}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              使用次数: {tag.count}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              新标签名称 *
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="输入新的标签名称"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {saving && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              {saving ? '重命名中...' : '重命名'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const MergeTagsModal: React.FC<MergeTagsModalProps> = ({ tags, onClose, onSuccess }) => {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [targetTag, setTargetTag] = useState('');
  const [saving, setSaving] = useState(false);

  const handleTagToggle = (tagName: string) => {
    setSelectedTags(prev => 
      prev.includes(tagName) 
        ? prev.filter(t => t !== tagName)
        : [...prev, tagName]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedTags.length === 0) {
      alert('请选择要合并的标签');
      return;
    }

    if (!targetTag.trim()) {
      alert('请输入目标标签名称');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/knowledge/tags/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceTags: selectedTags,
          targetTag: targetTag.trim()
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '合并失败');
      }

      onSuccess();
    } catch (error) {
      console.error('合并标签失败:', error);
      alert(error instanceof Error ? error.message : '合并失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-800 rounded-lg p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold dark:text-white">合并标签</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <i className="bi bi-x-lg text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              选择要合并的标签
            </label>
            <div className="max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3 space-y-2">
              {tags.map((tag) => (
                <label key={tag.name} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(tag.name)}
                    onChange={() => handleTagToggle(tag.name)}
                    className="mr-2 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-gray-900 dark:text-white">{tag.name}</span>
                  <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                    ({tag.count})
                  </span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              已选择 {selectedTags.length} 个标签
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              目标标签名称 *
            </label>
            <input
              type="text"
              value={targetTag}
              onChange={(e) => setTargetTag(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="输入合并后的标签名称"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              所有选中的标签将被替换为此标签
            </p>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {saving && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              {saving ? '合并中...' : '合并'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const KnowledgeTagsTab: React.FC = () => {
  const [tags, setTags] = useState<KnowledgeTag[]>([]);
  const [selectedTag, setSelectedTag] = useState<KnowledgeTag | null>(null);
  const [tagKnowledge, setTagKnowledge] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'count' | 'name'>('count');
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);

  // 获取标签数据
  const fetchTags = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/knowledge/tags/manage');
      if (!response.ok) {
        throw new Error('获取标签失败');
      }
      const data = await response.json();
      setTags(data);
      
      if (data.length > 0 && !selectedTag) {
        setSelectedTag(data[0]);
      }
    } catch (error) {
      console.error('获取标签失败:', error);
      alert('获取标签失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 获取包含标签的知识库条目
  const fetchTagKnowledge = async (tagName: string) => {
    try {
      const response = await fetch(`/api/knowledge?tag=${encodeURIComponent(tagName)}&limit=100`);
      if (!response.ok) {
        throw new Error('获取知识库条目失败');
      }
      const data = await response.json();
      setTagKnowledge(data.items || []);
    } catch (error) {
      console.error('获取标签知识库条目失败:', error);
      setTagKnowledge([]);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    if (selectedTag) {
      fetchTagKnowledge(selectedTag.name);
    }
  }, [selectedTag]);

  // 筛选和排序标签
  const filteredAndSortedTags = tags
    .filter(tag => 
      searchQuery === '' || tag.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'count') {
        return b.count - a.count;
      } else {
        return a.name.localeCompare(b.name);
      }
    });

  const handleDeleteTag = async (tag: KnowledgeTag) => {
    if (!confirm(`确定要删除标签"${tag.name}"吗？此操作将从所有知识库条目中移除该标签，不可撤销。`)) {
      return;
    }

    try {
      const response = await fetch(`/api/knowledge/tags/manage?tag=${encodeURIComponent(tag.name)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '删除失败');
      }

      await fetchTags();
      if (selectedTag?.name === tag.name) {
        setSelectedTag(null);
      }
      alert('标签删除成功！');
    } catch (error) {
      console.error('删除标签失败:', error);
      alert(error instanceof Error ? error.message : '删除失败，请重试');
    }
  };

  const handleRenameSuccess = async () => {
    await fetchTags();
    setShowRenameModal(false);
    alert('标签重命名成功！');
  };

  const handleMergeSuccess = async () => {
    await fetchTags();
    setShowMergeModal(false);
    setSelectedTag(null);
    alert('标签合并成功！');
  };

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

  const getTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      domain: '领域知识',
      template: '格式模板',
      practice: '最佳实践',
      reference: '参考资料'
    };
    return typeMap[type] || type;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 左侧标签列表 */}
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-dark-700 p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold dark:text-white">知识库标签</h2>
              <button
                onClick={() => setShowMergeModal(true)}
                disabled={tags.length < 2}
                className="px-2 py-1 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="合并标签"
              >
                <i className="bi bi-arrow-down-up mr-1"></i>合并
              </button>
            </div>

            {/* 搜索和排序 */}
            <div className="space-y-3 mb-4">
              <div className="relative">
                <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  placeholder="搜索标签..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">排序:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'count' | 'name')}
                  className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-700 text-gray-700 dark:text-gray-200 px-2 py-1 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="count">使用频率</option>
                  <option value="name">名称</option>
                </select>
              </div>
            </div>

            <div className="space-y-1 max-h-96 overflow-y-auto">
              {filteredAndSortedTags.length === 0 ? (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  {searchQuery ? '未找到匹配的标签' : '暂无标签'}
                </div>
              ) : (
                filteredAndSortedTags.map((tag) => (
                  <div
                    key={tag.name}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors group ${
                      selectedTag?.name === tag.name
                        ? 'bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500'
                        : 'hover:bg-gray-50 dark:hover:bg-dark-700'
                    }`}
                    onClick={() => setSelectedTag(tag)}
                  >
                    <div className="flex-1">
                      <div className={`font-medium ${
                        selectedTag?.name === tag.name 
                          ? 'text-primary-700 dark:text-primary-300' 
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {tag.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {tag.count} 个条目
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTag(tag);
                          setShowRenameModal(true);
                        }}
                        className="p-1 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                        title="重命名"
                      >
                        <i className="bi bi-pencil text-xs"></i>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTag(tag);
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                        title="删除"
                      >
                        <i className="bi bi-trash text-xs"></i>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                共 {tags.length} 个标签
              </p>
            </div>
          </div>
        </div>

        {/* 右侧标签详情 */}
        <div className="md:col-span-2">
          {selectedTag ? (
            <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-dark-700 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold dark:text-white">标签详情</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowRenameModal(true)}
                    className="px-3 py-1 text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded transition-colors"
                  >
                    重命名
                  </button>
                  <button
                    onClick={() => handleDeleteTag(selectedTag)}
                    className="px-3 py-1 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                  >
                    删除
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    标签名称
                  </label>
                  <div className="text-gray-900 dark:text-white font-medium text-lg">
                    {selectedTag.name}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    使用次数
                  </label>
                  <div className="text-gray-900 dark:text-white font-medium text-lg">
                    {selectedTag.count} 次
                  </div>
                </div>
              </div>

              {/* 包含该标签的知识库条目 */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                  包含此标签的知识库条目 ({tagKnowledge.length})
                </h4>
                
                {tagKnowledge.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {tagKnowledge.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center mb-1">
                            <h5 className="font-medium text-gray-900 dark:text-white mr-2">{item.title}</h5>
                            <span className={getTypeTagClass(item.type)}>
                              {getTypeLabel(item.type)}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{item.description}</p>
                          )}
                          {item.tags && (
                            <div className="flex flex-wrap gap-1">
                              {item.tags.split(',').map((tag, tagIndex) => (
                                <span
                                  key={`tag-${item.id}-${tagIndex}`}
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                    tag.trim() === selectedTag.name
                                      ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300'
                                      : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300'
                                  }`}
                                >
                                  {tag.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            使用 {item.usage_count || 0} 次
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                    暂无包含此标签的知识库条目
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-dark-700 p-6">
              <div className="text-center py-8">
                <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                  <i className="bi bi-tags text-3xl text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">选择一个标签</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  从左侧选择一个知识库标签来查看其详细信息和相关条目
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 重命名标签模态框 */}
      {showRenameModal && selectedTag && (
        <RenameTagModal
          tag={selectedTag}
          onClose={() => setShowRenameModal(false)}
          onSuccess={handleRenameSuccess}
        />
      )}

      {/* 合并标签模态框 */}
      {showMergeModal && (
        <MergeTagsModal
          tags={tags}
          onClose={() => setShowMergeModal(false)}
          onSuccess={handleMergeSuccess}
        />
      )}
    </>
  );
}; 