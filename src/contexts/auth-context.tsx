"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContextType, User, LoginRequest, LoginResponse, RegisterRequest } from '@/types/auth';
import { 
  setAuthToken, 
  setUserInfo, 
  getUserInfo, 
  clearAuthCookies, 
  isTokenValid 
} from '@/lib/auth/cookies';

// 创建身份验证上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 模拟用户数据库
const MOCK_USERS = [
  {
    id: '1',
    email: 'admin@promptvault.com',
    password: 'admin123',
    name: '管理员',
    role: 'admin' as const,
    createdAt: '2024-01-01T00:00:00Z',
    lastLoginAt: new Date().toISOString(),
  },
  {
    id: '2',
    email: 'user@promptvault.com',
    password: 'user123',
    name: '普通用户',
    role: 'user' as const,
    createdAt: '2024-01-01T00:00:00Z',
    lastLoginAt: new Date().toISOString(),
  },
];

// 身份验证Provider组件
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // 检查用户是否已登录
  const checkAuth = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // 检查Cookie中的认证信息
      if (isTokenValid()) {
        const userInfo = getUserInfo<User>();
        if (userInfo) {
          setUser(userInfo);
        } else {
          // Cookie无效，清除并跳转登录
          clearAuthCookies();
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('检查认证状态失败:', error);
      setUser(null);
      clearAuthCookies();
    } finally {
      setIsLoading(false);
    }
  };

  // 登录函数
  const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      setIsLoading(true);

      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 查找用户
      const foundUser = MOCK_USERS.find(
        u => u.email === credentials.email && u.password === credentials.password
      );

      if (!foundUser) {
        return {
          success: false,
          message: '邮箱或密码错误，请检查后重试',
        };
      }

      // 创建用户对象（不包含密码）
      const userWithoutPassword: User = {
        id: foundUser.id,
        email: foundUser.email,
        name: foundUser.name,
        role: foundUser.role,
        createdAt: foundUser.createdAt,
        lastLoginAt: new Date().toISOString(),
      };

      // 生成模拟token
      const token = `token_${foundUser.id}_${Date.now()}`;

      // 设置Cookie（1天有效期）
      setAuthToken(token);
      setUserInfo(userWithoutPassword);

      // 更新状态
      setUser(userWithoutPassword);

      return {
        success: true,
        user: userWithoutPassword,
        token,
        message: '登录成功',
      };
    } catch (error) {
      console.error('登录失败:', error);
      return {
        success: false,
        message: '登录失败，请稍后重试',
      };
    } finally {
      setIsLoading(false);
    }
  };

  // 注册函数
  const register = async (data: RegisterRequest): Promise<LoginResponse> => {
    try {
      setIsLoading(true);

      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 检查邮箱是否已存在
      const existingUser = MOCK_USERS.find(u => u.email === data.email);
      if (existingUser) {
        return {
          success: false,
          message: '该邮箱已被注册，请使用其他邮箱或直接登录',
        };
      }

      // 检查密码确认
      if (data.password !== data.confirmPassword) {
        return {
          success: false,
          message: '两次输入的密码不一致',
        };
      }

      // 创建新用户
      const newUser: User = {
        id: `user_${Date.now()}`,
        email: data.email,
        name: data.name,
        role: 'user',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      // 生成token
      const token = `token_${newUser.id}_${Date.now()}`;

      // 设置Cookie
      setAuthToken(token);
      setUserInfo(newUser);

      // 更新状态
      setUser(newUser);

      return {
        success: true,
        user: newUser,
        token,
        message: '注册成功',
      };
    } catch (error) {
      console.error('注册失败:', error);
      return {
        success: false,
        message: '注册失败，请稍后重试',
      };
    } finally {
      setIsLoading(false);
    }
  };

  // 登出函数
  const logout = useCallback((): void => {
    setUser(null);
    clearAuthCookies();
    router.push('/auth/login');
  }, [router]);

  // 组件挂载时检查认证状态
  useEffect(() => {
    checkAuth();
  }, []);

  // 定期检查Cookie有效性（每5分钟）
  useEffect(() => {
    const interval = setInterval(() => {
      if (user && !isTokenValid()) {
        console.log('Cookie已过期，自动登出');
        logout();
      }
    }, 5 * 60 * 1000); // 5分钟

    return () => clearInterval(interval);
  }, [user, logout]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    register,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// 使用身份验证上下文的Hook
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 