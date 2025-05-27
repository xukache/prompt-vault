'use client';

import { useEffect, useState } from 'react';
import { formatDateTime, formatDate, formatRelativeTime } from '@/utils/date';

interface ClientTimeProps {
  date: string | Date | undefined;
  format?: 'dateTime' | 'date' | 'relative';
  fallback?: string;
  className?: string;
}

/**
 * 客户端时间显示组件
 * 解决Next.js服务器端和客户端时间不一致的问题
 */
export function ClientTime({ 
  date, 
  format = 'dateTime', 
  fallback = '加载中...', 
  className 
}: ClientTimeProps) {
  const [mounted, setMounted] = useState(false);
  const [formattedTime, setFormattedTime] = useState(fallback);

  useEffect(() => {
    setMounted(true);
    
    if (!date) {
      setFormattedTime('未知时间');
      return;
    }

    try {
      let formatted: string;
      
      switch (format) {
        case 'date':
          formatted = formatDate(date);
          break;
        case 'relative':
          formatted = formatRelativeTime(date);
          break;
        case 'dateTime':
        default:
          formatted = formatDateTime(date);
          break;
      }
      
      setFormattedTime(formatted);
    } catch (error) {
      console.error('时间格式化错误:', error);
      setFormattedTime('格式错误');
    }
  }, [date, format]);

  // 在服务器端渲染时显示占位符
  if (!mounted) {
    return <span className={className}>{fallback}</span>;
  }

  return <span className={className}>{formattedTime}</span>;
}

/**
 * 实时更新的时间组件
 * 用于显示需要实时更新的相对时间
 */
interface LiveTimeProps extends Omit<ClientTimeProps, 'format'> {
  updateInterval?: number; // 更新间隔（毫秒）
}

export function LiveTime({ 
  date, 
  updateInterval = 60000, // 默认每分钟更新一次
  fallback = '加载中...', 
  className 
}: LiveTimeProps) {
  const [mounted, setMounted] = useState(false);
  const [formattedTime, setFormattedTime] = useState(fallback);

  useEffect(() => {
    setMounted(true);
    
    const updateTime = () => {
      if (!date) {
        setFormattedTime('未知时间');
        return;
      }

      try {
        const formatted = formatRelativeTime(date);
        setFormattedTime(formatted);
      } catch (error) {
        console.error('时间格式化错误:', error);
        setFormattedTime('格式错误');
      }
    };

    // 立即更新一次
    updateTime();

    // 设置定时更新
    const timer = setInterval(updateTime, updateInterval);

    return () => clearInterval(timer);
  }, [date, updateInterval]);

  // 在服务器端渲染时显示占位符
  if (!mounted) {
    return <span className={className}>{fallback}</span>;
  }

  return <span className={className}>{formattedTime}</span>;
} 