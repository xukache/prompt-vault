"use client";

import React, { useState, useEffect, useMemo } from 'react';
import MarkdownPreview from '@uiw/react-markdown-preview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/stores/app-store';
import { Prompt, KnowledgeBase } from '@/types';
import { KnowledgeSelector } from '@/components/features/knowledge/knowledge-selector';
import dynamic from "next/dynamic";
import { formatDateTime } from '@/utils/date';

// 动态导入Markdown编辑器，避免SSR问题
const MDEditor = dynamic(
  () => import("@uiw/react-md-editor").then((mod) => mod.default),
  { ssr: false }
);

interface PromptEditorProps {
  initialPrompt?: Prompt | null;
  isEditMode?: boolean;
  onSave?: () => void;
  onCancel?: () => void;
}

interface PromptFormData {
  title: string;
  description: string;
  content: string;
  categoryId: string;
  tags: string[];
  version: string;
  instructions: string;
  notes: string;
  variables: Record<string, string>;
}

interface EffectRecord {
  title?: string;
  cover_image?: string;
  generated_content: string;
  result_type: 'text' | 'image' | 'html' | 'other';
  result_data?: string;
  feedback?: string;
}

export function PromptEditor({ 
  initialPrompt, 
  isEditMode = false, 
  onSave, 
  onCancel 
}: PromptEditorProps) {
  const { categories = [], addPrompt, updatePrompt, fetchCategories } = useAppStore();
  
  const [formData, setFormData] = useState<PromptFormData>({
    title: '',
    description: '',
    content: '',
    categoryId: '',
    tags: [],
    version: 'v1.0',
    instructions: '',
    notes: '',
    variables: {}
  });
  
  const [tagInput, setTagInput] = useState('');
  const [variableInput, setVariableInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showEffectUpload, setShowEffectUpload] = useState(false);
  const [showKnowledgeSelector, setShowKnowledgeSelector] = useState(false);
  const [effectRecord, setEffectRecord] = useState<EffectRecord>({
    title: '',
    cover_image: '',
    generated_content: '',
    result_type: 'text',
    result_data: '',
    feedback: ''
  });

  // 检测暗色主题
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark') || 
                     window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(isDark);
    };

    checkDarkMode();
    
    // 监听主题变化
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkDarkMode);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', checkDarkMode);
    };
  }, []);

  // 初始化数据
  useEffect(() => {
    // 获取分类数据
    fetchCategories().catch((error) => {
      console.error('Failed to fetch categories:', error);
    });

    // 检查URL参数，如果有insertKnowledge=true，打开知识库选择器
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('insertKnowledge') === 'true') {
      setShowKnowledgeSelector(true);
      
      // 清除URL参数
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }

    // 检查sessionStorage中是否有预选的知识库条目
    const selectedKnowledge = sessionStorage.getItem('selectedKnowledge');
    if (selectedKnowledge) {
      try {
        const knowledge: KnowledgeBase = JSON.parse(selectedKnowledge);
        handleKnowledgeSelect(knowledge);
        sessionStorage.removeItem('selectedKnowledge');
      } catch (error) {
        console.error('解析知识库条目失败:', error);
      }
    }
  }, [fetchCategories]);

  // 初始化表单数据
  useEffect(() => {
    if (initialPrompt) {
      // 解析变量（如果存在的话）
      let variablesText = '';
      let variablesObject = {};
      
      if (initialPrompt.variables) {
        if (typeof initialPrompt.variables === 'string') {
          // 如果是字符串，尝试解析为JSON
          try {
            variablesObject = JSON.parse(initialPrompt.variables);
            variablesText = Object.entries(variablesObject)
              .map(([key, value]) => `${key}=${value}`)
              .join('\n');
          } catch {
            // 如果解析失败，直接使用字符串
            variablesText = initialPrompt.variables;
            variablesObject = {};
          }
        } else {
          // 如果已经是对象，直接使用
          variablesObject = initialPrompt.variables;
          variablesText = Object.entries(variablesObject)
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');
        }
      }
      
      setFormData({
        title: initialPrompt.title || '',
        description: initialPrompt.description || '',
        content: initialPrompt.content || '',
        categoryId: initialPrompt.category_id || '',
        tags: Array.isArray(initialPrompt.tags) ? initialPrompt.tags : [],
        version: initialPrompt.version || 'v1.0',
        instructions: initialPrompt.instructions || '',
        notes: initialPrompt.notes || '',
        variables: variablesObject
      });
      
      setVariableInput(variablesText);
    }
  }, [initialPrompt]);

  // 计算完成进度
  const completionPercentage = useMemo(() => {
    const fields = [
      formData.title,
      formData.content,
      formData.version,
      formData.categoryId,
      formData.tags.length > 0 ? 'tags' : '',
    ];
    const completedFields = fields.filter(field => field).length;
    return Math.round((completedFields / fields.length) * 100);
  }, [formData]);

  // 解析变量输入
  const parseVariables = (input: string): Record<string, string> => {
    const variables: Record<string, string> = {};
    
    if (!input.trim()) {
      return variables;
    }
    
    // 处理多行变量（三引号语法）
    const multilineRegex = /(\w+)\s*=\s*"""([\s\S]*?)"""/g;
    
    // 先提取所有多行变量
    const processedInput = input.replace(multilineRegex, (fullMatch, name, value) => {
      variables[name.trim()] = value.trim();
      return ''; // 移除已处理的多行变量
    });
    
    // 处理剩余的单行变量
    const lines = processedInput.split('\n').filter(line => line.trim());
    
    lines.forEach(line => {
      const equalIndex = line.indexOf('=');
      if (equalIndex > 0) {
        const name = line.substring(0, equalIndex).trim();
        let value = line.substring(equalIndex + 1).trim();
        
        // 移除值两端的引号（如果存在）
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        
        if (name && value !== undefined) {
          variables[name] = value;
        }
      }
    });
    
    return variables;
  };

  // 生成预览内容（替换变量）
  const generatePreview = useMemo(() => {
    let preview = formData.content;
    const variables = parseVariables(variableInput);
    
    // 修复正则表达式，确保能正确匹配变量
    Object.entries(variables).forEach(([name, value]) => {
      // 转义特殊字符，确保变量名中的特殊字符能正确匹配
      const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`{{\\s*${escapedName}\\s*}}`, 'g');
      preview = preview.replace(regex, value);
    });
    
    return preview;
  }, [formData.content, variableInput]);

  // 提取内容中的变量
  const extractVariables = useMemo(() => {
    const variableRegex = /{{\s*([^}]+)\s*}}/g;
    const matches = formData.content.match(variableRegex);
    return matches ? [...new Set(matches.map(match => match.slice(2, -2).trim()))] : [];
  }, [formData.content]);

  const handleInputChange = (field: keyof PromptFormData, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTagAdd = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('请填写标题和内容');
      return;
    }

    // 验证版本号是必填的
    if (!formData.version.trim()) {
      alert('版本号不能为空，请设置版本号');
      return;
    }

    setIsLoading(true);
    try {
      const variables = parseVariables(variableInput);
      const promptData = {
        title: formData.title,
        content: formData.content,
        description: formData.description,
        category_id: formData.categoryId,
        tags: formData.tags,
        version: formData.version,
        instructions: formData.instructions,
        notes: formData.notes,
        variables,
        rating: initialPrompt?.rating || 0,
        is_favorite: initialPrompt?.is_favorite || false,
        changeDescription: isEditMode ? '编辑更新' : '创建提示词'
      };

      if (isEditMode && initialPrompt?.id) {
        await updatePrompt(initialPrompt.id, promptData);
      } else {
        await addPrompt(promptData);
      }

      onSave?.();
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理文件上传
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'html') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setEffectRecord(prev => ({
        ...prev,
        result_type: type,
        result_data: result
      }));
    };

    if (type === 'image') {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  };

  // 处理封面图上传
  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setEffectRecord(prev => ({
        ...prev,
        cover_image: result
      }));
    };
    reader.readAsDataURL(file);
  };

  // 上传效果记录
  const handleUploadEffect = async () => {
    // 标题是必填的
    if (!effectRecord.title?.trim()) {
      alert('请填写效果记录标题');
      return;
    }

    // 对于非图片和非HTML类型，生成内容是必填的
    if (effectRecord.result_type !== 'image' && effectRecord.result_type !== 'html' && !effectRecord.generated_content.trim()) {
      alert('请填写生成内容');
      return;
    }

    if (!initialPrompt?.id) {
      alert('请先保存提示词，然后再上传效果记录');
      return;
    }

    setIsLoading(true);
    try {
      // 调用API保存效果记录
      const response = await fetch(`/api/prompts/${initialPrompt.id}/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: effectRecord.title,
          cover_image: effectRecord.cover_image,
          generated_content: effectRecord.generated_content,
          result_type: effectRecord.result_type,
          result_data: effectRecord.result_data,
          rating: 0, // 默认评分
          feedback: effectRecord.feedback
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '上传失败');
      }

      // 重置表单
      setEffectRecord({
        title: '',
        cover_image: '',
        generated_content: '',
        result_type: 'text',
        result_data: '',
        feedback: ''
      });
      setShowEffectUpload(false);
      
      alert('效果记录上传成功！');
    } catch (error) {
      console.error('上传效果记录失败:', error);
      alert(error instanceof Error ? error.message : '上传失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理知识库选择
  const handleKnowledgeSelect = (knowledge: KnowledgeBase) => {
    // 将知识库内容插入到当前内容中
    const insertText = `\n\n## ${knowledge.title}\n\n${knowledge.content}\n\n`;
    const newContent = formData.content + insertText;
    
    handleInputChange('content', newContent);
    setShowKnowledgeSelector(false);
    
    // 记录知识库使用（如果有提示词ID的话）
    if (initialPrompt?.id) {
      fetch(`/api/knowledge/${knowledge.id}/use`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ promptId: initialPrompt.id })
      }).catch(error => {
        console.error('记录知识库使用失败:', error);
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* 页面标题和进度 */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEditMode ? '编辑提示词' : '创建新提示词'}
          </h1>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            填写进度：<span className="font-medium">{completionPercentage}%</span>
          </div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* 左侧编辑区 - 占据3/5宽度 */}
        <div className="lg:col-span-3 space-y-6">
          {/* 基本信息卡片 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <i className="bi bi-info-circle text-primary-600"></i>
                基本信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  提示词标题 *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('title', e.target.value)}
                  placeholder="例如：高效市场营销文案生成器"
                  maxLength={60}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formData.title.length}/60
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    分类
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('categoryId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">选择一个分类</option>
                    {categories && Array.isArray(categories) && categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    版本号 *
                  </label>
                  <Input
                    value={formData.version}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('version', e.target.value)}
                    placeholder="例如：v1.0, v2.1, v3.0"
                    required
                    className={`${!formData.version.trim() ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  />
                  {!formData.version.trim() && (
                    <p className="text-xs text-red-500 mt-1">版本号为必填项</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  标签
                  <span className="ml-1 text-xs text-gray-500">使用逗号分隔多个标签</span>
                </label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={tagInput}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTagInput(e.target.value)}
                    placeholder="例如：AI, 写作, 效率"
                    onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => handleKeyPress(e, handleTagAdd)}
                    className="flex-1"
                  />
                  <Button onClick={handleTagAdd} variant="outline" size="sm">
                    添加
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Badge
                      key={`edit-tag-${tag}-${index}`}
                      variant="secondary"
                      className="cursor-pointer hover:bg-red-100 hover:text-red-800 dark:hover:bg-red-900 dark:hover:text-red-200"
                      onClick={() => handleTagRemove(tag)}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 内容卡片 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <i className="bi bi-file-earmark-text text-primary-600"></i>
                提示词内容
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  提示词正文 *
                  <span className="ml-1 text-xs text-gray-500">支持Markdown格式</span>
                </label>
                <div className="flex gap-2 mb-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowKnowledgeSelector(true)}
                    className="flex items-center gap-2"
                  >
                    <i className="bi bi-database text-primary-600"></i>
                    插入知识库
                  </Button>
                </div>
                <div className="border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
                  <MDEditor
                    value={formData.content}
                    onChange={(value) => handleInputChange('content', value || '')}
                    data-color-mode={isDarkMode ? "dark" : "light"}
                    height={300}
                    preview="edit"
                  />
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  字符数：{formData.content.length}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  简短描述
                  <span className="ml-1 text-xs text-gray-500">可选，用于搜索和展示</span>
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('description', e.target.value)}
                  placeholder="简要描述这个提示词的用途和特点..."
                  rows={3}
                  maxLength={200}
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formData.description.length}/200
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 变量系统卡片 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <i className="bi bi-braces text-primary-600"></i>
                变量系统
                {extractVariables.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {extractVariables.length} 个变量
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  变量定义
                  <span className="ml-1 text-xs text-gray-500">
                    格式：变量名=默认值，支持多行变量（三引号语法）
                  </span>
                </label>
                <Textarea
                  value={variableInput}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setVariableInput(e.target.value)}
                  placeholder={`示例：
用户名=张三
产品名称=智能助手
年龄=25
邮箱=user@example.com
详细描述="""
这是一个多行变量的示例
可以包含换行和复杂内容
支持Markdown格式
"""

注意：
- 单行变量格式：变量名=值
- 多行变量格式：变量名="""多行内容"""
- 变量名不能包含空格和特殊字符
- 在内容中使用 {{变量名}} 引用变量`}
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>

              {extractVariables.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    检测到的变量：
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {extractVariables.map((variable, index) => (
                      <Badge 
                        key={`variable-${variable}-${index}`} 
                        variant="outline"
                        className="font-mono"
                      >
                        {`{{${variable}}}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* 显示已解析的变量值 */}
              {variableInput.trim() && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    已定义的变量值：
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
                    {Object.entries(parseVariables(variableInput)).length > 0 ? (
                      Object.entries(parseVariables(variableInput)).map(([name, value]) => (
                        <div key={`parsed-${name}`} className="flex items-start gap-2 text-sm">
                          <Badge variant="secondary" className="font-mono text-xs">
                            {name}
                          </Badge>
                          <span className="text-gray-600 dark:text-gray-400 flex-1 break-words">
                            {value || '(空值)'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        请按照格式输入变量定义：变量名=值
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 使用说明卡片 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <i className="bi bi-book text-primary-600"></i>
                使用说明与备注
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  使用说明
                  <span className="ml-1 text-xs text-gray-500">支持Markdown格式</span>
                </label>
                <Textarea
                  value={formData.instructions}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('instructions', e.target.value)}
                  placeholder="提供如何有效使用此提示词的说明..."
                  rows={5}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  个人备注
                  <span className="ml-1 text-xs text-gray-500">仅自己可见</span>
                </label>
                <Textarea
                  value={formData.notes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('notes', e.target.value)}
                  placeholder="记录一些个人想法或改进点..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧预览与辅助区 - 占据2/5宽度 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 实时预览卡片 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <i className="bi bi-eye text-primary-600"></i>
                实时预览
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                    {formData.title || '未命名提示词'}
                  </h3>
                  {formData.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {formData.description}
                    </p>
                  )}
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {formData.tags.map((tag, index) => (
                        <Badge key={`preview-tag-${tag}-${index}`} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    变量替换后的内容：
                  </h4>
                  <div className={`border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden ${
                    isDarkMode 
                      ? 'bg-gray-900 [&_.wmde-markdown]:text-gray-200 [&_.wmde-markdown_h1]:text-gray-100 [&_.wmde-markdown_h2]:text-gray-100 [&_.wmde-markdown_h3]:text-gray-100 [&_.wmde-markdown_code]:bg-gray-800 [&_.wmde-markdown_code]:text-gray-200 [&_.wmde-markdown_pre]:bg-gray-800 [&_.wmde-markdown_blockquote]:border-gray-600 [&_.wmde-markdown_blockquote]:text-gray-300'
                      : 'bg-white [&_.wmde-markdown]:text-gray-800'
                  }`}>
                    <MarkdownPreview 
                      source={generatePreview || '请输入提示词内容...'}
                      style={{ 
                        backgroundColor: 'transparent',
                        padding: '12px',
                        fontSize: '14px',
                        minHeight: '200px',
                        maxHeight: '400px',
                        overflow: 'auto',
                        color: isDarkMode ? '#e5e7eb' : '#374151'
                      }}
                      wrapperElement={{
                        "data-color-mode": isDarkMode ? "dark" : "light",
                        style: {
                          backgroundColor: 'transparent',
                          color: isDarkMode ? '#e5e7eb' : '#374151'
                        }
                      }}
                      data-color-mode={isDarkMode ? "dark" : "light"}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 操作按钮 */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <Button 
                  onClick={handleSave} 
                  disabled={isLoading || !formData.title.trim() || !formData.content.trim()}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      保存中...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-lg mr-2"></i>
                      {isEditMode ? '更新提示词' : '保存提示词'}
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={onCancel}
                  className="w-full"
                >
                  <i className="bi bi-x-lg mr-2"></i>
                  取消
                </Button>

                {isEditMode && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowEffectUpload(true)}
                  >
                    <i className="bi bi-upload mr-2"></i>
                    上传效果记录
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 效果记录上传弹窗 */}
      {showEffectUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                上传效果记录
              </h3>
              <button
                onClick={() => setShowEffectUpload(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <i className="bi bi-x-lg text-xl"></i>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-4">
                {/* 效果记录标题 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    效果记录标题 *
                  </label>
                  <input
                    type="text"
                    value={effectRecord.title || ''}
                    onChange={(e) => setEffectRecord(prev => ({
                      ...prev,
                      title: e.target.value
                    }))}
                    placeholder="为这个效果记录起一个标题..."
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* 结果类型选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    结果类型
                  </label>
                  <select
                    value={effectRecord.result_type}
                    onChange={(e) => setEffectRecord(prev => ({
                      ...prev,
                      result_type: e.target.value as 'text' | 'image' | 'html' | 'other'
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="text">文本/Markdown</option>
                    <option value="image">图片</option>
                    <option value="html">HTML代码</option>
                    <option value="other">其他</option>
                  </select>
                </div>

                {/* 封面图上传 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    效果记录封面图（可选）
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverImageUpload}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  />
                  {effectRecord.cover_image && (
                    <div className="mt-2">
                      <img 
                        src={effectRecord.cover_image} 
                        alt="封面预览" 
                        className="max-w-full h-32 object-cover rounded-md border border-gray-300 dark:border-gray-600"
                      />
                    </div>
                  )}
                </div>

                {/* 生成内容 - 仅在非图片和非HTML类型时显示 */}
                {effectRecord.result_type !== 'image' && effectRecord.result_type !== 'html' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      生成的内容 *
                    </label>
                    <textarea
                      value={effectRecord.generated_content}
                      onChange={(e) => setEffectRecord(prev => ({
                        ...prev,
                        generated_content: e.target.value
                      }))}
                      placeholder="粘贴AI生成的内容..."
                      rows={6}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white resize-y"
                    />
                  </div>
                )}

                {/* 文件上传 */}
                {effectRecord.result_type === 'image' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      上传图片
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'image')}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                )}

                {effectRecord.result_type === 'html' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      HTML代码或上传HTML文件
                    </label>
                    <textarea
                      value={effectRecord.result_data || ''}
                      onChange={(e) => setEffectRecord(prev => ({
                        ...prev,
                        result_data: e.target.value
                      }))}
                      placeholder="粘贴HTML代码..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white resize-y mb-2"
                    />
                    <input
                      type="file"
                      accept=".html,.htm"
                      onChange={(e) => handleFileUpload(e, 'html')}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                )}

                {/* 效果评价 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    效果评价（可选）
                  </label>
                  <textarea
                    value={effectRecord.feedback || ''}
                    onChange={(e) => setEffectRecord(prev => ({
                      ...prev,
                      feedback: e.target.value
                    }))}
                    placeholder="对这次生成效果的评价和建议..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white resize-y"
                  />
                </div>

                {/* 提交按钮 */}
                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowEffectUpload(false)}
                  >
                    取消
                  </Button>
                  <Button
                    onClick={handleUploadEffect}
                    disabled={
                      !effectRecord.title?.trim() ||
                      (effectRecord.result_type !== 'image' && 
                       effectRecord.result_type !== 'html' && 
                       !effectRecord.generated_content.trim())
                    }
                  >
                    上传记录
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 知识库选择器 */}
      {showKnowledgeSelector && (
        <KnowledgeSelector
          onSelect={handleKnowledgeSelect}
          onClose={() => setShowKnowledgeSelector(false)}
        />
      )}
    </div>
  );
} 