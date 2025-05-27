"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// 动态导入MDEditor以避免SSR问题
const MDEditor = dynamic(
  () => import("@uiw/react-md-editor").then((mod) => mod.default),
  { ssr: false }
);

interface Variable {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'textarea';
  defaultValue: string;
  description: string;
  options?: string[];
}

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  variables?: Variable[];
}

export function MarkdownEditor({ value, onChange, variables = [] }: MarkdownEditorProps) {
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview' | 'live'>('live');
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});

  // 初始化变量值
  useEffect(() => {
    const initialValues: Record<string, string> = {};
    variables.forEach(variable => {
      initialValues[variable.name] = variable.defaultValue;
    });
    setVariableValues(initialValues);
  }, [variables]);

  // 替换变量的预览内容
  const previewContent = useMemo(() => {
    let content = value;

    // 替换所有变量 {{variableName}} 为实际值
    Object.entries(variableValues).forEach(([name, val]) => {
      const regex = new RegExp(`\\{\\{\\s*${name}\\s*\\}\\}`, 'g');
      content = content.replace(regex, val || `{{${name}}}`);
    });

    return content;
  }, [value, variableValues]);

  const handleVariableValueChange = (variableName: string, newValue: string) => {
    setVariableValues(prev => ({
      ...prev,
      [variableName]: newValue
    }));
  };

  const insertVariable = (variableName: string) => {
    const variableTag = `{{${variableName}}}`;
    const newValue = value + variableTag;
    onChange(newValue);
  };

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">编辑模式:</span>
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setPreviewMode('edit')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                previewMode === 'edit'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              编辑
            </button>
            <button
              onClick={() => setPreviewMode('live')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                previewMode === 'live'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              实时预览
            </button>
            <button
              onClick={() => setPreviewMode('preview')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                previewMode === 'preview'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              预览
            </button>
          </div>
        </div>

        {/* 变量快速插入 */}
        {variables.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">插入变量:</span>
            <div className="flex flex-wrap gap-1">
              {variables.map((variable) => (
                <Badge
                  key={variable.id}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-900"
                  onClick={() => insertVariable(variable.name)}
                >
                  {variable.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Markdown编辑器 */}
      <div className="border rounded-lg overflow-hidden">
        <MDEditor
          value={value}
          onChange={(val) => onChange(val || '')}
          preview={previewMode}
          hideToolbar={false}
          visibleDragbar={false}
          textareaProps={{
            placeholder: '在这里输入您的提示词内容...\n\n您可以使用Markdown格式，并通过 {{变量名}} 的方式插入变量。\n\n例如：\n# {{标题}}\n\n您好，{{用户名}}！\n\n这是一个关于 {{主题}} 的提示词。',
            style: {
              fontSize: 14,
              lineHeight: 1.6,
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
            },
          }}
          height={400}
          data-color-mode="light"
        />
      </div>

      {/* 变量预览区域 */}
      {variables.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">变量预览</CardTitle>
            <p className="text-sm text-muted-foreground">
              调整变量值以查看实时预览效果
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 变量值输入 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {variables.map((variable) => (
                <div key={variable.id} className="space-y-2">
                  <label className="text-sm font-medium">
                    {variable.name}
                    {variable.description && (
                      <span className="text-muted-foreground ml-1">
                        ({variable.description})
                      </span>
                    )}
                  </label>

                  {variable.type === 'select' && variable.options ? (
                    <select
                      value={variableValues[variable.name] || ''}
                      onChange={(e) => handleVariableValueChange(variable.name, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="">选择...</option>
                      {variable.options.map((option, index) => (
                        <option key={`${variable.id}-option-${index}`} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : variable.type === 'textarea' ? (
                    <textarea
                      value={variableValues[variable.name] || ''}
                      onChange={(e) => handleVariableValueChange(variable.name, e.target.value)}
                      placeholder={variable.defaultValue}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  ) : (
                    <input
                      type={variable.type === 'number' ? 'number' : 'text'}
                      value={variableValues[variable.name] || ''}
                      onChange={(e) => handleVariableValueChange(variable.name, e.target.value)}
                      placeholder={variable.defaultValue}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  )}
                </div>
              ))}
            </div>

            {/* 预览结果 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">预览结果</label>
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                <div
                  className="prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: previewContent.replace(/\n/g, '<br>')
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 编辑提示 */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">编辑提示</p>
              <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                <li>• 使用 <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">{'{{变量名}}'}</code> 格式插入变量</li>
                <li>• 支持完整的Markdown语法，包括标题、列表、代码块等</li>
                <li>• 可以在变量系统选项卡中定义和管理变量</li>
                <li>• 实时预览会显示变量替换后的效果</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}