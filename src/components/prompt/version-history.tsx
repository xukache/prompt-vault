"use client";

import React, { useState, useEffect } from 'react';
import { PromptVersion } from '@/types';
import { useToast } from '@/components/ui/toast';
import MarkdownPreview from '@uiw/react-markdown-preview';
import { ClientTime } from '@/components/ui/client-time';

interface VersionHistoryProps {
  promptId: string;
  onVersionRevert?: (version: PromptVersion) => void;
  isDarkMode?: boolean;
}

interface VersionCompareProps {
  version1: PromptVersion & { user_version?: string };
  version2: PromptVersion & { user_version?: string };
  onClose: () => void;
  isDarkMode?: boolean;
}

// 版本对比组件
const VersionCompare: React.FC<VersionCompareProps> = ({ version1, version2, onClose, isDarkMode }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            版本对比：{version1.user_version || `v${version1.version_number}`} vs {version2.user_version || `v${version2.version_number}`}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <i className="bi bi-x-lg text-xl"></i>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 版本1 */}
            <div>
              <div className="mb-4">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">
                  版本 {version1.user_version || version1.version_number}
                </h4>
                <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                  <p>标题: {version1.title}</p>
                  <p>时间: <ClientTime date={version1.created_at} format="dateTime" /></p>
                  {version1.change_description && (
                    <p>变更: {version1.change_description}</p>
                  )}
                </div>
              </div>
              <div className={`border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden ${
                isDarkMode 
                  ? 'bg-gray-900 [&_.wmde-markdown]:text-gray-200'
                  : 'bg-white [&_.wmde-markdown]:text-gray-800'
              }`}>
                <MarkdownPreview 
                  source={version1.content}
                  style={{ 
                    backgroundColor: 'transparent',
                    padding: '16px',
                    fontSize: '14px'
                  }}
                  data-color-mode={isDarkMode ? "dark" : "light"}
                />
              </div>
            </div>

            {/* 版本2 */}
            <div>
              <div className="mb-4">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">
                  版本 {version2.user_version || version2.version_number}
                </h4>
                <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                  <p>标题: {version2.title}</p>
                  <p>时间: <ClientTime date={version2.created_at} format="dateTime" /></p>
                  {version2.change_description && (
                    <p>变更: {version2.change_description}</p>
                  )}
                </div>
              </div>
              <div className={`border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden ${
                isDarkMode 
                  ? 'bg-gray-900 [&_.wmde-markdown]:text-gray-200'
                  : 'bg-white [&_.wmde-markdown]:text-gray-800'
              }`}>
                <MarkdownPreview 
                  source={version2.content}
                  style={{ 
                    backgroundColor: 'transparent',
                    padding: '16px',
                    fontSize: '14px'
                  }}
                  data-color-mode={isDarkMode ? "dark" : "light"}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 主版本历史组件
const VersionHistory: React.FC<VersionHistoryProps> = ({ promptId, onVersionRevert, isDarkMode }) => {
  const { showToast } = useToast();
  const [versions, setVersions] = useState<(PromptVersion & { user_version?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [compareVersions, setCompareVersions] = useState<(PromptVersion & { user_version?: string })[] | null>(null);
  const [revertingVersionId, setRevertingVersionId] = useState<string | null>(null);
  const [deletingVersions, setDeletingVersions] = useState<string[]>([]);

  // 获取版本历史
  useEffect(() => {
    const fetchVersions = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/prompts/${promptId}/versions`);
        
        if (!response.ok) {
          throw new Error('获取版本历史失败');
        }

        const data = await response.json();
        setVersions(data);
      } catch (err) {
        console.error('获取版本历史失败:', err);
        setError('获取版本历史失败');
      } finally {
        setLoading(false);
      }
    };

    if (promptId) {
      fetchVersions();
    }
  }, [promptId]);

  // 处理版本选择（用于对比和删除）
  const handleVersionSelect = (versionId: string) => {
    setSelectedVersions(prev => {
      if (prev.includes(versionId)) {
        return prev.filter(id => id !== versionId);
      } else {
        return [...prev, versionId];
      }
    });
  };

  // 开始版本对比
  const handleCompareVersions = () => {
    if (selectedVersions.length === 2) {
      const version1 = versions.find(v => v.id === selectedVersions[0]);
      const version2 = versions.find(v => v.id === selectedVersions[1]);
      
      if (version1 && version2) {
        setCompareVersions([version1, version2]);
      }
    }
  };

  // 批量删除版本
  const handleDeleteVersions = async () => {
    if (selectedVersions.length === 0) {
      showToast({
        message: '请选择要删除的版本',
        type: 'error'
      });
      return;
    }

    if (!confirm(`确定要删除选中的 ${selectedVersions.length} 个版本吗？此操作不可撤销。`)) {
      return;
    }

    try {
      setDeletingVersions(selectedVersions);
      
      const response = await fetch(`/api/prompts/${promptId}/versions/batch-delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          versionIds: selectedVersions
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '删除版本失败');
      }

      const result = await response.json();
      
      showToast({
        message: result.message || '版本删除成功',
        type: 'success'
      });

      // 刷新版本历史
      const versionsResponse = await fetch(`/api/prompts/${promptId}/versions`);
      if (versionsResponse.ok) {
        const newVersions = await versionsResponse.json();
        setVersions(newVersions);
      }

      // 清除选择
      setSelectedVersions([]);

    } catch (err) {
      console.error('删除版本失败:', err);
      showToast({
        message: err instanceof Error ? err.message : '删除版本失败',
        type: 'error'
      });
    } finally {
      setDeletingVersions([]);
    }
  };

  // 版本回滚
  const handleRevertToVersion = async (version: PromptVersion & { user_version?: string }) => {
    if (!confirm(`确定要回滚到版本 ${version.user_version || version.version_number} 吗？这将删除该版本之后的所有版本，此操作不可撤销。`)) {
      return;
    }

    try {
      setRevertingVersionId(version.id);
      
      const response = await fetch(`/api/prompts/${promptId}/revert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          versionId: version.id
        }),
      });

      if (!response.ok) {
        throw new Error('版本回滚失败');
      }

      const result = await response.json();
      
      showToast({
        message: result.message || '版本回滚成功',
        type: 'success'
      });

      // 刷新版本历史
      const versionsResponse = await fetch(`/api/prompts/${promptId}/versions`);
      if (versionsResponse.ok) {
        const newVersions = await versionsResponse.json();
        setVersions(newVersions);
      }

      // 通知父组件
      if (onVersionRevert) {
        onVersionRevert(version);
      }

    } catch (err) {
      console.error('版本回滚失败:', err);
      showToast({
        message: '版本回滚失败',
        type: 'error'
      });
    } finally {
      setRevertingVersionId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <i className="bi bi-exclamation-triangle text-4xl text-red-500 mb-4"></i>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="text-center py-8">
        <i className="bi bi-clock-history text-4xl text-gray-400 mb-4"></i>
        <p className="text-gray-500 dark:text-gray-400">
          暂无版本历史记录
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
          编辑提示词时会自动创建版本历史
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* 操作栏 */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          版本历史 ({versions.length})
        </h2>
        <div className="flex space-x-3">
          {selectedVersions.length === 2 && (
            <button
              onClick={handleCompareVersions}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 border border-blue-600 dark:border-blue-400 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              <i className="bi bi-arrow-left-right mr-1.5"></i>
              对比版本
            </button>
          )}
          {selectedVersions.length > 0 && (
            <>
              <button
                onClick={handleDeleteVersions}
                disabled={deletingVersions.length > 0}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border border-red-600 dark:border-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
              >
                {deletingVersions.length > 0 ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border border-red-600 border-t-transparent mr-1.5"></div>
                    删除中...
                  </>
                ) : (
                  <>
                    <i className="bi bi-trash mr-1.5"></i>
                    删除版本 ({selectedVersions.length})
                  </>
                )}
              </button>
              <button
                onClick={() => setSelectedVersions([])}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                清除选择
              </button>
            </>
          )}
        </div>
      </div>

      {/* 版本列表 */}
      <div className="space-y-4">
        {versions.map((version, index) => (
          <div
            key={version.id}
            className={`border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-colors ${
              selectedVersions.includes(version.id)
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600'
                : 'bg-gray-50 dark:bg-gray-700/50'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <input
                    type="checkbox"
                    checked={selectedVersions.includes(version.id)}
                    onChange={() => handleVersionSelect(version.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    版本 {version.user_version || version.version_number}
                    {index === 0 && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        最新
                      </span>
                    )}
                  </h3>
                </div>
                
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <p><strong>标题:</strong> {version.title}</p>
                  <p><strong>创建时间:</strong> <ClientTime date={version.created_at} format="dateTime" /></p>
                  {version.change_description && (
                    <p><strong>变更说明:</strong> {version.change_description}</p>
                  )}
                </div>

                <div className="mt-3">
                  <details className="group">
                    <summary className="cursor-pointer text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                      查看内容
                    </summary>
                    <div className={`mt-2 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden ${
                      isDarkMode 
                        ? 'bg-gray-900 [&_.wmde-markdown]:text-gray-200'
                        : 'bg-white [&_.wmde-markdown]:text-gray-800'
                    }`}>
                      <MarkdownPreview 
                        source={version.content}
                        style={{ 
                          backgroundColor: 'transparent',
                          padding: '12px',
                          fontSize: '13px'
                        }}
                        data-color-mode={isDarkMode ? "dark" : "light"}
                      />
                    </div>
                  </details>
                </div>
              </div>

              <div className="flex space-x-2 ml-4">
                {index !== 0 && (
                  <button
                    onClick={() => handleRevertToVersion(version)}
                    disabled={revertingVersionId === version.id}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 border border-orange-600 dark:border-orange-400 rounded-md hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors disabled:opacity-50"
                  >
                    {revertingVersionId === version.id ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border border-orange-600 border-t-transparent mr-1.5"></div>
                        回滚中...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-arrow-counterclockwise mr-1.5"></i>
                        回滚
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 版本对比弹窗 */}
      {compareVersions && (
        <VersionCompare
          version1={compareVersions[0]}
          version2={compareVersions[1]}
          onClose={() => setCompareVersions(null)}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
};

export default VersionHistory; 