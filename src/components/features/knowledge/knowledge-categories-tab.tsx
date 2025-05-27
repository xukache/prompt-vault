"use client";

import React, { useState, useEffect } from 'react';
import { KnowledgeBase } from '@/types';

interface KnowledgeType {
  type: string;
  label: string;
  description: string;
  color: string;
  count: number;
  last_used: string | null;
}

interface CreateTypeModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateTypeModal: React.FC<CreateTypeModalProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    type: '',
    label: '',
    description: '',
    color: 'gray'
  });
  const [saving, setSaving] = useState(false);

  const colorOptions = [
    { name: 'purple', bg: 'bg-purple-500', label: '紫色' },
    { name: 'blue', bg: 'bg-blue-500', label: '蓝色' },
    { name: 'green', bg: 'bg-green-500', label: '绿色' },
    { name: 'yellow', bg: 'bg-yellow-500', label: '黄色' },
    { name: 'red', bg: 'bg-red-500', label: '红色' },
    { name: 'gray', bg: 'bg-gray-500', label: '灰色' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.type || !formData.label) {
      alert('请填写类型标识和名称');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/knowledge/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '创建失败');
      }

      onSuccess();
    } catch (error) {
      console.error('创建类型失败:', error);
      alert(error instanceof Error ? error.message : '创建失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold dark:text-white">添加新类型</h3>
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
              类型标识 *
            </label>
            <input
              type="text"
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="例如: custom-type"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              用于系统内部识别，建议使用英文和连字符
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              显示名称 *
            </label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({...formData, label: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="例如: 自定义类型"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="描述这个类型的用途..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              颜色
            </label>
            <div className="flex space-x-2">
              {colorOptions.map((color) => (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => setFormData({...formData, color: color.name})}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${color.bg} ${
                    formData.color === color.name
                      ? 'border-gray-900 dark:border-gray-100 scale-110'
                      : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                  }`}
                  title={color.label}
                />
              ))}
            </div>
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
              {saving ? '创建中...' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const KnowledgeCategoriesTab: React.FC = () => {
  const [types, setTypes] = useState<KnowledgeType[]>([]);
  const [selectedType, setSelectedType] = useState<KnowledgeType | null>(null);
  const [typeKnowledge, setTypeKnowledge] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingType, setEditingType] = useState<KnowledgeType | null>(null);

  // 获取类型数据
  const fetchTypes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/knowledge/categories');
      if (!response.ok) {
        throw new Error('获取类型失败');
      }
      const data = await response.json();
      setTypes(data);
      
      if (data.length > 0 && !selectedType) {
        setSelectedType(data[0]);
      }
    } catch (error) {
      console.error('获取类型失败:', error);
      alert('获取类型失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 获取类型下的知识库条目
  const fetchTypeKnowledge = async (type: string) => {
    try {
      const response = await fetch(`/api/knowledge?type=${type}&limit=100`);
      if (!response.ok) {
        throw new Error('获取知识库条目失败');
      }
      const data = await response.json();
      setTypeKnowledge(data.items || []);
    } catch (error) {
      console.error('获取类型知识库条目失败:', error);
      setTypeKnowledge([]);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  useEffect(() => {
    if (selectedType) {
      fetchTypeKnowledge(selectedType.type);
    }
  }, [selectedType]);

  const handleSaveType = async () => {
    if (!editingType) return;
    
    try {
      setSaving(true);
      const response = await fetch('/api/knowledge/categories', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldType: selectedType?.type,
          newType: editingType.type,
          label: editingType.label,
          description: editingType.description,
          color: editingType.color
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '保存失败');
      }

      await fetchTypes();
      setSelectedType(editingType);
      setEditingType(null);
      alert('类型保存成功！');
    } catch (error) {
      console.error('保存类型失败:', error);
      alert(error instanceof Error ? error.message : '保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteType = async () => {
    if (!selectedType) return;
    
    if (!confirm(`确定要删除类型"${selectedType.label}"吗？此操作不可撤销。`)) {
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/knowledge/categories?type=${encodeURIComponent(selectedType.type)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '删除失败');
      }

      await fetchTypes();
      setSelectedType(null);
      alert('类型删除成功！');
    } catch (error) {
      console.error('删除类型失败:', error);
      alert(error instanceof Error ? error.message : '删除失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSuccess = async () => {
    await fetchTypes();
    setShowCreateModal(false);
    alert('类型创建成功！');
  };

  const getColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      purple: 'bg-purple-500',
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      red: 'bg-red-500',
      gray: 'bg-gray-500'
    };
    return colorMap[color] || 'bg-gray-500';
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
        {/* 左侧类型列表 */}
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-dark-700 p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold dark:text-white">知识库分类</h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-2 py-1 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded transition-colors"
              >
                <i className="bi bi-plus-lg mr-1"></i>新建类型
              </button>
            </div>

            <div className="space-y-2">
              {types.length === 0 ? (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  暂无类型
                </div>
              ) : (
                types.map((type) => (
                  <div
                    key={type.type}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedType?.type === type.type
                        ? 'bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500'
                        : 'hover:bg-gray-50 dark:hover:bg-dark-700'
                    }`}
                    onClick={() => setSelectedType(type)}
                  >
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${getColorClass(type.color)}`}></div>
                      <div>
                        <div className={`font-medium ${
                          selectedType?.type === type.type 
                            ? 'text-primary-700 dark:text-primary-300' 
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {type.label}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {type.count} 个条目
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 右侧类型详情和编辑区域 */}
        <div className="md:col-span-2">
          {selectedType ? (
            <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-dark-700 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold dark:text-white">
                  {editingType ? '编辑类型' : '类型详情'}
                </h3>
                <div className="flex space-x-2">
                  {editingType ? (
                    <>
                      <button
                        onClick={handleSaveType}
                        disabled={saving}
                        className="px-3 py-1 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {saving && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        )}
                        {saving ? '保存中...' : '保存'}
                      </button>
                      <button
                        onClick={() => setEditingType(null)}
                        disabled={saving}
                        className="px-3 py-1 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                      >
                        取消
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setEditingType({...selectedType})}
                        className="px-3 py-1 text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded transition-colors"
                      >
                        编辑
                      </button>
                      <button
                        onClick={handleDeleteType}
                        disabled={saving || selectedType.count > 0}
                        className="px-3 py-1 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={selectedType.count > 0 ? '该类型下还有知识库条目，无法删除' : '删除类型'}
                      >
                        删除
                      </button>
                    </>
                  )}
                </div>
              </div>

              {editingType ? (
                /* 编辑模式 */
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      类型标识
                    </label>
                    <input
                      type="text"
                      value={editingType.type}
                      onChange={(e) => setEditingType({...editingType, type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      显示名称
                    </label>
                    <input
                      type="text"
                      value={editingType.label}
                      onChange={(e) => setEditingType({...editingType, label: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      描述
                    </label>
                    <textarea
                      value={editingType.description}
                      onChange={(e) => setEditingType({...editingType, description: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      颜色
                    </label>
                    <div className="flex space-x-2">
                      {[
                        { name: 'purple', bg: 'bg-purple-500' },
                        { name: 'blue', bg: 'bg-blue-500' },
                        { name: 'green', bg: 'bg-green-500' },
                        { name: 'yellow', bg: 'bg-yellow-500' },
                        { name: 'red', bg: 'bg-red-500' },
                        { name: 'gray', bg: 'bg-gray-500' }
                      ].map((color) => (
                        <button
                          key={color.name}
                          type="button"
                          onClick={() => setEditingType({...editingType, color: color.name})}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${color.bg} ${
                            editingType.color === color.name
                              ? 'border-gray-900 dark:border-gray-100 scale-110'
                              : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* 查看模式 */
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        类型标识
                      </label>
                      <div className="text-gray-900 dark:text-white font-mono bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded">
                        {selectedType.type}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        显示名称
                      </label>
                      <div className="text-gray-900 dark:text-white px-3 py-2">
                        {selectedType.label}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      描述
                    </label>
                    <div className="text-gray-900 dark:text-white px-3 py-2">
                      {selectedType.description || '暂无描述'}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        颜色
                      </label>
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full mr-2 ${getColorClass(selectedType.color)}`}></div>
                        <span className="text-gray-900 dark:text-white capitalize">{selectedType.color}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        条目数量
                      </label>
                      <div className="text-gray-900 dark:text-white">
                        {selectedType.count} 个
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        最后使用
                      </label>
                      <div className="text-gray-900 dark:text-white text-sm">
                        {selectedType.last_used 
                          ? new Date(selectedType.last_used).toLocaleDateString()
                          : '从未使用'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 该类型下的知识库条目 */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                  此类型下的知识库条目 ({typeKnowledge.length})
                </h4>
                
                {typeKnowledge.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {typeKnowledge.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center mb-1">
                            <h5 className="font-medium text-gray-900 dark:text-white mr-2">{item.title}</h5>
                            <span className={getTypeTagClass(item.type)}>
                              {selectedType.label}
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
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300"
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
                    此类型下暂无知识库条目
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-dark-700 p-6">
              <div className="text-center py-8">
                <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                  <i className="bi bi-collection text-3xl text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">选择一个类型</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  从左侧选择一个知识库类型来查看和编辑其详细信息
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 创建类型模态框 */}
      {showCreateModal && (
        <CreateTypeModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </>
  );
}; 