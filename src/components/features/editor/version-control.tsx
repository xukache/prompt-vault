"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { History, GitBranch, RotateCcw, Eye, Plus } from "lucide-react";
import { ClientTime } from '@/components/ui/client-time';
import { useToast } from '@/components/ui/toast';
import { PromptVersion } from '@/types';

interface VersionControlProps {
  promptId: string;
  currentContent: string;
  currentTitle: string;
  onVersionRestore?: (version: PromptVersion) => void;
  isDarkMode?: boolean;
}

const VersionControl: React.FC<VersionControlProps> = ({
  promptId,
  currentContent,
  currentTitle,
  onVersionRestore,
  isDarkMode = false
}) => {
  const { showToast } = useToast();
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newVersionTitle, setNewVersionTitle] = useState('');
  const [changeDescription, setChangeDescription] = useState('');
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [userVersions, setUserVersions] = useState<Record<string, string>>({});

  // 获取版本历史
  useEffect(() => {
    fetchVersions();
  }, [promptId]);

  const fetchVersions = async () => {
    if (!promptId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/prompts/${promptId}/versions`);
      
      if (!response.ok) {
        throw new Error('获取版本历史失败');
      }

      const data = await response.json();
      setVersions(data);
    } catch (error) {
      console.error('获取版本历史失败:', error);
      showToast({
        message: '获取版本历史失败',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // 保存新版本
  const handleSaveVersion = async () => {
    if (!newVersionTitle.trim()) {
      showToast({
        message: '请输入版本标题',
        type: 'error'
      });
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/prompts/${promptId}/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newVersionTitle.trim(),
          content: currentContent,
          change_description: changeDescription.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '保存版本失败');
      }

      const newVersion = await response.json();
      setVersions(prev => [newVersion, ...prev]);
      setNewVersionTitle('');
      setChangeDescription('');
      
      showToast({
        message: '版本保存成功',
        type: 'success'
      });
    } catch (error) {
      console.error('保存版本失败:', error);
      showToast({
        message: error instanceof Error ? error.message : '保存版本失败',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  // 恢复版本
  const handleRestoreVersion = async (version: PromptVersion) => {
    if (!confirm(`确定要恢复到版本 "${version.title}" 吗？当前未保存的更改将丢失。`)) {
      return;
    }

    try {
      onVersionRestore?.(version);
      showToast({
        message: `已恢复到版本: ${version.title}`,
        type: 'success'
      });
    } catch (error) {
      console.error('恢复版本失败:', error);
      showToast({
        message: '恢复版本失败',
        type: 'error'
      });
    }
  };

  // 删除版本
  const handleDeleteVersion = async (versionId: string) => {
    if (!confirm('确定要删除这个版本吗？此操作不可撤销。')) {
      return;
    }

    try {
      const response = await fetch(`/api/prompts/${promptId}/versions/${versionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '删除版本失败');
      }

      setVersions(prev => prev.filter(v => v.id !== versionId));
      showToast({
        message: '版本删除成功',
        type: 'success'
      });
    } catch (error) {
      console.error('删除版本失败:', error);
      showToast({
        message: error instanceof Error ? error.message : '删除版本失败',
        type: 'error'
      });
    }
  };

  // 处理版本选择（用于对比）
  const handleVersionSelect = (versionId: string) => {
    setSelectedVersions(prev => {
      if (prev.includes(versionId)) {
        return prev.filter(id => id !== versionId);
      } else if (prev.length < 2) {
        return [...prev, versionId];
      } else {
        return [prev[1], versionId]; // 替换第一个选择
      }
    });
  };

  if (!promptId) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>请先保存提示词以查看版本历史</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 版本控制工具栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold">版本历史</h3>
          <Badge variant="outline">
            共 {versions.length} 个版本
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          {selectedVersions.length === 2 && (
            <Button
              onClick={() => setShowCompare(!showCompare)}
              variant="outline"
              size="sm"
            >
              <GitBranch className="w-4 h-4 mr-2" />
              {showCompare ? '退出对比' : '对比版本'}
            </Button>
          )}
          
          <Button
            onClick={() => {
              setNewVersionTitle('');
              setChangeDescription('');
            }}
            size="sm"
            className="bg-primary-600 hover:bg-primary-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            创建版本
          </Button>
        </div>
      </div>

      {/* 创建版本表单 */}
      {showCompare && selectedVersions.length === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>版本对比</CardTitle>
            <p className="text-sm text-muted-foreground">
              对比版本 {versions.find(v => v.id === selectedVersions[0])?.title} 
              和版本 {versions.find(v => v.id === selectedVersions[1])?.title}
            </p>
          </CardHeader>
          <CardContent>
            {(() => {
              const version1 = versions.find(v => v.id === selectedVersions[0]);
              const version2 = versions.find(v => v.id === selectedVersions[1]);
              
              if (!version1 || !version2) return null;
              
              const diff = getDiff(version1.content, version2.content);
              
              return (
                <div className="space-y-4">
                  {/* 标题对比 */}
                  {version1.title !== version2.title && (
                    <div className="space-y-2">
                      <h4 className="font-medium">标题变更</h4>
                      <div className="space-y-1">
                        <div className="p-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded">
                          <span className="text-red-700 dark:text-red-300">- {version1.title}</span>
                        </div>
                        <div className="p-2 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded">
                          <span className="text-green-700 dark:text-green-300">+ {version2.title}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* 内容对比 */}
                  <div className="space-y-2">
                    <h4 className="font-medium">内容变更</h4>
                    <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900 max-h-96 overflow-y-auto">
                      {diff.map((line, index) => (
                        <div
                          key={index}
                          className={`py-1 px-2 rounded ${
                            line.type === 'added'
                              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                              : line.type === 'removed'
                              ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <span className="font-mono text-sm">
                            {line.type === 'added' && '+ '}
                            {line.type === 'removed' && '- '}
                            {line.type === 'equal' && '  '}
                            {line.content}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* 版本列表 */}
      <Card>
        <CardHeader>
          <CardTitle>版本列表</CardTitle>
          {selectedVersions.length > 0 && (
            <p className="text-sm text-muted-foreground">
              已选择 {selectedVersions.length} 个版本
              {selectedVersions.length === 2 && '，可以进行对比'}
            </p>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">加载版本历史...</p>
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>还没有版本历史</p>
              <p className="text-sm">创建第一个版本来开始版本管理</p>
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((version, index) => (
                <div
                  key={version.id}
                  className={`p-4 border rounded-lg transition-colors ${
                    selectedVersions.includes(version.id)
                      ? 'border-primary-300 bg-primary-50 dark:bg-primary-950 dark:border-primary-700'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedVersions.includes(version.id)}
                        onChange={() => handleVersionSelect(version.id)}
                        disabled={!selectedVersions.includes(version.id) && selectedVersions.length >= 2}
                        className="w-4 h-4 text-primary-600 rounded"
                      />
                      
                      <div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={index === 0 ? "default" : "outline"}>
                            v{version.version_number}
                          </Badge>
                          {index === 0 && (
                            <Badge variant="secondary">当前版本</Badge>
                          )}
                        </div>
                        <h4 className="font-medium mt-1">{version.title}</h4>
                        {version.change_description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {version.change_description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          <ClientTime date={version.created_at} />
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // TODO: 实现预览功能
                          alert('预览功能开发中');
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      {index !== 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRestoreVersion(version)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
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
              <p className="font-medium mb-1">版本控制使用说明</p>
              <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                <li>• 每次保存提示词时会自动创建版本快照</li>
                <li>• 可以手动创建版本并添加变更描述</li>
                <li>• 选择两个版本可以进行详细的差异对比</li>
                <li>• 可以恢复到任意历史版本（会创建新版本）</li>
                <li>• 版本按时间倒序排列，最新版本在顶部</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VersionControl; 