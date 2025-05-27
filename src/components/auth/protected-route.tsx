"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
  allowedRoles?: ('admin' | 'user')[];
}

export function ProtectedRoute({ 
  children, 
  requireAuth = true,
  redirectTo = '/auth/login',
  allowedRoles = ['admin', 'user']
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // 如果不需要认证，直接渲染
    if (!requireAuth) return;

    // 等待认证状态加载完成
    if (isLoading) return;

    // 如果未登录，跳转到登录页面
    if (!isAuthenticated) {
      // 保存当前路径，登录后可以跳转回来
      const returnUrl = encodeURIComponent(pathname);
      router.push(`${redirectTo}?returnUrl=${returnUrl}`);
      return;
    }

    // 检查用户角色权限
    if (user && !allowedRoles.includes(user.role)) {
      // 权限不足，跳转到首页或错误页面
      router.push('/dashboard');
      return;
    }
  }, [user, isLoading, isAuthenticated, requireAuth, router, pathname, redirectTo, allowedRoles]);

  // 显示加载状态
  if (requireAuth && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">正在验证身份...</p>
        </div>
      </div>
    );
  }

  // 如果需要认证但未登录，显示空白（等待跳转）
  if (requireAuth && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">正在跳转到登录页面...</p>
        </div>
      </div>
    );
  }

  // 检查角色权限
  if (requireAuth && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">访问被拒绝</h1>
          <p className="text-muted-foreground">您没有权限访问此页面</p>
        </div>
      </div>
    );
  }

  // 渲染受保护的内容
  return <>{children}</>;
}

// 高阶组件版本，用于包装页面组件
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<ProtectedRouteProps, 'children'>
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
} 