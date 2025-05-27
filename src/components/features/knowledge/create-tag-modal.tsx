"use client";

import React, { useState } from 'react';
import { Tag } from '@/types';

interface CreateTagModalProps {
  onClose: () => void;
  onSuccess: (tag: Tag) => void;
}

export const CreateTagModal: React.FC<CreateTagModalProps> = ({
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: 'blue'
  });
  const [loading, setLoading] = useState(false);

  const colorOptions = [
    { value: 'blue', label: '蓝色', bgClass: 'bg-blue-500' },
    { value: 'green', label: '绿色', bgClass: 'bg-green-500' },
    { value: 'yellow', label: '黄色', bgClass: 'bg-yellow-500' },
    { value: 'red', label: '红色', bgClass: 'bg-red-500' },
    { value: 'purple', label: '紫色', bgClass: 'bg-purple-500' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('请填写标签名称');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('创建失败');
      }

      const newTag = await response.json();
      onSuccess(newTag);
    } catch (error) {
      console.error('创建标签失败:', error);
      alert('创建失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* 头部 */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              添加新标签
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 表单内容 */}
          <div className="p-6 space-y-4">
            {/* 标签名称 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                标签名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="输入标签名称"
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            {/* 描述 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                描述
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="简短描述此标签..."
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
            </div>

            {/* 颜色选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                颜色
              </label>
              <div className="flex space-x-3">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                    className={`w-8 h-8 rounded-full ${color.bgClass} border-2 transition-all ${
                      formData.color === color.value
                        ? 'border-gray-900 dark:border-gray-100 scale-110'
                        : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                    }`}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* 底部按钮 */}
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-dark-600 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              {loading ? '创建中...' : '创建标签'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 