'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Header } from '@/components/layout/header';
import { ProtectedRoute } from '@/components/auth/protected-route';

// 类型定义
interface ProfileData {
  displayName: string;
  username: string;
  email: string;
  bio: string;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface IntegrationData {
  apiBaseUrl: string;
  apiKey: string;
  apiModel: string;
}

interface FavoritePrompt {
  id: string;
  title: string;
  description: string;
  category: string;
  categoryId: string | null;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

interface ProfileSectionProps {
  data: ProfileData;
  setData: (data: ProfileData) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  avatarInputRef: React.RefObject<HTMLInputElement | null>;
}

interface AccountSectionProps {
  data: PasswordData;
  setData: (data: PasswordData) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

interface IntegrationSectionProps {
  data: IntegrationData;
  setData: (data: IntegrationData) => void;
  onSave: () => void;
  isLoading: boolean;
}

interface FavoritesSectionProps {
  favorites: FavoritePrompt[];
  selectedFavorites: Set<string>;
  onSelectFavorite: (id: string) => void;
  onSelectAll: () => void;
  onRemoveFavorites: () => void;
  isLoading: boolean;
}

interface DataManagementSectionProps {
  onExport: (format: 'json' | 'csv' | 'markdown') => void;
  onImport: (file: File) => void;
  onClearHistory: () => void;
  onResetSettings: () => void;
  onDeleteAccount: (password: string) => void;
  isLoading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

// 设置页面的主要组件
export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);

  // 表单状态
  const [profileData, setProfileData] = useState<ProfileData>({
    displayName: '',
    username: '',
    email: '',
    bio: ''
  });

  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [integrationData, setIntegrationData] = useState<IntegrationData>({
    apiBaseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    apiModel: 'gpt-3.5-turbo'
  });

  const [favorites, setFavorites] = useState<FavoritePrompt[]>([]);
  const [selectedFavorites, setSelectedFavorites] = useState<Set<string>>(new Set());

  // 加载用户数据
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // 加载用户资料
      const profileResponse = await fetch('/api/user/profile');
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setProfileData(profileData);
      }

      // 加载集成设置
      const integrationsResponse = await fetch('/api/user/integrations');
      if (integrationsResponse.ok) {
        const integrationsData = await integrationsResponse.json();
        setIntegrationData(integrationsData);
      }

      // 加载收藏列表
      const favoritesResponse = await fetch('/api/user/favorites');
      if (favoritesResponse.ok) {
        const favoritesData = await favoritesResponse.json();
        setFavorites(favoritesData);
      }
    } catch (error) {
      console.error('加载用户数据失败:', error);
      toast.error('加载用户数据失败');
    }
  };

  // 处理集成设置保存
  const handleSaveIntegrations = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/user/integrations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(integrationData),
      });

      if (response.ok) {
        toast.success('集成设置已保存');
      } else {
        const error = await response.json();
        toast.error(error.error || '保存失败，请重试');
      }
    } catch {
      toast.error('保存失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理收藏管理
  const handleRemoveFavorites = async () => {
    if (selectedFavorites.size === 0) {
      toast.error('请选择要取消收藏的提示词');
      return;
    }

    if (!confirm(`确定要取消收藏 ${selectedFavorites.size} 个提示词吗？`)) {
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/user/favorites', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ promptIds: Array.from(selectedFavorites) }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message);
        // 重新加载收藏列表
        const favoritesResponse = await fetch('/api/user/favorites');
        if (favoritesResponse.ok) {
          const favoritesData = await favoritesResponse.json();
          setFavorites(favoritesData);
        }
        setSelectedFavorites(new Set());
      } else {
        const error = await response.json();
        toast.error(error.error || '取消收藏失败');
      }
    } catch {
      toast.error('取消收藏失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectFavorite = (id: string) => {
    const newSelected = new Set(selectedFavorites);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedFavorites(newSelected);
  };

  const handleSelectAllFavorites = () => {
    if (selectedFavorites.size === favorites.length) {
      setSelectedFavorites(new Set());
    } else {
      setSelectedFavorites(new Set(favorites.map(f => f.id)));
    }
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  // 导航项配置
  const navigationItems = [
    { id: 'profile', label: '个人资料', icon: 'bi-person' },
    { id: 'account', label: '账户安全', icon: 'bi-shield-lock' },
    { id: 'favorites', label: '收藏管理', icon: 'bi-heart' },
    { id: 'integrations', label: '集成服务', icon: 'bi-puzzle' },
    { id: 'data', label: '数据管理', icon: 'bi-database' }
  ];

  // 处理表单提交
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        toast.success('个人资料已更新');
      } else {
        const error = await response.json();
        toast.error(error.error || '保存失败，请重试');
      }
    } catch {
      toast.error('保存失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('新密码和确认密码不匹配');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('密码至少需要8个字符');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (response.ok) {
        toast.success('密码已更新');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const error = await response.json();
        toast.error(error.error || '密码更新失败，请重试');
      }
    } catch {
      toast.error('密码更新失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理数据导出
  const handleExportData = async (format: 'json' | 'csv' | 'markdown') => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/settings/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ format }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '导出失败');
      }

      // 获取文件名
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `promptvault-export-${new Date().toISOString().split('T')[0]}.${format}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`数据已导出为 ${format.toUpperCase()} 格式`);
    } catch (error) {
      console.error('导出失败:', error);
      toast.error(error instanceof Error ? error.message : '导出失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理数据导入
  const handleImportData = async (file: File) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/settings/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('导入失败');
      }

      const result = await response.json();
      toast.success(`成功导入 ${result.imported} 条数据`);
    } catch {
      toast.error('导入失败，请检查文件格式');
    } finally {
      setIsLoading(false);
    }
  };

  // 危险区域功能
  const handleClearHistory = async () => {
    if (!confirm('确定要清除所有提示词历史吗？此操作不可逆！')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/settings/clear-history', {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('所有提示词历史已清除');
      } else {
        const error = await response.json();
        toast.error(error.error || '清除失败');
      }
    } catch (error) {
      console.error('清除历史失败:', error);
      toast.error('清除失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSettings = async () => {
    if (!confirm('确定要重置所有设置为默认值吗？此操作不可逆！')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/settings/reset-settings', {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('所有设置已重置为默认值');
        // 重新加载用户数据
        await loadUserData();
      } else {
        const error = await response.json();
        toast.error(error.error || '重置失败');
      }
    } catch (error) {
      console.error('重置设置失败:', error);
      toast.error('重置失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async (password: string) => {
    if (!password) {
      toast.error('请输入密码确认删除操作');
      return;
    }

    if (!confirm('确定要删除账户吗？所有数据将被永久删除，此操作不可逆！')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/settings/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        toast.success('账户已删除');
        // 重定向到登录页面或首页
        window.location.href = '/login';
      } else {
        const error = await response.json();
        toast.error(error.error || '删除失败');
      }
    } catch (error) {
      console.error('删除账户失败:', error);
      toast.error('删除失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* 导航栏 */}
        <Header />
        
        {/* 页面标题 */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">设置</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">管理您的账户和集成服务</p>
          </div>
        </div>

        {/* 主要内容 */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* 左侧导航 */}
            <div className="md:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sticky top-8">
                <nav className="space-y-1" aria-label="设置导航">
                  {navigationItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        activeSection === item.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <i className={`bi ${item.icon} mr-3 ${
                        activeSection === item.id ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'
                      }`}></i>
                      {item.label}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* 右侧内容 */}
            <div className="md:col-span-3 space-y-6">
              {/* 个人资料设置 */}
              {activeSection === 'profile' && (
                <ProfileSection
                  data={profileData}
                  setData={setProfileData}
                  onSubmit={handleProfileSubmit}
                  isLoading={isLoading}
                  avatarInputRef={avatarInputRef}
                />
              )}

              {/* 账户安全设置 */}
              {activeSection === 'account' && (
                <AccountSection
                  data={passwordData}
                  setData={setPasswordData}
                  onSubmit={handlePasswordSubmit}
                  isLoading={isLoading}
                />
              )}

              {/* 收藏管理 */}
              {activeSection === 'favorites' && (
                <FavoritesSection
                  favorites={favorites}
                  selectedFavorites={selectedFavorites}
                  onSelectFavorite={handleSelectFavorite}
                  onSelectAll={handleSelectAllFavorites}
                  onRemoveFavorites={handleRemoveFavorites}
                  isLoading={isLoading}
                />
              )}

              {/* 集成服务 */}
              {activeSection === 'integrations' && (
                <IntegrationSection
                  data={integrationData}
                  setData={setIntegrationData}
                  onSave={handleSaveIntegrations}
                  isLoading={isLoading}
                />
              )}

              {/* 数据管理 */}
              {activeSection === 'data' && (
                <DataManagementSection
                  onExport={handleExportData}
                  onImport={handleImportData}
                  onClearHistory={handleClearHistory}
                  onResetSettings={handleResetSettings}
                  onDeleteAccount={handleDeleteAccount}
                  isLoading={isLoading}
                  fileInputRef={fileInputRef}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

// 个人资料设置组件
function ProfileSection({ data, setData, onSubmit, isLoading, avatarInputRef }: ProfileSectionProps) {
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center mb-6">
        <i className="bi bi-person text-xl text-blue-500 mr-3"></i>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">个人资料</h2>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-start">
          {/* 头像上传 */}
          <div className="flex flex-col items-center">
            <div className="relative mb-3">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="w-20 h-20 rounded-full object-cover border-2 border-blue-500"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500 flex items-center justify-center">
                  <i className="bi bi-person-circle text-4xl text-blue-500"></i>
                </div>
              )}
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-1 shadow-lg border-2 border-white dark:border-gray-800"
              >
                <i className="bi bi-pencil text-xs"></i>
              </button>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleAvatarChange}
            />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              更换头像
            </button>
          </div>

          {/* 个人信息表单 */}
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  显示名称
                </label>
                <input
                  type="text"
                  value={data.displayName}
                  onChange={(e) => setData({ ...data, displayName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  用户名
                </label>
                <input
                  type="text"
                  value={data.username}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">用户名不可更改</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                邮箱地址
              </label>
              <input
                type="email"
                value={data.email}
                onChange={(e) => setData({ ...data, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                个人简介
              </label>
              <textarea
                rows={3}
                value={data.bio}
                onChange={(e) => setData({ ...data, bio: e.target.value })}
                placeholder="介绍一下自己..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <i className="bi bi-arrow-clockwise animate-spin mr-2"></i>
                保存中...
              </>
            ) : (
              <>
                <i className="bi bi-check-lg mr-2"></i>
                保存资料
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}

// 账户安全设置组件
function AccountSection({ data, setData, onSubmit, isLoading }: AccountSectionProps) {
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center mb-6">
        <i className="bi bi-shield-lock text-xl text-blue-500 mr-3"></i>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">账户安全</h2>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            当前密码
          </label>
          <div className="relative">
            <input
              type={showPasswords.current ? 'text' : 'password'}
              value={data.currentPassword}
              onChange={(e) => setData({ ...data, currentPassword: e.target.value })}
              placeholder="输入当前密码"
              className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('current')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400"
            >
              <i className={`bi ${showPasswords.current ? 'bi-eye-slash' : 'bi-eye'}`}></i>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              新密码
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                value={data.newPassword}
                onChange={(e) => setData({ ...data, newPassword: e.target.value })}
                placeholder="设置新密码"
                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400"
              >
                <i className={`bi ${showPasswords.new ? 'bi-eye-slash' : 'bi-eye'}`}></i>
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              确认新密码
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                value={data.confirmPassword}
                onChange={(e) => setData({ ...data, confirmPassword: e.target.value })}
                placeholder="再次输入新密码"
                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400"
              >
                <i className={`bi ${showPasswords.confirm ? 'bi-eye-slash' : 'bi-eye'}`}></i>
              </button>
            </div>
          </div>
        </div>

        {/* 密码安全提示 */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm text-blue-800 dark:text-blue-300 flex items-start">
          <i className="bi bi-info-circle mr-2 mt-0.5"></i>
          <div>
            <p>密码安全提示：</p>
            <ul className="list-disc ml-5 mt-1 space-y-1">
              <li>至少包含8个字符</li>
              <li>包含大写字母、小写字母和数字</li>
              <li>建议使用特殊字符(!@#$%^&*)</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <i className="bi bi-arrow-clockwise animate-spin mr-2"></i>
                更新中...
              </>
            ) : (
              <>
                <i className="bi bi-key mr-2"></i>
                更新密码
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}

// 集成服务组件
function IntegrationSection({ data, setData, onSave, isLoading }: IntegrationSectionProps) {
  const [showApiKey, setShowApiKey] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('已复制到剪贴板');
  };

  return (
    <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center mb-6">
        <i className="bi bi-puzzle text-xl text-blue-500 mr-3"></i>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">集成服务</h2>
      </div>

      <div className="space-y-6">
        {/* OpenAI API 设置 */}
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-base font-medium text-gray-900 dark:text-white">OpenAI API</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">连接您的OpenAI账户或类似兼容服务</p>
            </div>
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full">
              <i className="bi bi-check-circle mr-1"></i>已连接
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                API Base URL
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={data.apiBaseUrl}
                  onChange={(e) => setData({ ...data, apiBaseUrl: e.target.value })}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(data.apiBaseUrl)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <i className="bi bi-clipboard"></i>
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                适用于 OpenAI 和兼容 OpenAI 格式的其他服务，如 Azure OpenAI
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                API密钥
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={data.apiKey || 'sk-•••••••••••••••••••••••••••••••'}
                  onChange={(e) => setData({ ...data, apiKey: e.target.value })}
                  className="w-full px-3 py-2 pr-20 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex space-x-1">
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-gray-500 dark:text-gray-400 p-1 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    <i className={`bi ${showApiKey ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(data.apiKey)}
                    className="text-gray-500 dark:text-gray-400 p-1 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    <i className="bi bi-clipboard"></i>
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                  获取OpenAI API密钥
                </a>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                默认模型
              </label>
              <select
                value={data.apiModel}
                onChange={(e) => setData({ ...data, apiModel: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="gpt-4-turbo">gpt-4-turbo</option>
                <option value="gpt-4">gpt-4</option>
                <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                <option value="other">其他...</option>
              </select>
            </div>
          </div>
        </div>

        {/* 其他集成服务 */}
        <div className="space-y-4">
          {[
            { name: 'Anthropic Claude', description: '连接Claude API' },
            { name: 'Google Gemini', description: '连接Gemini API' }
          ].map((service) => (
            <div key={service.name} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-medium text-gray-900 dark:text-white">{service.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{service.description}</p>
                </div>
                <button className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-700 border border-blue-200 dark:border-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-gray-600">
                  <i className="bi bi-plus-circle mr-1"></i>连接
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 flex justify-end">
          <button
            onClick={onSave}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <i className="bi bi-arrow-clockwise animate-spin mr-2"></i>
                保存中...
              </>
            ) : (
              <>
                <i className="bi bi-check-lg mr-2"></i>
                保存集成设置
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}

// 数据管理组件
function DataManagementSection({ onExport, onImport, onClearHistory, onResetSettings, onDeleteAccount, isLoading, fileInputRef }: DataManagementSectionProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
    }
  };

  const handleDeleteAccountClick = () => {
    if (deletePassword.trim()) {
      onDeleteAccount(deletePassword);
      setDeletePassword('');
      setShowDeleteConfirm(false);
    }
  };

  return (
    <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center mb-6">
        <i className="bi bi-database text-xl text-blue-500 mr-3"></i>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">数据管理</h2>
      </div>

      <div className="space-y-6">
        {/* 导出和导入 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">导出数据</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">导出您的所有提示词和设置</p>
            <div className="space-y-2">
              <button
                onClick={() => onExport('json')}
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-700 border border-blue-200 dark:border-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="bi bi-download mr-2"></i>导出为 JSON
              </button>
              <button
                onClick={() => onExport('csv')}
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-700 border border-blue-200 dark:border-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="bi bi-download mr-2"></i>导出为 CSV
              </button>
              <button
                onClick={() => onExport('markdown')}
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-700 border border-blue-200 dark:border-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="bi bi-download mr-2"></i>导出为 Markdown
              </button>
            </div>
          </div>

          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">导入数据</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">从文件导入提示词和设置</p>
            <label className="w-full inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-700 border border-blue-200 dark:border-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-gray-600 cursor-pointer">
              <i className="bi bi-upload mr-2"></i>选择文件
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".json,.csv,.md"
                onChange={handleFileChange}
              />
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              支持 JSON、CSV 和 Markdown 格式
            </p>
          </div>
        </div>

        {/* 危险区域 */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
            <h3 className="text-base font-medium text-red-800 dark:text-red-400">危险区域</h3>
            <p className="text-sm text-red-600 dark:text-red-300 mt-1">这些操作不可逆，请谨慎操作</p>

            <div className="mt-4 space-y-3">
              <button 
                onClick={onClearHistory}
                disabled={isLoading}
                className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="bi bi-trash mr-2"></i>清除所有提示词历史
              </button>
              <button 
                onClick={onResetSettings}
                disabled={isLoading}
                className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="bi bi-trash mr-2"></i>重置所有设置
              </button>
              
              {/* 删除账户 */}
              <div className="space-y-2">
                <button 
                  onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                  disabled={isLoading}
                  className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="bi bi-exclamation-triangle mr-2"></i>删除账户
                </button>
                
                {showDeleteConfirm && (
                  <div className="mt-2 p-3 bg-red-100 dark:bg-red-900/30 rounded-md">
                    <p className="text-xs text-red-700 dark:text-red-300 mb-2">
                      请输入密码确认删除账户：
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        placeholder="输入密码"
                        className="flex-1 px-2 py-1 text-xs border border-red-300 dark:border-red-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <button
                        onClick={handleDeleteAccountClick}
                        disabled={!deletePassword.trim() || isLoading}
                        className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        确认删除
                      </button>
                      <button
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeletePassword('');
                        }}
                        className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// 收藏管理组件
function FavoritesSection({ favorites, selectedFavorites, onSelectFavorite, onSelectAll, onRemoveFavorites, isLoading }: FavoritesSectionProps) {
  const router = useRouter();
  
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

  const handleCardClick = (favoriteId: string) => {
    router.push(`/prompts/${favoriteId}`);
  };

  return (
    <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <i className="bi bi-heart text-xl text-red-500 mr-3"></i>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">收藏管理</h2>
          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">({favorites.length} 个收藏)</span>
        </div>
        
        {favorites.length > 0 && (
          <div className="flex items-center space-x-3">
            <button
              onClick={onSelectAll}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              {selectedFavorites.size === favorites.length ? '取消全选' : '全选'}
            </button>
            
            {selectedFavorites.size > 0 && (
              <button
                onClick={onRemoveFavorites}
                disabled={isLoading}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-600 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <i className="bi bi-arrow-clockwise animate-spin mr-1"></i>
                    处理中...
                  </>
                ) : (
                  <>
                    <i className="bi bi-heart-break mr-1"></i>
                    取消收藏 ({selectedFavorites.size})
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-12">
          <i className="bi bi-heart text-6xl text-gray-400 mb-4"></i>
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-2">暂无收藏的提示词</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            在提示词列表中点击心形图标来收藏您喜欢的提示词
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {favorites.map((favorite) => (
            <div
              key={favorite.id}
              onClick={() => handleCardClick(favorite.id)}
              className={`border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-all cursor-pointer ${
                selectedFavorites.has(favorite.id) 
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-600' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={selectedFavorites.has(favorite.id)}
                  onChange={() => onSelectFavorite(favorite.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-base font-medium text-gray-900 dark:text-white truncate">
                        {favorite.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {favorite.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${getCategoryColor(favorite.categoryId)}`}>
                        {favorite.category}
                      </span>
                      
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <i
                            key={star}
                            className={`bi bi-star${star <= favorite.rating ? '-fill' : ''} text-xs ${
                              star <= favorite.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
                            }`}
                          ></i>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 text-xs text-gray-500 dark:text-gray-400">
                    <span>创建于 {new Date(favorite.createdAt).toLocaleDateString('zh-CN')}</span>
                    <span>更新于 {new Date(favorite.updatedAt).toLocaleDateString('zh-CN')}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {favorites.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            <i className="bi bi-info-circle mr-1"></i>
            提示：您可以在提示词详情页面或列表页面重新收藏已取消的提示词
          </p>
        </div>
      )}
    </section>
  );
} 