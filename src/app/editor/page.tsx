"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Breadcrumb, BreadcrumbItem } from "@/components/ui/breadcrumb";
import { PromptEditor } from "@/components/features/editor/prompt-editor";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAppStore } from "@/stores/app-store";
import { Prompt } from "@/types";

const breadcrumbItems: BreadcrumbItem[] = [
  { label: "提示词编辑器", current: true }
];

function EditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { fetchPromptById } = useAppStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  
  // 获取编辑的提示词ID（如果是编辑模式）
  const promptId = searchParams?.get('id');
  const isEditMode = !!promptId;

  useEffect(() => {
    if (isEditMode && promptId) {
      setIsLoading(true);
      fetchPromptById(promptId)
        .then((prompt) => {
          setCurrentPrompt(prompt);
        })
        .catch((error) => {
          console.error('Failed to fetch prompt:', error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [promptId, isEditMode, fetchPromptById]);

  const handleSave = () => {
    // 保存成功后跳转到提示词管理页面
    router.push('/prompts');
  };

  const handleCancel = () => {
    router.push('/prompts');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">加载中...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* 导航栏 */}
      <Header />
      
      {/* 主要内容 */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* 面包屑导航 */}
        <Breadcrumb items={breadcrumbItems} />

        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {isEditMode ? '编辑提示词' : '创建新提示词'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isEditMode 
                ? '修改和完善您的提示词内容' 
                : '创建一个新的提示词，支持Markdown格式和变量系统'
              }
            </p>
          </div>
        </div>

        {/* 编辑器组件 */}
        <PromptEditor
          initialPrompt={currentPrompt}
          isEditMode={isEditMode}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </main>
    </div>
  );
}

export default function EditorPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
          <Header />
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">加载中...</p>
              </div>
            </div>
          </div>
        </div>
      }>
        <EditorContent />
      </Suspense>
    </ProtectedRoute>
  );
} 