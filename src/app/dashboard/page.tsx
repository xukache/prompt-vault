"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/contexts/auth-context";
import { ClientTime } from "@/components/ui/client-time";

interface DashboardStats {
  totalPrompts: number;
  totalCategories: number;
  totalFavorites: number;
  thisMonthPrompts: number;
  thisMonthFavorites: number;
  recentPrompts: Array<{
    id: string;
    title: string;
    description: string;
    category: string;
    categoryId: string | null;
    rating: number;
    updatedAt: string;
  }>;
  recentActivities: Array<{
    type: 'create' | 'update';
    title: string;
    updatedAt: string;
  }>;
}

function DashboardContent() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard/stats');
        if (!response.ok) {
          throw new Error('获取统计数据失败');
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const getCategoryColor = (categoryId: string | null) => {
    const colors: Record<string, string> = {
      'writing': 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400',
      'coding': 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400',
      'analysis': 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400',
      'translation': 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400',
      'summary': 'bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-400',
    };
    return colors[categoryId || ''] || 'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-dark-950 text-gray-900 dark:text-gray-100">
        <Header />
        <main className="container mx-auto py-6 px-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">加载中...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-dark-950 text-gray-900 dark:text-gray-100">
        <Header />
        <main className="container mx-auto py-6 px-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                重试
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-dark-950 text-gray-900 dark:text-gray-100">
      {/* 导航栏 */}
      <Header />

      {/* Main Content */}
      <main className="container mx-auto py-6 px-4">
        {/* 欢迎区域 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            欢迎回来，{user?.name || '用户'}！
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            这里是您的仪表盘中心，让我们开始创造吧！
          </p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* 总提示词数 */}
          <div className="bg-white dark:bg-dark-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-700">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <i className="bi bi-file-text text-blue-600 dark:text-blue-400 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">总提示词</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.totalPrompts || 0}</p>
              </div>
            </div>
            {stats && stats.thisMonthPrompts > 0 && (
              <div className="mt-4 flex items-center text-sm">
                <span className="text-green-600 dark:text-green-400">+{stats.thisMonthPrompts}</span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">本月新增</span>
              </div>
            )}
          </div>

          {/* 分类数量 */}
          <div className="bg-white dark:bg-dark-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-700">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <i className="bi bi-folder text-green-600 dark:text-green-400 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">分类数量</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.totalCategories || 0}</p>
              </div>
            </div>
          </div>

          {/* 收藏数量 */}
          <div className="bg-white dark:bg-dark-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-700">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <i className="bi bi-heart-fill text-red-600 dark:text-red-400 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">收藏数量</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.totalFavorites || 0}</p>
              </div>
            </div>
            {stats && stats.thisMonthFavorites > 0 && (
              <div className="mt-4 flex items-center text-sm">
                <span className="text-red-600 dark:text-red-400">+{stats.thisMonthFavorites}</span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">本月新增</span>
              </div>
            )}
          </div>

          {/* 平均评分 */}
          <div className="bg-white dark:bg-dark-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-700">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <i className="bi bi-star-fill text-purple-600 dark:text-purple-400 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">平均评分</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.recentPrompts && stats.recentPrompts.length > 0 
                    ? (stats.recentPrompts.reduce((sum, p) => sum + p.rating, 0) / stats.recentPrompts.length).toFixed(1)
                    : '0.0'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 快捷操作 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* 快捷操作卡片 */}
          <div className="bg-white dark:bg-dark-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">快捷操作</h2>
            <div className="space-y-3">
              <Link href="/editor" 
                className="flex items-center p-3 bg-primary-50 dark:bg-primary-900 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-800 transition-colors">
                <i className="bi bi-plus-circle text-primary-600 dark:text-primary-400 text-lg mr-3"></i>
                <span className="text-primary-700 dark:text-primary-300 font-medium">创建新提示词</span>
              </Link>
              
              <Link href="/prompts" 
                className="flex items-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-600 transition-colors">
                <i className="bi bi-collection text-gray-600 dark:text-gray-400 text-lg mr-3"></i>
                <span className="text-gray-700 dark:text-gray-300 font-medium">浏览提示词库</span>
              </Link>
              
              <Link href="/knowledge" 
                className="flex items-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-600 transition-colors">
                <i className="bi bi-book text-gray-600 dark:text-gray-400 text-lg mr-3"></i>
                <span className="text-gray-700 dark:text-gray-300 font-medium">管理知识库</span>
              </Link>
            </div>
          </div>

          {/* 最近活动 */}
          <div className="bg-white dark:bg-dark-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">最近活动</h2>
            <div className="space-y-4">
              {stats?.recentActivities && stats.recentActivities.length > 0 ? (
                stats.recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start">
                    <div className={`w-2 h-2 rounded-full mt-2 mr-3 ${
                      activity.type === 'create' ? 'bg-blue-500' : 'bg-green-500'
                    }`}></div>
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {activity.type === 'create' ? '创建了新提示词' : '更新了'} &ldquo;{activity.title}&rdquo;
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{activity.updatedAt && <ClientTime date={activity.updatedAt} />}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">暂无最近活动</p>
              )}
            </div>
          </div>
        </div>

        {/* 最近使用的提示词 */}
        <div className="bg-white dark:bg-dark-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">最近更新</h2>
            <Link href="/prompts" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">
              查看全部
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats?.recentPrompts && stats.recentPrompts.length > 0 ? (
              stats.recentPrompts.slice(0, 3).map((prompt) => (
                <Link key={prompt.id} href={`/prompts/${prompt.id}`}>
                  <div className="border border-gray-200 dark:border-dark-600 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer h-40 flex flex-col">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate flex-1 mr-2">{prompt.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${getCategoryColor(prompt.categoryId)}`}>
                        {prompt.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3 flex-1">
                      {prompt.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-auto">
                      <div className="flex items-center">
                        <span className="mr-2">评分</span>
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <i
                              key={star}
                              className={`bi bi-star${star <= prompt.rating ? '-fill' : ''} text-xs ${
                                star <= prompt.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
                              }`}
                            ></i>
                          ))}
                        </div>
                      </div>
                      <span>{prompt.updatedAt && <ClientTime date={prompt.updatedAt} />}</span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-3 text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">暂无提示词</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
} 