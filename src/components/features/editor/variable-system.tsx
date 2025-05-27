"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Edit3, Check, X } from "lucide-react";

interface Variable {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'textarea';
  defaultValue: string;
  description: string;
  options?: string[];
}

interface VariableSystemProps {
  variables: Variable[];
  onChange: (variables: Variable[]) => void;
  content: string;
}

export function VariableSystem({ variables, onChange, content }: VariableSystemProps) {
  const [editingVariable, setEditingVariable] = useState<string | null>(null);
  const [newVariable, setNewVariable] = useState<Partial<Variable>>({
    name: '',
    type: 'text',
    defaultValue: '',
    description: '',
    options: []
  });
  const [isAddingVariable, setIsAddingVariable] = useState(false);

  // 从内容中自动检测变量
  const detectedVariables = useMemo(() => {
    const regex = /\{\{\s*([^}]+)\s*\}\}/g;
    const matches = new Set<string>();
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      matches.add(match[1].trim());
    }
    
    return Array.from(matches);
  }, [content]);

  // 未定义的变量（在内容中使用但未在变量列表中定义）
  const undefinedVariables = useMemo(() => {
    const definedNames = variables.map(v => v.name);
    return detectedVariables.filter(name => !definedNames.includes(name));
  }, [detectedVariables, variables]);

  const handleAddVariable = () => {
    if (!newVariable.name?.trim()) {
      alert('请输入变量名');
      return;
    }

    if (variables.some(v => v.name === newVariable.name)) {
      alert('变量名已存在');
      return;
    }

    const variable: Variable = {
      id: Date.now().toString(),
      name: newVariable.name.trim(),
      type: newVariable.type || 'text',
      defaultValue: newVariable.defaultValue || '',
      description: newVariable.description || '',
      options: newVariable.type === 'select' ? newVariable.options : undefined
    };

    onChange([...variables, variable]);
    setNewVariable({
      name: '',
      type: 'text',
      defaultValue: '',
      description: '',
      options: []
    });
    setIsAddingVariable(false);
  };

  const handleUpdateVariable = (id: string, updates: Partial<Variable>) => {
    const updatedVariables = variables.map(v => 
      v.id === id ? { ...v, ...updates } : v
    );
    onChange(updatedVariables);
    setEditingVariable(null);
  };

  const handleDeleteVariable = (id: string) => {
    if (confirm('确定要删除这个变量吗？')) {
      onChange(variables.filter(v => v.id !== id));
    }
  };

  const handleQuickAddVariable = (name: string) => {
    const variable: Variable = {
      id: Date.now().toString(),
      name,
      type: 'text',
      defaultValue: '',
      description: '',
    };
    onChange([...variables, variable]);
  };

  const VariableForm = ({ 
    variable, 
    onSave, 
    onCancel 
  }: { 
    variable: Partial<Variable>; 
    onSave: (variable: Partial<Variable>) => void; 
    onCancel: () => void; 
  }) => {
    const [formData, setFormData] = useState(variable);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.name?.trim()) {
        alert('请输入变量名');
        return;
      }
      onSave(formData);
    };

    const handleOptionsChange = (value: string) => {
      const options = value.split('\n').filter(opt => opt.trim());
      setFormData(prev => ({ ...prev, options }));
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">变量名 *</label>
            <Input
              value={formData.name || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="例如: 用户名"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">类型</label>
            <select
              value={formData.type || 'text'}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as Variable['type'] }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="text">文本</option>
              <option value="number">数字</option>
              <option value="textarea">多行文本</option>
              <option value="select">选择项</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">默认值</label>
          <Input
            value={formData.defaultValue || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, defaultValue: e.target.value }))}
            placeholder="输入默认值"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">描述</label>
          <Input
            value={formData.description || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="简要描述这个变量的用途"
          />
        </div>

        {formData.type === 'select' && (
          <div className="space-y-2">
            <label className="text-sm font-medium">选择项（每行一个）</label>
            <Textarea
              value={formData.options?.join('\n') || ''}
              onChange={(e) => handleOptionsChange(e.target.value)}
              placeholder="选项1&#10;选项2&#10;选项3"
              rows={4}
            />
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            取消
          </Button>
          <Button type="submit">
            保存
          </Button>
        </div>
      </form>
    );
  };

  return (
    <div className="space-y-6">
      {/* 自动检测的变量 */}
      {undefinedVariables.length > 0 && (
        <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950">
          <CardHeader>
            <CardTitle className="text-orange-800 dark:text-orange-200 flex items-center">
              <Edit3 className="w-5 h-5 mr-2" />
              检测到未定义的变量
            </CardTitle>
            <p className="text-sm text-orange-700 dark:text-orange-300">
              在内容中发现了以下变量，但尚未定义。点击快速添加。
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {undefinedVariables.map((name) => (
                <Badge
                  key={name}
                  variant="outline"
                  className="cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900 border-orange-300 dark:border-orange-700"
                  onClick={() => handleQuickAddVariable(name)}
                >
                  {name} <Plus className="w-3 h-3 ml-1" />
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 已定义的变量列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>变量定义</CardTitle>
            <Button
              onClick={() => setIsAddingVariable(true)}
              size="sm"
              className="bg-primary-600 hover:bg-primary-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              添加变量
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            定义和管理提示词中使用的变量
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 添加新变量表单 */}
          {isAddingVariable && (
            <VariableForm
              variable={newVariable}
              onSave={handleAddVariable}
              onCancel={() => {
                setIsAddingVariable(false);
                setNewVariable({
                  name: '',
                  type: 'text',
                  defaultValue: '',
                  description: '',
                  options: []
                });
              }}
            />
          )}

          {/* 变量列表 */}
          {variables.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Edit3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>还没有定义任何变量</p>
              <p className="text-sm">在内容中使用 {{变量名}} 格式，或点击上方按钮添加变量</p>
            </div>
          ) : (
            <div className="space-y-3">
              {variables.map((variable) => (
                <div
                  key={variable.id}
                  className="p-4 border rounded-lg bg-white dark:bg-gray-800"
                >
                  {editingVariable === variable.id ? (
                    <VariableForm
                      variable={variable}
                      onSave={(updates) => handleUpdateVariable(variable.id, updates)}
                      onCancel={() => setEditingVariable(null)}
                    />
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline" className="font-mono">
                            {`{{${variable.name}}}`}
                          </Badge>
                          <Badge variant="secondary">
                            {variable.type === 'text' && '文本'}
                            {variable.type === 'number' && '数字'}
                            {variable.type === 'textarea' && '多行文本'}
                            {variable.type === 'select' && '选择项'}
                          </Badge>
                        </div>
                        <div className="mt-2 space-y-1">
                          {variable.description && (
                            <p className="text-sm text-muted-foreground">
                              {variable.description}
                            </p>
                          )}
                          {variable.defaultValue && (
                            <p className="text-sm">
                              <span className="font-medium">默认值:</span> {variable.defaultValue}
                            </p>
                          )}
                          {variable.options && variable.options.length > 0 && (
                            <p className="text-sm">
                              <span className="font-medium">选项:</span> {variable.options.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingVariable(variable.id)}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteVariable(variable.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 使用说明 */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">变量系统使用说明</p>
              <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                <li>• 在内容中使用 <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">{{变量名}}</code> 格式引用变量</li>
                <li>• 系统会自动检测内容中的变量并提示定义</li>
                <li>• 支持文本、数字、多行文本和选择项四种类型</li>
                <li>• 可以设置默认值和描述，方便使用时理解</li>
                <li>• 在内容编辑选项卡中可以实时预览变量替换效果</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 