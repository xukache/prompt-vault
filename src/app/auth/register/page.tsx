"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { ThemeToggle } from "@/components/features/theme-toggle";

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 基本验证
    if (!formData.name.trim()) {
      setError("请输入姓名");
      return;
    }

    if (!formData.email.trim()) {
      setError("请输入邮箱");
      return;
    }

    if (!formData.password) {
      setError("请输入密码");
      return;
    }

    if (formData.password.length < 6) {
      setError("密码长度至少6位");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    try {
      const result = await register(formData);
      
      if (result.success) {
        // 注册成功，跳转到仪表盘
        router.push('/dashboard');
      } else {
        setError(result.message || '注册失败');
      }
    } catch {
      setError('注册失败，请重试');
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
            创建账户
          </h2>
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md mb-4 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-muted-foreground mb-1">
                姓名
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="请输入您的姓名"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-1">
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
              <label htmlFor="password" className="block text-sm font-medium text-muted-foreground mb-1">
                密码
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="至少6位密码"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-muted-foreground mb-1">
                确认密码
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="再次输入密码"
              />
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? "注册中..." : "注册账户"}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              已有账户?{" "}
              <Link href="/auth/login" className="text-primary hover:text-primary/80 font-medium">
                立即登录
              </Link>
            </p>
          </div>
        </div>
        
        <p className="text-center text-sm text-muted-foreground mt-8">
          注册即表示您同意我们的{" "}
          <a href="#" className="text-primary hover:underline">
            服务条款
          </a>{" "}
          和{" "}
          <a href="#" className="text-primary hover:underline">
            隐私政策
          </a>
        </p>
      </div>
    </main>
  );
} 