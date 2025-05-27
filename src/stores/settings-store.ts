"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UserSettings } from "@/types";

interface SettingsState extends UserSettings {
  updateTheme: (theme: 'light' | 'dark' | 'system') => void;
  updateLanguage: (language: 'zh-CN' | 'en-US') => void;
  updateEditorSettings: (settings: Partial<UserSettings['editor']>) => void;
  updateSearchSettings: (settings: Partial<UserSettings['search']>) => void;
  resetSettings: () => void;
}

// 默认设置
const defaultSettings: UserSettings = {
  theme: 'system',
  language: 'zh-CN',
  editor: {
    fontSize: 16,
    tabSize: 2,
    wordWrap: true,
    autoSave: true,
  },
  search: {
    enableSemanticSearch: true,
    maxResults: 20,
  },
};

// 创建设置状态存储
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,
      
      updateTheme: (theme) => set({ theme }),
      
      updateLanguage: (language) => set({ language }),
      
      updateEditorSettings: (settings) => 
        set((state) => ({ 
          editor: { ...state.editor, ...settings } 
        })),
      
      updateSearchSettings: (settings) => 
        set((state) => ({ 
          search: { ...state.search, ...settings } 
        })),
      
      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'user-settings',
    }
  )
); 