"use client";

import React, { useState } from 'react';
import { Header } from '@/components/layout/header';
import { KnowledgeBaseTab } from '@/components/features/knowledge/knowledge-base-tab';
import { KnowledgeCategoriesTab } from '@/components/features/knowledge/knowledge-categories-tab';
import { KnowledgeTagsTab } from '@/components/features/knowledge/knowledge-tags-tab';

type TabType = 'knowledge-base' | 'knowledge-categories' | 'knowledge-tags';

export default function KnowledgePage() {
  const [activeTab, setActiveTab] = useState<TabType>('knowledge-base');

  const tabs = [
    { id: 'knowledge-base', label: '知识库' },
    { id: 'knowledge-categories', label: '知识库分类' },
    { id: 'knowledge-tags', label: '知识库标签' }
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      <Header />
      
      <main className="container mx-auto py-8 px-4">
        {/* 页面标题和选项卡 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
            知识库管理
          </h1>

          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex overflow-x-auto" aria-label="选项卡">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    px-4 py-3 mr-4 font-medium text-sm border-b-2 transition-all duration-200
                    ${activeTab === tab.id
                      ? 'text-primary-600 dark:text-primary-400 border-primary-600 dark:border-primary-400'
                      : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-primary-600 dark:hover:text-primary-400'
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* 选项卡内容 */}
        <div className="tab-content">
          {activeTab === 'knowledge-base' && <KnowledgeBaseTab />}
          {activeTab === 'knowledge-categories' && <KnowledgeCategoriesTab />}
          {activeTab === 'knowledge-tags' && <KnowledgeTagsTab />}
        </div>
      </main>
    </div>
  );
} 