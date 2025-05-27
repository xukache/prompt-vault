"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { ThemeToggle } from "@/components/features/theme-toggle";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });
  const [error, setError] = useState("");
  const [showRegisterHint, setShowRegisterHint] = useState(false);

  // 获取返回URL
  const returnUrl = searchParams.get("returnUrl") || "/dashboard";

  // 如果已经登录，直接跳转
  useEffect(() => {
    if (isAuthenticated) {
      router.push(returnUrl);
    }
  }, [isAuthenticated, router, returnUrl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // 清除错误信息
    if (error) setError("");
    if (showRegisterHint) setShowRegisterHint(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setShowRegisterHint(false);

    // 基本验证
    if (!formData.email.trim()) {
      setError("请输入邮箱地址");
      return;
    }

    if (!formData.password) {
      setError("请输入密码");
      return;
    }

    try {
      const result = await login(formData);

      if (result.success) {
        // 登录成功，跳转到目标页面
        router.push(returnUrl);
      } else {
        setError(result.message || "登录失败");

        // 如果是用户不存在的错误，显示注册提示
        if (result.message?.includes("邮箱或密码错误")) {
          setShowRegisterHint(true);
        }
      }
    } catch {
      setError("登录失败，请重试");
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-between items-center">
          <Link
            href="/"
            className="text-xl font-bold text-primary flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.29 7 12 12 20.71 7" />
              <line x1="12" y1="22" x2="12" y2="12" />
            </svg>
            PromptVault
          </Link>
          <ThemeToggle />
        </div>

        <div className="bg-card p-8 rounded-lg shadow-md border border-border">
          <h2 className="text-2xl font-bold text-center mb-6 text-card-foreground">
            登录账户
          </h2>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md mb-4 text-sm">
              {error}
            </div>
          )}

          {showRegisterHint && (
            <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 p-3 rounded-md mb-4 text-sm">
              <p className="mb-2">用户不存在？</p>
              <Link
                href="/auth/register"
                className="font-medium underline hover:no-underline"
              >
                点击这里注册新账户 →
              </Link>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                电子邮箱
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <div className="flex justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-muted-foreground mb-1"
                >
                  密码
                </label>
                <a
                  href="#"
                  className="text-sm text-primary hover:text-primary/80"
                >
                  忘记密码?
                </a>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center">
              <input
                id="remember"
                name="remember"
                type="checkbox"
                checked={formData.remember}
                onChange={handleChange}
                className="h-4 w-4 text-primary focus:ring-primary border-input rounded"
              />
              <label
                htmlFor="remember"
                className="ml-2 block text-sm text-muted-foreground"
              >
                记住我（保持登录状态1天）
              </label>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? "登录中..." : "登录"}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              还没有账户?{" "}
              <Link
                href="/auth/register"
                className="text-primary hover:text-primary/80 font-medium"
              >
                注册账户
              </Link>
            </p>
          </div>

          {/* 测试账户提示 */}
          <div className="mt-6 p-4 bg-muted rounded-md">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              测试账户：
            </h3>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>管理员：admin@promptvault.com / admin123</p>
              <p>普通用户：user@promptvault.com / user123</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">正在加载...</p>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
