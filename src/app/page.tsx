"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // 已登录，跳转到仪表盘
        router.push("/dashboard");
      } else {
        // 未登录，跳转到登录页面
        router.push("/auth/login");
      }
    }
  }, [isAuthenticated, isLoading, router]);

  // 显示加载状态
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">正在加载...</p>
      </div>
    </div>
  );
}
