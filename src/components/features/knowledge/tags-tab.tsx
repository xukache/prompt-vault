"use client";

import React, { useState, useEffect } from 'react';
import { Tag, Prompt } from '@/types';
import { CreateTagModal } from './create-tag-modal';

interface TagItemProps {
  tag: Tag;
  selectedTag: Tag | null;
  onSelect: (tag: Tag) => void;
}

const TagItem: React.FC<TagItemProps> = ({ tag, selectedTag, onSelect }) => {
  const isSelected = selectedTag?.id === tag.id;

  return (
    <div
      className={`flex items-center justify-between py-2 px-3 rounded-md cursor-pointer transition-colors ${
        isSelected 
          ? 'bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500' 
          : 'hover:bg-gray-50 dark:hover:bg-dark-700'
      }`}
      onClick={() => onSelect(tag)}
    >
      <span className={`${isSelected ? 'font-medium text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'}`}>
        {tag.name}
      </span>
      <span className="text-xs text-gray-500 dark:text-gray-400">{tag.usage_count}</span>
    </div>
  );
};

export const TagsTab: React.FC = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [tagPrompts, setTagPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'name'>('popular');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // 获取标签数据
  const fetchTags = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tags');
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

  // 获取包含标签的提示词
  const fetchTagPrompts = async (tagName: string) => {
    try {
      const response = await fetch(`/api/prompts?tag=${encodeURIComponent(tagName)}`);
      if (!response.ok) {
        throw new Error('获取提示词失败');
      }
      const data = await response.json();
      
      // 根据排序方式排序
      const sortedPrompts = [...data].sort((a, b) => {
        switch (sortBy) {
          case 'popular':
            return (b.rating || 0) - (a.rating || 0);
          case 'recent':
            return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
          case 'name':
            return a.title.localeCompare(b.title);
          default:
            return 0;
        }
      });
      
      setTagPrompts(sortedPrompts);
    } catch (error) {
      console.error('获取标签提示词失败:', error);
      setTagPrompts([]);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    if (selectedTag) {
      fetchTagPrompts(selectedTag.name);
    }
  }, [selectedTag, sortBy]);

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tag.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveTag = async () => {
    if (!selectedTag) return;
    
    try {
      setSaving(true);
      const response = await fetch(`/api/tags/${selectedTag.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: selectedTag.name,
          description: selectedTag.description,
          color: selectedTag.color
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '保存失败');
      }

      const updatedTag = await response.json();
      
      // 更新本地状态
      await fetchTags();
      setSelectedTag(updatedTag);
      
      alert('标签保存成功！');
    } catch (error) {
      console.error('保存标签失败:', error);
      alert(error instanceof Error ? error.message : '保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTag = async () => {
    if (!selectedTag) return;
    
    if (!confirm('确定要删除这个标签吗？此操作不可撤销。')) {
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/tags/${selectedTag.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '删除失败');
      }

      // 重新获取标签列表
      await fetchTags();
      setSelectedTag(null);
      
      alert('标签删除成功！');
    } catch (error) {
      console.error('删除标签失败:', error);
      alert(error instanceof Error ? error.message : '删除失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSuccess = async () => {
    // 重新获取标签列表
    await fetchTags();
    setShowCreateModal(false);
    alert('标签创建成功！');
  };

  const getColorOptions = () => [
    { name: 'blue', bg: 'bg-blue-500' },
    { name: 'green', bg: 'bg-green-500' },
    { name: 'yellow', bg: 'bg-yellow-500' },
    { name: 'red', bg: 'bg-red-500' },
    { name: 'purple', bg: 'bg-purple-500' }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧标签列表 */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-dark-700 p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold dark:text-white">提示词标签管理</h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-2 py-1 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded transition-colors"
              >
                <i className="bi bi-plus-lg mr-1"></i>新建标签
              </button>
            </div>

            <div className="relative mb-4">
              <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="搜索标签..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* 标签列表 */}
            <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
              {filteredTags.length === 0 ? (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  {searchQuery ? '没有找到匹配的标签' : '暂无标签'}
                </div>
              ) : (
                filteredTags.map((tag) => (
                  <TagItem
                    key={tag.id}
                    tag={tag}
                    selectedTag={selectedTag}
                    onSelect={setSelectedTag}
                  />
                ))
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                提示: 点击标签查看详情，数字表示使用次数
              </p>
            </div>
          </div>
        </div>

        {/* 右侧标签详情和编辑区域 */}
        <div className="lg:col-span-2">
          {selectedTag ? (
            <>
              {/* 标签编辑区域 */}
              <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-dark-700 p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold dark:text-white">编辑提示词标签</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSaveTag}
                      disabled={saving}
                      className="px-3 py-1 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {saving && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      )}
                      {saving ? '保存中...' : '保存'}
                    </button>
                    <button
                      onClick={handleDeleteTag}
                      disabled={saving}
                      className="px-3 py-1 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      删除
                    </button>
                  </div>
                </div>

                {/* 标签编辑表单 */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      标签名称
                    </label>
                    <input
                      type="text"
                      value={selectedTag.name}
                      onChange={(e) => setSelectedTag({...selectedTag, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      描述
                    </label>
                    <textarea
                      value={selectedTag.description || ''}
                      onChange={(e) => setSelectedTag({...selectedTag, description: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="描述这个标签的用途和适用场景..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      颜色
                    </label>
                    <div className="flex space-x-2">
                      {getColorOptions().map((color) => (
                        <button
                          key={color.name}
                          onClick={() => setSelectedTag({...selectedTag, color: color.name})}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${color.bg} ${
                            selectedTag.color === color.name
                              ? 'border-gray-900 dark:border-gray-100 scale-110'
                              : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        使用次数
                      </label>
                      <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
                        <span className="text-gray-900 dark:text-gray-100">{selectedTag.usage_count}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        创建时间
                      </label>
                      <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
                        <span className="text-gray-900 dark:text-gray-100 text-sm">
                          {new Date(selectedTag.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 包含此标签的提示词 */}
              <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-dark-700 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold dark:text-white">包含此标签的提示词</h3>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">排序:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'popular' | 'recent' | 'name')}
                      className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-700 text-gray-700 dark:text-gray-200 px-2 py-1 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="popular">最受欢迎</option>
                      <option value="recent">最近更新</option>
                      <option value="name">名称</option>
                    </select>
                  </div>
                </div>

                {tagPrompts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    暂无包含此标签的提示词
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tagPrompts.map((prompt) => (
                      <div key={prompt.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 dark:text-white">{prompt.title}</h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{prompt.description}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {prompt.tags?.map((tag, index) => (
                              <span
                                key={`${prompt.id}-tag-${index}`}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <i
                                key={i}
                                className={`bi bi-star${i < Math.floor(prompt.rating || 0) ? '-fill' : ''} text-xs ${
                                  i < Math.floor(prompt.rating || 0) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {(prompt.rating || 0).toFixed(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
    <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-dark-700 p-6">
              <div className="text-center py-8">
                <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                  <i className="bi bi-tag text-3xl text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">选择一个标签</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  从左侧选择一个提示词标签来查看和编辑其详细信息
                </p>
              </div>
            </div>
          )}
        </div>
    </div>

      {/* 创建标签模态框 */}
      {showCreateModal && (
        <CreateTagModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </>
  );
}; 