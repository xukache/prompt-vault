"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/features/theme-toggle";
import { useAuth } from "@/contexts/auth-context";

export const Header = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 处理用户下拉菜单
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // 处理移动端菜单
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById("userDropdown");
      if (dropdown && !dropdown.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  // 处理退出登录
  const handleLogout = () => {
    setIsDropdownOpen(false);
    logout();
  };

  // 获取用户头像显示字符
  const getAvatarText = () => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  // 检查当前路径是否激活
  const isActiveLink = (path: string) => {
    return pathname === path;
  };

  // 导航链接配置
  const navLinks = [
    { href: "/dashboard", label: "仪表盘" },
    { href: "/prompts", label: "提示词库" },
    { href: "/square", label: "提示词广场" },
    { href: "/knowledge", label: "知识库" },
    { href: "/settings", label: "设置" }
  ];

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm py-4 px-6 border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/dashboard" className="text-xl font-bold flex items-center">
            <i className="bi bi-rocket-takeoff-fill text-2xl text-primary-600 mr-2"></i>
            <span className="text-primary-600 dark:text-primary-400">PromptVault</span>
          </Link>
        </div>

        {/* 导航链接 - 桌面端 */}
        <nav className="hidden md:flex space-x-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`transition-colors ${
                isActiveLink(link.href)
                  ? "text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400 font-medium"
                  : "text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* 右侧操作区 */}
        <div className="flex items-center space-x-4">
          {/* 主题切换 */}
          <ThemeToggle />

          {/* 用户头像和下拉菜单 */}
          <div className="relative" id="userDropdown">
            <button
              onClick={toggleDropdown}
              className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="用户菜单"
            >
              <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-medium border-2 border-primary-500">
                {getAvatarText()}
              </div>
              <i className="bi bi-chevron-down text-gray-500 dark:text-gray-400 text-xs"></i>
            </button>

            {/* 下拉菜单 */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.name || '用户'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                  {user?.role === 'admin' && (
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 rounded">
                      管理员
                    </span>
                  )}
                </div>
                
                <Link
                  href="/settings"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <i className="bi bi-person mr-3 text-gray-500 dark:text-gray-400"></i>
                  个人资料
                </Link>
                
                <Link
                  href="/settings"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <i className="bi bi-gear mr-3 text-gray-500 dark:text-gray-400"></i>
                  设置
                </Link>
                
                <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                  <button
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={handleLogout}
                  >
                    <i className="bi bi-box-arrow-right mr-3"></i>
                    退出登录
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 移动端菜单按钮 */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 focus:outline-none"
          >
            <i className="bi bi-list text-2xl"></i>
          </button>
        </div>
      </div>

      {/* 移动端菜单 */}
      {isMobileMenuOpen && (
        <div className="md:hidden mt-4 pb-4 px-6">
          <nav className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`py-2 transition-colors ${
                  isActiveLink(link.href)
                    ? "text-primary-600 dark:text-primary-400 font-medium"
                    : "text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}; 