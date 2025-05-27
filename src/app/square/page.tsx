"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";
import { PromptPreviewModal } from "@/components/square/prompt-preview-modal";

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

export default function SquarePage() {
  const [sharedPrompts, setSharedPrompts] = useState<SharedPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("latest");
  const [previewPrompt, setPreviewPrompt] = useState<SharedPrompt | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // 加载共享提示词
  const loadSharedPrompts = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        search: searchQuery,
        category: selectedCategory,
        sort: sortBy,
      });
      
      const response = await fetch(`/api/prompts/shared?${params}`);
      if (response.ok) {
        const data = await response.json();
        setSharedPrompts(data);
      } else {
        toast.error("加载共享提示词失败");
      }
    } catch (error) {
      console.error("加载共享提示词失败:", error);
      toast.error("加载共享提示词失败");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSharedPrompts();
  }, [searchQuery, selectedCategory, sortBy]);

  // 点赞/取消点赞
  const handleLike = async (promptId: string) => {
    try {
      const response = await fetch(`/api/prompts/${promptId}/like`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        setSharedPrompts(prev => prev.map(prompt => 
          prompt.id === promptId 
            ? { 
                ...prompt, 
                is_liked: data.is_liked,
                like_count: data.like_count 
              }
            : prompt
        ));
        toast.success(data.is_liked ? "已点赞" : "已取消点赞");
      } else {
        toast.error("操作失败");
      }
    } catch (error) {
      console.error("点赞操作失败:", error);
      toast.error("操作失败");
    }
  };

  // 收藏/取消收藏共享提示词
  const handleFavorite = async (promptId: string) => {
    try {
      const response = await fetch(`/api/prompts/${promptId}/favorite-shared`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        setSharedPrompts(prev => prev.map(prompt => 
          prompt.id === promptId 
            ? { ...prompt, is_favorited: data.is_favorited }
            : prompt
        ));
        toast.success(data.is_favorited ? "已收藏到个人库" : "已取消收藏");
      } else {
        toast.error("操作失败");
      }
    } catch (error) {
      console.error("收藏操作失败:", error);
      toast.error("操作失败");
    }
  };

  // 打开预览模态框
  const handlePreview = (prompt: SharedPrompt) => {
    setPreviewPrompt(prompt);
    setIsPreviewOpen(true);
  };

  // 关闭预览模态框
  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setPreviewPrompt(null);
  };

  // 复制提示词到个人库
  const handleCopyToLibrary = async (prompt: SharedPrompt) => {
    try {
      // 先检查是否已存在相同的提示词
      const checkResponse = await fetch('/api/prompts/check-duplicate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `${prompt.title} (来自广场)`, // 检查带后缀的标题
          content: prompt.content,
        }),
      });

      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        console.log('重复检测结果:', checkData);
        
        if (checkData.exists) {
          toast.error(`提示词已存在于您的库中：${checkData.existingPrompt.title}`);
          return;
        }
      } else {
        console.error('重复检测API调用失败:', checkResponse.status);
        // 如果检测失败，为了安全起见，我们仍然继续复制流程
      }

      // 如果不存在，则创建新的提示词
      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `${prompt.title} (来自广场)`,
          content: prompt.content,
          description: prompt.description,
          rating: 0,
          is_favorite: false,
          version: 'v1.0',
          changeDescription: '从提示词广场复制'
        }),
      });

      if (response.ok) {
        const newPromptData = await response.json();
        const newPromptId = newPromptData.id;
        
        // 复制效果演示数据
        try {
          const resultsResponse = await fetch(`/api/prompts/${prompt.id}/results`);
          if (resultsResponse.ok) {
            const results = await resultsResponse.json();
            
            // 为每个效果记录创建新的副本
            for (const result of results) {
              await fetch(`/api/prompts/${newPromptId}/results`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  title: result.title,
                  cover_image: result.cover_image,
                  generated_content: result.generated_content,
                  result_type: result.result_type,
                  result_data: result.result_data,
                  rating: result.rating,
                  feedback: result.feedback
                }),
              });
            }
            
            if (results.length > 0) {
              console.log(`已复制 ${results.length} 条效果演示数据`);
            }
          }
        } catch (error) {
          console.error('复制效果数据失败:', error);
          // 不影响主流程，只是记录错误
        }
        
        // 更新分享次数
        await fetch(`/api/prompts/${prompt.id}/share-count`, {
          method: 'POST',
        });
        
        setSharedPrompts(prev => prev.map(p => 
          p.id === prompt.id 
            ? { ...p, share_count: p.share_count + 1 }
            : p
        ));
        
        toast.success("已复制到您的提示词库（包含效果演示）");
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "复制失败");
      }
    } catch (error) {
      console.error("复制提示词失败:", error);
      toast.error("复制失败");
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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Header />
        
        <main className="container mx-auto px-4 py-6 space-y-6">
          {/* 页面标题 */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">提示词广场</h1>
              <p className="text-muted-foreground mt-1">
                发现和分享优质的提示词，与社区一起成长
              </p>
            </div>
          </div>

          {/* 搜索和筛选 */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="搜索提示词..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">全部分类</option>
                    <option value="writing">写作助手</option>
                    <option value="coding">编程开发</option>
                    <option value="business">商业营销</option>
                    <option value="education">教育学习</option>
                  </select>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="latest">最新发布</option>
                    <option value="popular">最受欢迎</option>
                    <option value="rating">评分最高</option>
                    <option value="most_shared">分享最多</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 提示词列表 */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">加载中...</p>
              </div>
            </div>
          ) : sharedPrompts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <i className="bi bi-share text-4xl text-gray-400 mb-4"></i>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  暂无共享提示词
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  成为第一个分享提示词的用户吧！
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sharedPrompts.map((prompt) => (
                <Card key={prompt.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{prompt.title}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <span>by {prompt.author_name}</span>
                          <span>•</span>
                          <span>{new Date(prompt.shared_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLike(prompt.id)}
                          className={prompt.is_liked ? "text-red-500" : ""}
                        >
                          <i className={`bi bi-heart${prompt.is_liked ? '-fill' : ''} mr-1`} />
                          {prompt.like_count}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFavorite(prompt.id)}
                          className={prompt.is_favorited ? "text-yellow-500" : ""}
                        >
                          <i className={`bi bi-star${prompt.is_favorited ? '-fill' : ''}`} />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* 描述 */}
                    <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3">
                      {prompt.share_description || prompt.description}
                    </p>

                    {/* 评分和标签 */}
                    <div className="flex items-center justify-between">
                      {renderRating(prompt.rating)}
                      <div className="flex gap-1">
                        {prompt.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {prompt.tags.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{prompt.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* 统计信息 */}
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <i className="bi bi-share" />
                        {prompt.share_count} 次分享
                      </span>
                      {prompt.category_name && (
                        <Badge variant="outline" className="text-xs">
                          {prompt.category_name}
                        </Badge>
                      )}
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handlePreview(prompt)}
                      >
                        <i className="bi bi-eye mr-1" />
                        预览
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleCopyToLibrary(prompt)}
                      >
                        <i className="bi bi-download mr-1" />
                        复制到库
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
                      )}
        </main>

        {/* 预览模态框 */}
        <PromptPreviewModal
          prompt={previewPrompt}
          isOpen={isPreviewOpen}
          onClose={handleClosePreview}
          onLike={handleLike}
          onFavorite={handleFavorite}
          onCopyToLibrary={handleCopyToLibrary}
        />
      </div>
    </ProtectedRoute>
  );
} 