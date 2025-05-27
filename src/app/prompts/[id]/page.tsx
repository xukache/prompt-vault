"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Prompt } from "@/types";
import { useToast } from "@/components/ui/toast";
import { Rating } from "@/components/ui/rating";
import MarkdownPreview from "@uiw/react-markdown-preview";
import VersionHistory from "@/components/prompt/version-history";
import ResultDemonstration from "@/components/prompt/result-demonstration";

// 扩展Prompt类型以包含详情页面需要的字段
interface PromptDetail extends Prompt {
  category_name?: string;
}

const PromptDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { showToast, ToastContainer } = useToast();
  const [prompt, setPrompt] = useState<PromptDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "content" | "usage" | "versions" | "results"
  >("content");
  const [inputVariables, setInputVariables] = useState<Record<string, string>>(
    {}
  );
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userRating, setUserRating] = useState(0);

  // 检测暗色主题
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark =
        document.documentElement.classList.contains("dark") ||
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDarkMode(isDark);
    };

    checkDarkMode();

    // 监听主题变化
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", checkDarkMode);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener("change", checkDarkMode);
    };
  }, []);

  // 获取提示词详情
  useEffect(() => {
    const fetchPrompt = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/prompts/${params.id}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError("提示词不存在");
          } else {
            setError("获取提示词详情失败");
          }
          return;
        }

        const data = await response.json();
        setPrompt(data);

        // 初始化变量默认值
        if (data.variables) {
          setInputVariables(data.variables);
        }
      } catch (err) {
        console.error("获取提示词详情失败:", err);
        setError("获取提示词详情失败");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchPrompt();
    }
  }, [params.id]);

  // 处理变量输入变化
  const handleVariableChange = (key: string, value: string) => {
    setInputVariables((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 复制到剪贴板
  const copyToClipboard = async (
    text: string,
    successMessage: string = "复制成功"
  ) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast({
        message: successMessage,
        type: "success",
      });
    } catch (err) {
      console.error("复制失败:", err);
      showToast({
        message: "复制失败，请手动复制内容",
        type: "error",
      });
    }
  };

  // 提取变量（去重）
  const extractVariables = (content: string | undefined): string[] => {
    if (!content) return [];
    const matches = content.match(/{{([^}]+)}}/g);
    const variables = matches
      ? matches.map((match) => match.slice(2, -2).trim())
      : [];
    // 去重并排序
    return [...new Set(variables)].sort();
  };

  const variableKeys = extractVariables(prompt?.content);

  // 生成最终提示词
  const generatedPrompt = useMemo(() => {
    if (!prompt?.content) return "";

    let result = prompt.content;
    Object.entries(inputVariables).forEach(([key, value]) => {
      // 转义特殊字符以避免正则表达式错误
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // 创建正则表达式来匹配变量占位符
      const regex = new RegExp(`{{\\s*${escapedKey}\\s*}}`, 'g');
      result = result.replace(regex, value || `{{${key}}}`);
    });

    return result;
  }, [prompt?.content, inputVariables]);

  // 处理评分提交
  const handleRatingChange = async (rating: number) => {
    try {
      const response = await fetch(`/api/prompts/${params.id}/rating`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '评分提交失败');
      }

      const result = await response.json();
      setUserRating(rating);
      
      // 更新提示词的评分
      if (prompt) {
        setPrompt({ ...prompt, rating: result.rating });
      }
      
      showToast({
        message: '评分提交成功！',
        type: 'success',
      });
    } catch (error) {
      console.error('评分提交失败:', error);
      showToast({
        message: error instanceof Error ? error.message : '评分提交失败，请重试',
        type: 'error',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !prompt) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="text-red-500 text-lg mb-4">
              {error || "提示词不存在"}
            </div>
            <button
              onClick={() => router.push("/prompts")}
              className="text-primary-600 hover:text-primary-700"
            >
              返回提示词列表
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <ToastContainer />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 提示词基本信息 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {prompt.title}
                </h1>
                <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  {prompt.version || "v1.0"}
                </span>
              </div>
              
              {/* 评分区域 */}
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">当前评分:</span>
                  <Rating 
                    value={prompt.rating || 0} 
                    readonly 
                    size="sm" 
                    showValue 
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">我的评分:</span>
                  <Rating 
                    value={userRating} 
                    onChange={handleRatingChange}
                    size="sm"
                  />
                </div>
              </div>

              {prompt.tags && prompt.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {prompt.tags.map((tag: string, index: number) => (
                    <span
                      key={`tag-${prompt.id}-${tag}-${index}`}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {prompt.description && (
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {prompt.description}
                </p>
              )}
            </div>
            <div className="flex space-x-3 mt-4 md:mt-0">
              <button
                onClick={() => router.push(`/editor?id=${prompt.id}`)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
              >
                <i className="bi bi-pencil mr-2"></i>
                编辑
              </button>
            </div>
          </div>
        </div>

        {/* 选项卡导航 */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex overflow-x-auto">
            {[
              { key: "content", label: "提示词内容", icon: "bi-file-text" },
              { key: "usage", label: "使用说明", icon: "bi-info-circle" },
              { key: "versions", label: "版本历史", icon: "bi-clock-history" },
              { key: "results", label: "效果演示", icon: "bi-star" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() =>
                  setActiveTab(
                    tab.key as "content" | "usage" | "versions" | "results"
                  )
                }
                className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-primary-600 text-primary-600 dark:text-primary-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                <i className={`${tab.icon} mr-2`}></i>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 选项卡内容 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          {activeTab === "content" && (
            <div>
              {/* 提示词模板 */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  提示词模板
                </h2>
                <div
                  className={`border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-96 overflow-y-auto ${
                    isDarkMode
                      ? "bg-gray-900 [&_.wmde-markdown]:text-gray-200 [&_.wmde-markdown_h1]:text-gray-100 [&_.wmde-markdown_h2]:text-gray-100 [&_.wmde-markdown_h3]:text-gray-100 [&_.wmde-markdown_code]:bg-gray-800 [&_.wmde-markdown_code]:text-gray-200 [&_.wmde-markdown_pre]:bg-gray-800 [&_.wmde-markdown_blockquote]:border-gray-600 [&_.wmde-markdown_blockquote]:text-gray-300"
                      : "bg-white [&_.wmde-markdown]:text-gray-800"
                  }`}
                >
                  <MarkdownPreview
                    source={prompt.content}
                    style={{
                      backgroundColor: "transparent",
                      padding: "16px",
                      fontSize: "14px",
                      color: isDarkMode ? "#e5e7eb" : "#374151",
                    }}
                    wrapperElement={{
                      "data-color-mode": isDarkMode ? "dark" : "light",
                      style: {
                        backgroundColor: "transparent",
                        color: isDarkMode ? "#e5e7eb" : "#374151",
                      },
                    }}
                    data-color-mode={isDarkMode ? "dark" : "light"}
                  />
                </div>
              </div>

              {/* 变量输入区域 */}
              {variableKeys.length > 0 && (
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                      自定义变量 ({variableKeys.length})
                    </h3>
                    <button
                      onClick={() => setInputVariables(prompt.variables || {})}
                      className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      重置为默认值
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {variableKeys.map((key) => (
                      <div key={key} className="relative">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {key}:
                        </label>
                        <textarea
                          value={inputVariables[key] || ""}
                          onChange={(e) =>
                            handleVariableChange(key, e.target.value)
                          }
                          placeholder={`输入 ${key} 的值（支持多行文本）`}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white resize-y min-h-[80px]"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 生成的提示词 */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                    {variableKeys.length > 0 ? "生成的提示词" : "提示词内容"}
                  </h3>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        generatedPrompt,
                        "提示词已复制，可以直接使用了！"
                      )
                    }
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 border border-primary-600 dark:border-primary-400 rounded-md hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                  >
                    <i className="bi bi-clipboard mr-1.5"></i>
                    复制使用
                  </button>
                </div>
                <div
                  className={`border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-96 overflow-y-auto ${
                    isDarkMode
                      ? "bg-gray-900 [&_.wmde-markdown]:text-gray-200 [&_.wmde-markdown_h1]:text-gray-100 [&_.wmde-markdown_h2]:text-gray-100 [&_.wmde-markdown_h3]:text-gray-100 [&_.wmde-markdown_code]:bg-gray-800 [&_.wmde-markdown_code]:text-gray-200 [&_.wmde-markdown_pre]:bg-gray-800 [&_.wmde-markdown_blockquote]:border-gray-600 [&_.wmde-markdown_blockquote]:text-gray-300"
                      : "bg-white [&_.wmde-markdown]:text-gray-800"
                  }`}
                >
                  <MarkdownPreview
                    source={generatedPrompt}
                    style={{
                      backgroundColor: "transparent",
                      padding: "16px",
                      fontSize: "14px",
                      color: isDarkMode ? "#e5e7eb" : "#374151",
                    }}
                    wrapperElement={{
                      "data-color-mode": isDarkMode ? "dark" : "light",
                      style: {
                        backgroundColor: "transparent",
                        color: isDarkMode ? "#e5e7eb" : "#374151",
                      },
                    }}
                    data-color-mode={isDarkMode ? "dark" : "light"}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "usage" && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                使用说明
              </h2>
              {prompt.instructions ? (
                <div
                  className={`border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-96 overflow-y-auto ${
                    isDarkMode
                      ? "bg-gray-900 [&_.wmde-markdown]:text-gray-200 [&_.wmde-markdown_h1]:text-gray-100 [&_.wmde-markdown_h2]:text-gray-100 [&_.wmde-markdown_h3]:text-gray-100 [&_.wmde-markdown_code]:bg-gray-800 [&_.wmde-markdown_code]:text-gray-200 [&_.wmde-markdown_pre]:bg-gray-800 [&_.wmde-markdown_blockquote]:border-gray-600 [&_.wmde-markdown_blockquote]:text-gray-300"
                      : "bg-white [&_.wmde-markdown]:text-gray-800"
                  }`}
                >
                  <MarkdownPreview
                    source={prompt.instructions}
                    style={{
                      backgroundColor: "transparent",
                      padding: "16px",
                      fontSize: "14px",
                      color: isDarkMode ? "#e5e7eb" : "#374151",
                    }}
                    wrapperElement={{
                      "data-color-mode": isDarkMode ? "dark" : "light",
                      style: {
                        backgroundColor: "transparent",
                        color: isDarkMode ? "#e5e7eb" : "#374151",
                      },
                    }}
                    data-color-mode={isDarkMode ? "dark" : "light"}
                  />
                </div>
              ) : (
                <div className="text-center py-8">
                  <i className="bi bi-info-circle text-4xl text-gray-400 mb-4"></i>
                  <p className="text-gray-500 dark:text-gray-400">
                    暂无使用说明
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "versions" && (
            <div>
              <VersionHistory
                promptId={prompt.id}
                onVersionRevert={() => {
                  // 版本回滚后刷新页面数据
                  window.location.reload();
                }}
                isDarkMode={isDarkMode}
              />
            </div>
          )}

          {activeTab === "results" && (
            <div>
              <ResultDemonstration
                promptId={prompt.id}
                promptContent={prompt.content}
                variables={inputVariables}
                isDarkMode={isDarkMode}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PromptDetailPage;
