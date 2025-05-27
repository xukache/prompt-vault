"use client";

import React, { useState } from 'react';
import * as XLSX from 'xlsx';

interface ImportKnowledgeModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface ImportData {
  title: string;
  content: string;
  type: string;
  description?: string;
  tags?: string;
}

export const ImportKnowledgeModal: React.FC<ImportKnowledgeModalProps> = ({
  onClose,
  onSuccess
}) => {
  const [importType, setImportType] = useState<'json' | 'excel' | 'text'>('json');
  const [file, setFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<ImportData[]>([]);

  const typeOptions = [
    { value: 'domain', label: '领域知识' },
    { value: 'template', label: '格式模板' },
    { value: 'practice', label: '最佳实践' },
    { value: 'reference', label: '参考资料' }
  ];

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  };

  // 解析文件内容
  const parseFile = async (file: File) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target?.result;
      
      try {
        if (importType === 'json') {
          const data = JSON.parse(content as string);
          if (Array.isArray(data)) {
            setPreview(data);
          } else {
            setPreview([data]);
          }
        } else if (importType === 'excel') {
          // 使用xlsx库解析Excel文件
          const workbook = XLSX.read(content, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // 将工作表转换为JSON数组
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
          
          if (jsonData.length < 2) {
            throw new Error('Excel文件格式错误：至少需要标题行和一行数据');
          }
          
          const headers = jsonData[0].map(h => h?.toString().trim() || '');
          const data: ImportData[] = [];
          
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || row.length === 0) continue;
            
            const item: ImportData = {
              title: row[headers.indexOf('title')]?.toString() || `导入项目 ${i}`,
              content: row[headers.indexOf('content')]?.toString() || '',
              type: row[headers.indexOf('type')]?.toString() || 'domain',
              description: row[headers.indexOf('description')]?.toString() || '',
              tags: row[headers.indexOf('tags')]?.toString() || ''
            };
            data.push(item);
          }
          setPreview(data);
        }
      } catch (error) {
        console.error('解析文件失败:', error);
        alert('文件格式错误，请检查文件内容');
      }
    };
    
    // 根据文件类型选择不同的读取方式
    if (importType === 'excel') {
      reader.readAsBinaryString(file);
    } else {
      reader.readAsText(file);
    }
  };

  // 处理文本导入
  const handleTextImport = () => {
    if (!textContent.trim()) return;
    
    // 简单的文本分割逻辑
    const sections = textContent.split('\n\n').filter(section => section.trim());
    const data: ImportData[] = sections.map((section, index) => {
      const lines = section.split('\n');
      const title = lines[0] || `导入项目 ${index + 1}`;
      const content = lines.slice(1).join('\n') || section;
      
      return {
        title: title.replace(/^#+\s*/, ''), // 移除markdown标题符号
        content,
        type: 'domain',
        description: '',
        tags: ''
      };
    });
    
    setPreview(data);
  };

  // 执行导入
  const handleImport = async () => {
    if (preview.length === 0) {
      alert('没有可导入的数据');
      return;
    }

    setLoading(true);
    try {
      const results = await Promise.allSettled(
        preview.map(item => 
          fetch('/api/knowledge', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(item)
          })
        )
      );

      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.length - successful;

      if (failed > 0) {
        alert(`导入完成！成功：${successful} 条，失败：${failed} 条`);
      } else {
        alert(`导入成功！共导入 ${successful} 条知识库条目`);
      }

      onSuccess();
    } catch (error) {
      console.error('导入失败:', error);
      alert('导入失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            导入知识库条目
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-6">
          {/* 导入类型选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              导入方式
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="json"
                  checked={importType === 'json'}
                  onChange={(e) => setImportType(e.target.value as 'json')}
                  className="mr-2"
                />
                JSON 文件
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="excel"
                  checked={importType === 'excel'}
                  onChange={(e) => setImportType(e.target.value as 'excel')}
                  className="mr-2"
                />
                Excel 文件
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="text"
                  checked={importType === 'text'}
                  onChange={(e) => setImportType(e.target.value as 'text')}
                  className="mr-2"
                />
                文本内容
              </label>
            </div>
          </div>

          {/* 文件上传或文本输入 */}
          {importType !== 'text' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                选择文件
              </label>
              <input
                type="file"
                accept={importType === 'json' ? '.json' : '.xlsx,.xls'}
                onChange={handleFileChange}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {importType === 'json' 
                  ? '支持包含 title, content, type, description, tags 字段的 JSON 文件'
                  : '支持包含 title, content, type, description, tags 列的 Excel 文件 (.xlsx, .xls)'
                }
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                粘贴文本内容
              </label>
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="粘贴要导入的文本内容，每个段落（用空行分隔）将作为一个知识库条目..."
                rows={8}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
              <button
                onClick={handleTextImport}
                className="mt-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors"
              >
                解析文本
              </button>
            </div>
          )}

          {/* 预览区域 */}
          {preview.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                预览 ({preview.length} 条记录)
              </h4>
              <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                {preview.map((item, index) => (
                  <div key={index} className="p-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                    <div className="flex items-center justify-between mb-1">
                      <h5 className="font-medium text-gray-900 dark:text-white">
                        {item.title}
                      </h5>
                      <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                        {typeOptions.find(t => t.value === item.type)?.label || item.type}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        {item.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {item.content.substring(0, 100)}...
                    </p>
                    {item.tags && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.tags.split(',').map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="text-xs px-1 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-dark-600 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleImport}
            disabled={loading || preview.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 rounded-md transition-colors"
          >
            {loading ? '导入中...' : `导入 ${preview.length} 条记录`}
          </button>
        </div>
      </div>
    </div>
  );
}; 