"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { PromptResult } from '@/types';
import { useToast } from '@/components/ui/toast';
import MarkdownPreview from '@uiw/react-markdown-preview';
import { ClientTime } from '@/components/ui/client-time';

interface ResultDemonstrationProps {
  promptId: string;
  promptContent: string;
  variables?: Record<string, string>;
  isDarkMode?: boolean;
}

// 主效果演示组件（卡片式布局）
const ResultDemonstration: React.FC<ResultDemonstrationProps> = ({
  promptId,
  promptContent,
  variables = {},
  isDarkMode
}) => {
  const { showToast } = useToast();
  const [results, setResults] = useState<PromptResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingRating, setUpdatingRating] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [fullscreenResult, setFullscreenResult] = useState<PromptResult | null>(null);

  // 获取效果记录
  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/prompts/${promptId}/results`);
        
        if (!response.ok) {
          throw new Error('获取效果记录失败');
        }

        const data = await response.json();
        setResults(data);
      } catch (err) {
        console.error('获取效果记录失败:', err);
        setError('获取效果记录失败');
      } finally {
        setLoading(false);
      }
    };

    if (promptId) {
      fetchResults();
    }
  }, [promptId]);

  // ESC键退出全屏预览
  const handleEscapeKey = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && fullscreenResult) {
      setFullscreenResult(null);
    }
  }, [fullscreenResult]);

  // 监听ESC键
  useEffect(() => {
    if (fullscreenResult) {
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [fullscreenResult, handleEscapeKey]);

  // 切换卡片展开状态
  const toggleCardExpansion = (resultId: string) => {
    setExpandedCard(expandedCard === resultId ? null : resultId);
  };

  // 打开全屏预览
  const handleFullscreenPreview = (result: PromptResult, e: React.MouseEvent) => {
    e.stopPropagation();
    setFullscreenResult(result);
  };

  // 关闭全屏预览
  const handleCloseFullscreen = () => {
    setFullscreenResult(null);
  };

  // 更新评分
  const handleUpdateRating = async (resultId: string, rating: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setUpdatingRating(resultId);
      
      const response = await fetch(`/api/prompts/${promptId}/results/${resultId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating }),
      });

      if (!response.ok) {
        throw new Error('更新评分失败');
      }

      const updatedResult = await response.json();
      setResults(prev => prev.map(result => 
        result.id === resultId ? updatedResult : result
      ));
      
      showToast({
        message: '评分更新成功',
        type: 'success'
      });
    } catch (err) {
      console.error('更新评分失败:', err);
      showToast({
        message: '更新评分失败',
        type: 'error'
      });
    } finally {
      setUpdatingRating(null);
    }
  };

  // 删除记录
  const handleDeleteResult = async (resultId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('确定要删除这条效果记录吗？')) {
      return;
    }

    try {
      const response = await fetch(`/api/prompts/${promptId}/results/${resultId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('删除记录失败');
      }

      setResults(prev => prev.filter(result => result.id !== resultId));
      
      showToast({
        message: '记录删除成功',
        type: 'success'
      });
    } catch (err) {
      console.error('删除记录失败:', err);
      showToast({
        message: '删除记录失败',
        type: 'error'
      });
    }
  };

  // 生成卡片封面
  const renderCardCover = (result: PromptResult) => {
    switch (result.result_type) {
      case 'image':
        if (result.cover_image) {
          return (
            <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
              <img 
                src={result.cover_image} 
                alt="效果封面"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <i className="bi bi-image text-3xl mb-2"></i>
                  <p className="text-sm">封面图片加载失败</p>
                </div>
              </div>
              <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                图片
              </div>
            </div>
          );
        }
        return (
          <div className="w-full h-48 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 rounded-lg flex items-center justify-center">
            <div className="text-center text-purple-600 dark:text-purple-300">
              <i className="bi bi-image text-4xl mb-2"></i>
              <p className="text-sm font-medium">图片效果</p>
            </div>
          </div>
        );

      case 'html':
        if (result.cover_image) {
          return (
            <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
              <img 
                src={result.cover_image} 
                alt="HTML效果封面"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <i className="bi bi-code-slash text-3xl mb-2"></i>
                  <p className="text-sm">HTML封面加载失败</p>
                </div>
              </div>
              <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                HTML
              </div>
            </div>
          );
        }
        return (
          <div className="w-full h-48 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-lg flex items-center justify-center">
            <div className="text-center text-green-600 dark:text-green-300">
              <i className="bi bi-code-slash text-4xl mb-2"></i>
              <p className="text-sm font-medium">HTML效果</p>
            </div>
          </div>
        );

      case 'text':
      default:
        if (result.cover_image) {
          return (
            <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
              <img 
                src={result.cover_image} 
                alt="文本效果封面"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <i className="bi bi-file-text text-3xl mb-2"></i>
                  <p className="text-sm">文本封面加载失败</p>
                </div>
              </div>
              <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                文本
              </div>
            </div>
          );
        }
        return (
          <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-lg flex items-center justify-center">
            <div className="text-center text-blue-600 dark:text-blue-300">
              <i className="bi bi-file-text text-4xl mb-2"></i>
              <p className="text-sm font-medium">文本效果</p>
              {result.generated_content && (
                <p className="text-xs mt-2 px-4 opacity-75 line-clamp-2">
                  {result.generated_content.substring(0, 100)}...
                </p>
              )}
            </div>
          </div>
        );
    }
  };

  // 渲染展开的内容
  const renderExpandedContent = (result: PromptResult) => {
    switch (result.result_type) {
      case 'image':
        return (
          <div className="mt-4 space-y-4">
            {result.result_data && (
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                <div className="relative">
                  <img 
                    src={result.result_data} 
                    alt="效果图片"
                    className="w-full h-auto max-h-96 object-contain bg-gray-50 dark:bg-gray-800"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <div className="hidden p-8 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">
                    <i className="bi bi-exclamation-triangle text-2xl mb-2"></i>
                    <p>图片加载失败</p>
                  </div>
                  <button
                    onClick={(e) => handleFullscreenPreview(result, e)}
                    className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded-md hover:bg-opacity-70 transition-all"
                    title="全屏预览"
                  >
                    <i className="bi bi-arrows-fullscreen text-sm"></i>
                  </button>
                </div>
              </div>
            )}
            {result.generated_content && (
              <div>
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  图片描述:
                </h5>
                <div className={`border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden ${
                  isDarkMode 
                    ? 'bg-gray-900 [&_.wmde-markdown]:text-gray-200'
                    : 'bg-white [&_.wmde-markdown]:text-gray-800'
                }`}>
                  <MarkdownPreview 
                    source={result.generated_content}
                    style={{ 
                      backgroundColor: 'transparent',
                      padding: '12px',
                      fontSize: '14px'
                    }}
                    data-color-mode={isDarkMode ? "dark" : "light"}
                  />
                </div>
              </div>
            )}
          </div>
        );

      case 'html':
        return (
          <div className="mt-4 space-y-4">
            {result.result_data && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    HTML渲染效果:
                  </h5>
                  <button
                    onClick={(e) => handleFullscreenPreview(result, e)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1"
                    title="全屏预览"
                  >
                    <i className="bi bi-arrows-fullscreen text-sm"></i>
                  </button>
                </div>
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                  <iframe
                    srcDoc={result.result_data}
                    className="w-full h-64 border-0"
                    sandbox="allow-scripts allow-same-origin"
                    title="HTML渲染预览"
                  />
                </div>
              </div>
            )}
            {result.generated_content && (
              <div>
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  生成内容:
                </h5>
                <div className={`border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden ${
                  isDarkMode 
                    ? 'bg-gray-900 [&_.wmde-markdown]:text-gray-200'
                    : 'bg-white [&_.wmde-markdown]:text-gray-800'
                }`}>
                  <MarkdownPreview 
                    source={result.generated_content}
                    style={{ 
                      backgroundColor: 'transparent',
                      padding: '12px',
                      fontSize: '14px'
                    }}
                    data-color-mode={isDarkMode ? "dark" : "light"}
                  />
                </div>
              </div>
            )}
          </div>
        );

      case 'text':
      default:
        return (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                生成内容:
              </h5>
              <button
                onClick={(e) => handleFullscreenPreview(result, e)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1"
                title="全屏预览"
              >
                <i className="bi bi-arrows-fullscreen text-sm"></i>
              </button>
            </div>
            <div className={`border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden ${
              isDarkMode 
                ? 'bg-gray-900 [&_.wmde-markdown]:text-gray-200'
                : 'bg-white [&_.wmde-markdown]:text-gray-800'
            }`}>
              <MarkdownPreview 
                source={result.generated_content}
                style={{ 
                  backgroundColor: 'transparent',
                  padding: '12px',
                  fontSize: '14px',
                  maxHeight: '300px',
                  overflow: 'auto'
                }}
                data-color-mode={isDarkMode ? "dark" : "light"}
              />
            </div>
          </div>
        );
    }
  };

  // 全屏预览组件
  const FullscreenPreview = ({ result }: { result: PromptResult }) => {
    const renderFullscreenContent = () => {
      switch (result.result_type) {
        case 'image':
          return (
            <div className="h-full flex items-center justify-center bg-black">
              <img 
                src={result.result_data} 
                alt="效果图片"
                className="max-h-full max-w-full object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden text-center text-white">
                <i className="bi bi-exclamation-triangle text-4xl mb-4"></i>
                <p>图片加载失败</p>
              </div>
            </div>
          );

        case 'html':
          return (
            <div className="h-full">
              <iframe
                srcDoc={result.result_data}
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin"
                title="HTML渲染预览"
              />
            </div>
          );

        case 'text':
        default:
          return (
            <div className={`h-full overflow-auto ${
              isDarkMode 
                ? 'bg-gray-900 [&_.wmde-markdown]:text-gray-200'
                : 'bg-white [&_.wmde-markdown]:text-gray-800'
            }`}>
              <MarkdownPreview 
                source={result.generated_content}
                style={{ 
                  backgroundColor: 'transparent',
                  padding: '24px',
                  fontSize: '16px',
                  lineHeight: '1.6',
                  height: '100%'
                }}
                data-color-mode={isDarkMode ? "dark" : "light"}
              />
            </div>
          );
      }
    };

    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-90 flex flex-col z-50"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleCloseFullscreen();
          }
        }}
      >
        {/* 顶部工具栏 */}
        <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              result.result_type === 'text' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
              result.result_type === 'html' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
              result.result_type === 'image' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
              'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
            }`}>
              {result.result_type === 'text' ? '文本' :
               result.result_type === 'html' ? 'HTML' :
               result.result_type === 'image' ? '图片' : '其他'}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              全屏预览
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-500">
              <ClientTime date={result.created_at} />
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              按 ESC 键退出
            </span>
            <button
              onClick={handleCloseFullscreen}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              title="关闭全屏预览"
            >
              <i className="bi bi-x-lg text-xl"></i>
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-hidden">
          {renderFullscreenContent()}
        </div>
      </div>
    );
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

  return (
    <div>
      {/* 标题栏 */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          效果演示 ({results.length})
        </h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          在编辑页面可以上传新的效果记录
        </div>
      </div>

      {/* 效果记录卡片网格 */}
      {results.length === 0 ? (
        <div className="text-center py-12">
          <i className="bi bi-star text-6xl text-gray-400 mb-4"></i>
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-2">
            暂无效果记录
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            在编辑页面添加使用效果记录来展示提示词的实际效果
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((result) => (
            <div
              key={result.id}
              className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden ${
                expandedCard === result.id ? 'ring-2 ring-primary-500 shadow-lg' : ''
              }`}
              onClick={() => toggleCardExpansion(result.id)}
            >
              {/* 卡片封面 */}
              <div className="p-4 pb-0">
                {renderCardCover(result)}
              </div>

              {/* 卡片信息 */}
              <div className="p-4">
                {/* 标题 */}
                {result.title && (
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
                      {result.title}
                    </h3>
                  </div>
                )}

                {/* 头部信息 */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                      result.result_type === 'text' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      result.result_type === 'html' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      result.result_type === 'image' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {result.result_type === 'text' ? '文本' :
                       result.result_type === 'html' ? 'HTML' :
                       result.result_type === 'image' ? '图片' : '其他'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {/* 评分 */}
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={(e) => handleUpdateRating(result.id, star, e)}
                          disabled={updatingRating === result.id}
                          className={`text-sm transition-colors ${
                            star <= result.rating
                              ? 'text-yellow-400 hover:text-yellow-500'
                              : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400'
                          } disabled:opacity-50`}
                        >
                          <i className="bi bi-star-fill"></i>
                        </button>
                      ))}
                    </div>
                    
                    {/* 删除按钮 */}
                    <button
                      onClick={(e) => handleDeleteResult(result.id, e)}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 ml-2 p-1"
                    >
                      <i className="bi bi-trash text-sm"></i>
                    </button>
                  </div>
                </div>

                {/* 时间信息 */}
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  <ClientTime date={result.created_at} />
                </div>

                {/* 简要描述 */}
                {result.generated_content && result.result_type === 'text' && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {result.generated_content.substring(0, 120)}
                    {result.generated_content.length > 120 ? '...' : ''}
                  </div>
                )}

                {/* 反馈评价预览 */}
                {result.feedback && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-md p-2 mb-3 line-clamp-2">
                    <i className="bi bi-chat-quote mr-1"></i>
                    {result.feedback}
                  </div>
                )}

                {/* 展开指示器 */}
                <div className="flex justify-center">
                  <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                    <i className={`bi ${expandedCard === result.id ? 'bi-chevron-up' : 'bi-chevron-down'} text-sm`}></i>
                  </button>
                </div>
              </div>

              {/* 展开的详细内容 */}
              {expandedCard === result.id && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-700/50">
                  {renderExpandedContent(result)}
                  
                  {/* 完整的反馈评价 */}
                  {result.feedback && (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        效果评价:
                      </h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md p-3">
                        {result.feedback}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 全屏预览弹窗 */}
      {fullscreenResult && <FullscreenPreview result={fullscreenResult} />}
    </div>
  );
};

export default ResultDemonstration; 