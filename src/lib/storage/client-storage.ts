"use client";

// 客户端存储工具类
export class ClientStorage {
  private static instance: ClientStorage;
  private dbName = 'PromptVaultDB';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  private constructor() {}

  public static getInstance(): ClientStorage {
    if (!ClientStorage.instance) {
      ClientStorage.instance = new ClientStorage();
    }
    return ClientStorage.instance;
  }

  // 初始化IndexedDB
  public async initIndexedDB(): Promise<void> {
    if (typeof window === 'undefined') return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('IndexedDB初始化失败:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB初始化成功');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // 创建对象存储
        if (!db.objectStoreNames.contains('prompts')) {
          const promptStore = db.createObjectStore('prompts', { keyPath: 'id' });
          promptStore.createIndex('title', 'title', { unique: false });
          promptStore.createIndex('category', 'category', { unique: false });
          promptStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('categories')) {
          const categoryStore = db.createObjectStore('categories', { keyPath: 'id' });
          categoryStore.createIndex('name', 'name', { unique: false });
        }

        if (!db.objectStoreNames.contains('tags')) {
          const tagStore = db.createObjectStore('tags', { keyPath: 'id' });
          tagStore.createIndex('name', 'name', { unique: true });
        }

        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }

        console.log('IndexedDB数据库结构创建完成');
      };
    });
  }

  // LocalStorage操作
  public setLocalStorage<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error('LocalStorage存储失败:', error);
    }
  }

  public getLocalStorage<T>(key: string, defaultValue?: T): T | null {
    if (typeof window === 'undefined') return defaultValue || null;
    
    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue || null;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error('LocalStorage读取失败:', error);
      return defaultValue || null;
    }
  }

  public removeLocalStorage(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  }

  public clearLocalStorage(): void {
    if (typeof window === 'undefined') return;
    localStorage.clear();
  }

  // IndexedDB操作
  public async setIndexedDB<T>(storeName: string, data: T): Promise<void> {
    if (!this.db) await this.initIndexedDB();
    if (!this.db) throw new Error('IndexedDB未初始化');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async getIndexedDB<T>(storeName: string, key: string): Promise<T | null> {
    if (!this.db) await this.initIndexedDB();
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  public async getAllIndexedDB<T>(storeName: string): Promise<T[]> {
    if (!this.db) await this.initIndexedDB();
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };
      request.onerror = () => reject(request.error);
    });
  }

  public async deleteIndexedDB(storeName: string, key: string): Promise<void> {
    if (!this.db) await this.initIndexedDB();
    if (!this.db) throw new Error('IndexedDB未初始化');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async clearIndexedDB(storeName: string): Promise<void> {
    if (!this.db) await this.initIndexedDB();
    if (!this.db) throw new Error('IndexedDB未初始化');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // 缓存操作
  public async setCache<T>(key: string, value: T, ttl?: number): Promise<void> {
    const cacheData = {
      key,
      value,
      timestamp: Date.now(),
      ttl: ttl || 0, // 0表示永不过期
    };

    await this.setIndexedDB('cache', cacheData);
  }

  public async getCache<T>(key: string): Promise<T | null> {
    const cacheData = await this.getIndexedDB<{
      key: string;
      value: T;
      timestamp: number;
      ttl: number;
    }>('cache', key);

    if (!cacheData) return null;

    // 检查是否过期
    if (cacheData.ttl > 0 && Date.now() - cacheData.timestamp > cacheData.ttl) {
      await this.deleteIndexedDB('cache', key);
      return null;
    }

    return cacheData.value;
  }

  public async clearExpiredCache(): Promise<void> {
    const allCache = await this.getAllIndexedDB<{
      key: string;
      value: unknown;
      timestamp: number;
      ttl: number;
    }>('cache');

    const now = Date.now();
    const expiredKeys = allCache
      .filter(item => item.ttl > 0 && now - item.timestamp > item.ttl)
      .map(item => item.key);

    for (const key of expiredKeys) {
      await this.deleteIndexedDB('cache', key);
    }

    console.log(`清理了 ${expiredKeys.length} 个过期缓存项`);
  }

  // 获取存储使用情况
  public async getStorageUsage(): Promise<{
    localStorage: { used: number; available: number };
    indexedDB: { used: number; available: number };
  }> {
    const result = {
      localStorage: { used: 0, available: 0 },
      indexedDB: { used: 0, available: 0 },
    };

    if (typeof window === 'undefined') return result;

    // LocalStorage使用情况
    try {
      let localStorageUsed = 0;
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          localStorageUsed += localStorage[key].length + key.length;
        }
      }
      result.localStorage.used = localStorageUsed;
      result.localStorage.available = 5 * 1024 * 1024 - localStorageUsed; // 假设5MB限制
    } catch (error) {
      console.error('获取LocalStorage使用情况失败:', error);
    }

    // IndexedDB使用情况
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        result.indexedDB.used = estimate.usage || 0;
        result.indexedDB.available = (estimate.quota || 0) - (estimate.usage || 0);
      }
    } catch (error) {
      console.error('获取IndexedDB使用情况失败:', error);
    }

    return result;
  }

  // 清理所有存储
  public async clearAllStorage(): Promise<void> {
    this.clearLocalStorage();
    
    if (this.db) {
      const storeNames = ['prompts', 'categories', 'tags', 'cache'];
      for (const storeName of storeNames) {
        await this.clearIndexedDB(storeName);
      }
    }

    console.log('所有客户端存储已清理');
  }
}

// 导出单例实例
export const clientStorage = ClientStorage.getInstance();

// 用户设置管理
export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'zh-CN' | 'en-US';
  editor: {
    fontSize: number;
    tabSize: number;
    wordWrap: boolean;
    autoSave: boolean;
    autoSaveInterval: number; // 秒
  };
  search: {
    enableSemanticSearch: boolean;
    maxResults: number;
    searchMode: 'fulltext' | 'vector' | 'hybrid';
    showSearchHistory: boolean;
  };
  ui: {
    sidebarCollapsed: boolean;
    defaultView: 'grid' | 'list' | 'kanban';
    showPreview: boolean;
    compactMode: boolean;
  };
  privacy: {
    enableAnalytics: boolean;
    enableCrashReporting: boolean;
    shareUsageData: boolean;
  };
}

export class SettingsManager {
  private static instance: SettingsManager;
  private storage = clientStorage;
  private settingsKey = 'user-settings';

  private defaultSettings: UserSettings = {
    theme: 'system',
    language: 'zh-CN',
    editor: {
      fontSize: 14,
      tabSize: 2,
      wordWrap: true,
      autoSave: true,
      autoSaveInterval: 30,
    },
    search: {
      enableSemanticSearch: true,
      maxResults: 20,
      searchMode: 'hybrid',
      showSearchHistory: true,
    },
    ui: {
      sidebarCollapsed: false,
      defaultView: 'grid',
      showPreview: true,
      compactMode: false,
    },
    privacy: {
      enableAnalytics: false,
      enableCrashReporting: true,
      shareUsageData: false,
    },
  };

  private constructor() {}

  public static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager();
    }
    return SettingsManager.instance;
  }

  public async getSettings(): Promise<UserSettings> {
    const stored = this.storage.getLocalStorage<UserSettings>(this.settingsKey);
    return { ...this.defaultSettings, ...stored };
  }

  public async updateSettings(updates: Partial<UserSettings>): Promise<void> {
    const current = await this.getSettings();
    const updated = { ...current, ...updates };
    this.storage.setLocalStorage(this.settingsKey, updated);
  }

  public async resetSettings(): Promise<void> {
    this.storage.removeLocalStorage(this.settingsKey);
  }

  public async exportSettings(): Promise<string> {
    const settings = await this.getSettings();
    return JSON.stringify(settings, null, 2);
  }

  public async importSettings(settingsJson: string): Promise<void> {
    try {
      const settings = JSON.parse(settingsJson) as UserSettings;
      this.storage.setLocalStorage(this.settingsKey, settings);
    } catch {
      throw new Error('设置导入失败：无效的JSON格式');
    }
  }
}

// 导出设置管理器实例
export const settingsManager = SettingsManager.getInstance();

// 离线数据同步管理
export interface SyncStatus {
  lastSync: string;
  pendingChanges: number;
  isOnline: boolean;
  syncInProgress: boolean;
}

export class OfflineSyncManager {
  private static instance: OfflineSyncManager;
  private storage = clientStorage;
  private syncQueueKey = 'sync-queue';
  private lastSyncKey = 'last-sync';

  private constructor() {
    // 监听网络状态变化
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));
    }
  }

  public static getInstance(): OfflineSyncManager {
    if (!OfflineSyncManager.instance) {
      OfflineSyncManager.instance = new OfflineSyncManager();
    }
    return OfflineSyncManager.instance;
  }

  private handleOnline(): void {
    console.log('网络连接恢复，开始同步数据...');
    this.syncPendingChanges();
  }

  private handleOffline(): void {
    console.log('网络连接断开，进入离线模式');
  }

  public async addToSyncQueue(operation: {
    type: 'create' | 'update' | 'delete';
    entity: 'prompt' | 'category' | 'tag';
    data: unknown;
    timestamp: number;
  }): Promise<void> {
    const queue = this.storage.getLocalStorage<typeof operation[]>(this.syncQueueKey) || [];
    queue.push(operation);
    this.storage.setLocalStorage(this.syncQueueKey, queue);
  }

  public async syncPendingChanges(): Promise<void> {
    if (!navigator.onLine) {
      console.log('离线状态，跳过同步');
      return;
    }

    const queue = this.storage.getLocalStorage<unknown[]>(this.syncQueueKey) || [];
    if (queue.length === 0) {
      console.log('没有待同步的更改');
      return;
    }

    try {
      console.log(`开始同步 ${queue.length} 个待处理更改...`);
      
      // 这里应该调用实际的API同步逻辑
      // 暂时模拟同步过程
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 清空同步队列
      this.storage.removeLocalStorage(this.syncQueueKey);
      this.storage.setLocalStorage(this.lastSyncKey, new Date().toISOString());
      
      console.log('数据同步完成');
    } catch (error) {
      console.error('数据同步失败:', error);
    }
  }

  public async getSyncStatus(): Promise<SyncStatus> {
    const queue = this.storage.getLocalStorage<unknown[]>(this.syncQueueKey) || [];
    const lastSync = this.storage.getLocalStorage<string>(this.lastSyncKey) || '';

    return {
      lastSync,
      pendingChanges: queue.length,
      isOnline: navigator.onLine,
      syncInProgress: false, // 这里应该根据实际同步状态来设置
    };
  }

  public async clearSyncQueue(): Promise<void> {
    this.storage.removeLocalStorage(this.syncQueueKey);
  }
}

// 导出离线同步管理器实例
export const offlineSyncManager = OfflineSyncManager.getInstance(); 