"use client";

import React, { useState, useEffect } from 'react';
import { Category, Prompt } from '@/types';
import { CreateCategoryModal } from './create-category-modal';

interface CategoryTreeItemProps {
  category: Category;
  selectedCategory: Category | null;
  onSelect: (category: Category) => void;
  onToggle: (categoryId: string) => void;
  expandedCategories: Set<string>;
  onRefresh: () => void;
}

const CategoryTreeItem: React.FC<CategoryTreeItemProps> = ({
  category,
  selectedCategory,
  onSelect,
  onToggle,
  expandedCategories,
  onRefresh
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showCreateSubModal, setShowCreateSubModal] = useState(false);
  const isExpanded = expandedCategories.has(category.id);
  const isSelected = selectedCategory?.id === category.id;
  const hasChildren = category.children && category.children.length > 0;

  const handleToggle = () => {
    if (hasChildren) {
      onToggle(category.id);
    }
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleDeleteCategory = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    
    if (!confirm(`确定要删除分类"${category.name}"吗？此操作不可撤销。`)) {
      return;
    }

    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '删除失败');
      }

      alert('分类删除成功！');
      // 通知父组件刷新数据
      onRefresh();
    } catch (error) {
      console.error('删除分类失败:', error);
      alert(error instanceof Error ? error.message : '删除失败，请重试');
    }
  };

  const handleAddSubCategory = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    setShowCreateSubModal(true);
  };

  const handleCreateSubSuccess = () => {
    setShowCreateSubModal(false);
    alert('子分类创建成功！');
    // 通知父组件刷新数据
    onRefresh();
  };

  return (
    <div className="category-branch relative">
      <div
        className={`flex items-center justify-between py-2 px-3 rounded-md cursor-pointer transition-colors ${
          isSelected 
            ? 'bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500' 
            : 'bg-gray-50 dark:bg-dark-700 hover:bg-gray-100 dark:hover:bg-dark-600'
        }`}
        onClick={() => onSelect(category)}
      >
        <div className="flex items-center">
          {hasChildren ? (
            <i
              className={`mr-2 text-gray-500 dark:text-gray-400 cursor-pointer transition-transform ${
                isExpanded ? 'bi bi-chevron-down' : 'bi bi-chevron-right'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                handleToggle();
              }}
            />
          ) : (
            <div className="w-4 mr-2" />
          )}
          <span className={`font-medium ${isSelected ? 'text-primary-700 dark:text-primary-300' : 'dark:text-white'}`}>
            {category.name}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {category.children?.length || 0}
          </span>
          <div className="relative">
            <i 
              className="bi bi-three-dots-vertical text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 p-1" 
              onClick={handleMenuClick}
            />
            
            {/* 下拉菜单 */}
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10">
                <div className="py-1">
                  <button
                    onClick={handleAddSubCategory}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  >
                    <i className="bi bi-plus mr-2"></i>
                    添加子分类
                  </button>
                  <hr className="border-gray-200 dark:border-gray-700" />
                  <button
                    onClick={handleDeleteCategory}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center"
                  >
                    <i className="bi bi-trash mr-2"></i>
                    删除分类
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {hasChildren && isExpanded && (
        <div className="ml-6 mt-1 space-y-1">
          {category.children?.map((child) => (
            <CategoryTreeItem
              key={child.id}
              category={child}
              selectedCategory={selectedCategory}
              onSelect={onSelect}
              onToggle={onToggle}
              expandedCategories={expandedCategories}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}
      
      {/* 点击外部关闭菜单 */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowMenu(false)}
        />
      )}

      {/* 创建子分类模态框 */}
      {showCreateSubModal && (
        <CreateCategoryModal
          onClose={() => setShowCreateSubModal(false)}
          onSuccess={handleCreateSubSuccess}
          parentCategories={[]}
          defaultParentId={category.id}
        />
      )}
    </div>
  );
};

export const CategoriesTab: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryPrompts, setCategoryPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);

  // 获取分类数据
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error('获取分类失败');
      }
      const data = await response.json();
      
      // 构建分类树结构
      const categoryMap = new Map();
      const rootCategories: Category[] = [];
      
      // 先创建所有分类的映射
      data.forEach((category: Category) => {
        categoryMap.set(category.id, { ...category, children: [] });
      });
      
      // 构建树结构
      data.forEach((category: Category) => {
        const categoryWithChildren = categoryMap.get(category.id);
        if (category.parent_id) {
          const parent = categoryMap.get(category.parent_id);
          if (parent) {
            parent.children.push(categoryWithChildren);
          }
        } else {
          rootCategories.push(categoryWithChildren);
        }
      });
      
      setCategories(rootCategories);
      if (rootCategories.length > 0 && !selectedCategory) {
        setSelectedCategory(rootCategories[0]);
        setExpandedCategories(new Set([rootCategories[0].id]));
      }
    } catch (error) {
      console.error('获取分类失败:', error);
      alert('获取分类失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 获取分类下的提示词
  const fetchCategoryPrompts = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/prompts?category=${categoryId}`);
      if (!response.ok) {
        throw new Error('获取提示词失败');
      }
      const data = await response.json();
      setCategoryPrompts(data);
    } catch (error) {
      console.error('获取分类提示词失败:', error);
      setCategoryPrompts([]);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchCategoryPrompts(selectedCategory.id);
    }
  }, [selectedCategory]);

  const handleToggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleSaveCategory = async () => {
    if (!selectedCategory) return;
    
    try {
      setSaving(true);
      const response = await fetch(`/api/categories/${selectedCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: selectedCategory.name,
          description: selectedCategory.description,
          parent_id: selectedCategory.parent_id,
          color: selectedCategory.color,
          icon: selectedCategory.icon,
          order_index: selectedCategory.order_index
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '保存失败');
      }

      const updatedCategory = await response.json();
      
      // 更新本地状态
      await fetchCategories();
      setSelectedCategory(updatedCategory);
      
      alert('分类保存成功！');
    } catch (error) {
      console.error('保存分类失败:', error);
      alert(error instanceof Error ? error.message : '保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;
    
    if (!confirm('确定要删除这个分类吗？此操作不可撤销。')) {
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/categories/${selectedCategory.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '删除失败');
      }

      // 重新获取分类列表
      await fetchCategories();
      setSelectedCategory(null);
      
      alert('分类删除成功！');
    } catch (error) {
      console.error('删除分类失败:', error);
      alert(error instanceof Error ? error.message : '删除失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSuccess = async () => {
    // 重新获取分类列表
    await fetchCategories();
    setShowCreateModal(false);
    alert('分类创建成功！');
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
        {/* 左侧分类树 */}
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-dark-700 p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold dark:text-white">提示词分类结构</h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-2 py-1 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded transition-colors"
              >
                <i className="bi bi-plus-lg mr-1"></i>新建分类
              </button>
            </div>

            <div className="space-y-2">
              {categories.length === 0 ? (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  暂无分类
                </div>
              ) : (
                categories.map((category) => (
                  <CategoryTreeItem
                    key={category.id}
                    category={category}
                    selectedCategory={selectedCategory}
                    onSelect={setSelectedCategory}
                    onToggle={handleToggleCategory}
                    expandedCategories={expandedCategories}
                    onRefresh={fetchCategories}
                  />
                ))
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                提示: 点击类别前的图标可展开/折叠，拖放调整顺序
              </p>
            </div>
          </div>
        </div>

        {/* 右侧分类详情和编辑区域 */}
        <div className="md:col-span-2">
          {selectedCategory ? (
            <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-dark-700 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold dark:text-white">编辑提示词分类</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={handleSaveCategory}
                    disabled={saving}
                    className="px-3 py-1 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {saving && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    )}
                    {saving ? '保存中...' : '保存'}
                  </button>
                  <button
                    onClick={handleDeleteCategory}
                    disabled={saving}
                    className="px-3 py-1 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    删除
                  </button>
                </div>
              </div>

              {/* 分类编辑表单 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    分类名称
                  </label>
                  <input
                    type="text"
                    value={selectedCategory.name}
                    onChange={(e) => setSelectedCategory({...selectedCategory, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    描述
                  </label>
                  <textarea
                    value={selectedCategory.description || ''}
                    onChange={(e) => setSelectedCategory({...selectedCategory, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="描述这个分类的用途和包含的提示词类型..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                          onClick={() => setSelectedCategory({...selectedCategory, color: color.name})}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${color.bg} ${
                            selectedCategory.color === color.name
                              ? 'border-gray-900 dark:border-gray-100 scale-110'
                              : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      图标
                    </label>
                    <div className="flex space-x-3">
                      {['pen', 'book', 'lightning', 'chat-quote', 'palette'].map((icon) => (
                        <button
                          key={icon}
                          onClick={() => setSelectedCategory({...selectedCategory, icon})}
                          className={`w-8 h-8 flex items-center justify-center border rounded-lg transition-colors ${
                            selectedCategory.icon === icon
                              ? 'border-primary-300 dark:border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-600'
                          }`}
                        >
                          <i className={`bi bi-${icon}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 分类下的提示词列表 */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                  此分类下的提示词 ({categoryPrompts.length})
                </h4>
                
                {categoryPrompts.length > 0 ? (
                  <div className="space-y-3">
                    {categoryPrompts.map((prompt) => (
                      <div key={prompt.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 dark:text-white">{prompt.title}</h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{prompt.description}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            使用 {prompt.usage_count || 0} 次
                          </span>
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
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                    此分类下暂无提示词
                  </div>
                )}
              </div>
            </div>
          ) : (
    <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-dark-700 p-6">
              <div className="text-center py-8">
                <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                  <i className="bi bi-folder text-3xl text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">选择一个分类</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  从左侧选择一个提示词分类来查看和编辑其详细信息
                </p>
              </div>
            </div>
          )}
        </div>
    </div>

      {/* 创建分类模态框 */}
      {showCreateModal && (
        <CreateCategoryModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
          parentCategories={categories}
        />
      )}
    </>
  );
}; 