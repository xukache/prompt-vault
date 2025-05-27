"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Rating } from "@/components/ui/rating";
import MarkdownPreview from "@uiw/react-markdown-preview";
import { toast } from "react-hot-toast";
import ResultDemonstration from "@/components/prompt/result-demonstration";

interface SharedPrompt {
  id: string;
  title: string;
  content: string;
  description: string;
  share_description: string;
  rating: number;
  like_count: number;
  share_count: number;
  shared_at: string;
  user_id: string;
  author_name: string;
  category_name?: string;
  tags: string[];
  is_liked?: boolean;
  is_favorited?: boolean;
}

interface PromptPreviewModalProps {
  prompt: SharedPrompt | null;
  isOpen: boolean;
  onClose: () => void;
  onLike: (promptId: string) => void;
  onFavorite: (promptId: string) => void;
  onCopyToLibrary: (prompt: SharedPrompt) => void;
}

export const PromptPreviewModal: React.FC<PromptPreviewModalProps> = ({
  prompt,
  isOpen,
  onClose,
  onLike,
  onFavorite,
  onCopyToLibrary,
}) => {
  const [activeTab, setActiveTab] = useState<"content" | "usage" | "results">("content");
  const [inputVariables, setInputVariables] = useState<Record<string, string>>({});
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 检测暗色主题
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark =
        document.documentElement.classList.contains("dark") ||
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDarkMode(isDark);
    };

    checkDarkMode();

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

  // 提取变量（去重）
  const extractVariables = (content: string | undefined): string[] => {
    if (!content) return [];
    const matches = content.match(/{{([^}]+)}}/g);
    const variables = matches
      ? matches.map((match) => match.slice(2, -2).trim())
      : [];
    return [...new Set(variables)].sort();
  };

  const variableKeys = extractVariables(prompt?.content);

  // 处理变量输入变化
  const handleVariableChange = (key: string, value: string) => {
    setInputVariables((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 生成最终提示词
  const generatedPrompt = useMemo(() => {
    if (!prompt?.content) return "";

    let result = prompt.content;
    Object.entries(inputVariables).forEach(([key, value]) => {
      // 转义特殊字符以避免正则表达式错误
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`{{\\s*${escapedKey}\\s*}}`, 'g');
      result = result.replace(regex, value || `{{${key}}}`);
    });

    return result;
  }, [prompt?.content, inputVariables]);

  // 复制到剪贴板
  const copyToClipboard = async (text: string, successMessage: string = "复制成功") => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(successMessage);
    } catch (err) {
      console.error("复制失败:", err);
      toast.error("复制失败，请手动复制内容");
    }
  };

  // 渲染星级评分
  const renderRating = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <i
            key={star}
            className={`bi bi-star${star <= rating ? '-fill' : ''} text-yellow-400 text-sm`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">
          ({rating})
        </span>
      </div>
    );
  };

  if (!prompt) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-full">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold pr-8">{prompt.title}</DialogTitle>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <i className="bi bi-x-lg text-lg" />
          </button>
        </DialogHeader>

        <div className="space-y-6">
          {/* 作者信息和统计 */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  作者：{prompt.author_name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  发布时间：{new Date(prompt.shared_at).toLocaleDateString()}
                </p>
              </div>
              {prompt.category_name && (
                <Badge variant="outline">{prompt.category_name}</Badge>
              )}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {renderRating(prompt.rating)}
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <i className="bi bi-heart-fill text-red-500" />
                  {prompt.like_count}
                </span>
                <span className="flex items-center gap-1">
                  <i className="bi bi-share" />
                  {prompt.share_count}
                </span>
              </div>
            </div>
          </div>

          {/* 描述 */}
          <div>
            <h3 className="text-lg font-semibold mb-2">描述</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {prompt.share_description || prompt.description}
            </p>
          </div>

          {/* 标签 */}
          {prompt.tags.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">标签</h3>
              <div className="flex flex-wrap gap-2">
                {prompt.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* 选项卡 */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("content")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "content"
                    ? "border-primary-500 text-primary-600 dark:text-primary-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                内容预览
              </button>
              {variableKeys.length > 0 && (
                <button
                  onClick={() => setActiveTab("usage")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "usage"
                      ? "border-primary-500 text-primary-600 dark:text-primary-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  使用指南
                </button>
              )}
              <button
                onClick={() => setActiveTab("results")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "results"
                    ? "border-primary-500 text-primary-600 dark:text-primary-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                效果预览
              </button>
            </nav>
          </div>

          {/* 内容区域 */}
          <div className="min-h-[300px]">
            {activeTab === "content" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">提示词内容</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(prompt.content, "原始内容已复制")}
                  >
                    <i className="bi bi-clipboard mr-2" />
                    复制原文
                  </Button>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <MarkdownPreview
                    source={prompt.content}
                    data-color-mode={isDarkMode ? "dark" : "light"}
                    className="!bg-transparent"
                  />
                </div>
              </div>
            )}

            {activeTab === "usage" && variableKeys.length > 0 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">变量设置</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {variableKeys.map((key) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {key}
                        </label>
                        {key.toLowerCase().includes('description') || 
                         key.toLowerCase().includes('content') || 
                         key.toLowerCase().includes('text') ? (
                          <Textarea
                            value={inputVariables[key] || ""}
                            onChange={(e) => handleVariableChange(key, e.target.value)}
                            placeholder={`请输入 ${key}`}
                            className="min-h-[80px]"
                          />
                        ) : (
                          <Input
                            value={inputVariables[key] || ""}
                            onChange={(e) => handleVariableChange(key, e.target.value)}
                            placeholder={`请输入 ${key}`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">生成的提示词</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(generatedPrompt, "生成的提示词已复制")}
                      disabled={!generatedPrompt.trim()}
                    >
                      <i className="bi bi-clipboard mr-2" />
                      复制结果
                    </Button>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <MarkdownPreview
                      source={generatedPrompt || "请填写变量以生成完整的提示词"}
                      data-color-mode={isDarkMode ? "dark" : "light"}
                      className="!bg-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "results" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">效果预览</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    查看作者分享的使用效果
                  </p>
                </div>
                <ResultDemonstration
                  promptId={prompt.id}
                  promptContent={prompt.content}
                  variables={inputVariables}
                  isDarkMode={isDarkMode}
                />
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onLike(prompt.id)}
                className={prompt.is_liked ? "text-red-500 border-red-500" : ""}
              >
                <i className={`bi bi-heart${prompt.is_liked ? '-fill' : ''} mr-1`} />
                {prompt.is_liked ? "已点赞" : "点赞"} ({prompt.like_count})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onFavorite(prompt.id)}
                className={prompt.is_favorited ? "text-yellow-500 border-yellow-500" : ""}
              >
                <i className={`bi bi-star${prompt.is_favorited ? '-fill' : ''} mr-1`} />
                {prompt.is_favorited ? "已收藏" : "收藏"}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onClose}>
                关闭
              </Button>
              <Button onClick={() => onCopyToLibrary(prompt)}>
                <i className="bi bi-download mr-1" />
                复制到库
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 