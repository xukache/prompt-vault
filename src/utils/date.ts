/**
 * 时间格式化工具函数
 * 统一使用北京时间（UTC+8）
 * 解决Next.js服务器端和客户端时间不一致问题
 */

// 检测是否在客户端环境
const isClient = typeof window !== 'undefined';

/**
 * 将任意时间转换为北京时间的Date对象
 * @param date 输入的日期
 * @returns 北京时间的Date对象
 */
const toBeijingTime = (date: string | Date): Date => {
  let dateObj: Date;
  
  if (typeof date === 'string') {
    // 处理 "YYYY-MM-DD HH:mm:ss" 格式（假设为UTC时间）
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(date)) {
      // 将格式转换为ISO格式，添加Z表示UTC时间
      const isoString = date.replace(' ', 'T') + 'Z';
      dateObj = new Date(isoString);
    } else {
      dateObj = new Date(date);
    }
  } else {
    dateObj = new Date(date);
  }
  
  // 获取UTC时间戳
  const utcTime = dateObj.getTime() + (dateObj.getTimezoneOffset() * 60000);
  
  // 北京时间 = UTC + 8小时
  const beijingTime = new Date(utcTime + (8 * 3600000));
  
  return beijingTime;
};

/**
 * 格式化为完整的日期时间
 * @param date 日期字符串或Date对象
 * @returns 格式化后的日期时间字符串，如：2025/1/24 18:35:18
 */
export const formatDateTime = (date: string | Date | undefined): string => {
  if (!date) return '未知时间';
  
  try {
    const beijingDate = toBeijingTime(date);
    
    // 检查日期是否有效
    if (isNaN(beijingDate.getTime())) return '无效日期';
    
    const year = beijingDate.getFullYear();
    const month = beijingDate.getMonth() + 1;
    const day = beijingDate.getDate();
    const hours = beijingDate.getHours().toString().padStart(2, '0');
    const minutes = beijingDate.getMinutes().toString().padStart(2, '0');
    const seconds = beijingDate.getSeconds().toString().padStart(2, '0');
    
    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error('日期格式化错误:', error);
    return '格式错误';
  }
};

/**
 * 格式化为日期（不包含时间）
 * @param date 日期字符串或Date对象
 * @returns 格式化后的日期字符串，如：2025年1月24日
 */
export const formatDate = (date: string | Date | undefined): string => {
  if (!date) return '未知时间';
  
  try {
    const beijingDate = toBeijingTime(date);
    
    // 检查日期是否有效
    if (isNaN(beijingDate.getTime())) return '无效日期';
    
    const year = beijingDate.getFullYear();
    const month = beijingDate.getMonth() + 1;
    const day = beijingDate.getDate();
    
    return `${year}年${month}月${day}日`;
  } catch (error) {
    console.error('日期格式化错误:', error);
    return '格式错误';
  }
};

/**
 * 格式化为简短日期
 * @param date 日期字符串或Date对象
 * @returns 格式化后的简短日期字符串，如：1月24日
 */
export const formatShortDate = (date: string | Date | undefined): string => {
  if (!date) return '未知时间';
  
  try {
    const beijingDate = toBeijingTime(date);
    
    // 检查日期是否有效
    if (isNaN(beijingDate.getTime())) return '无效日期';
    
    const month = beijingDate.getMonth() + 1;
    const day = beijingDate.getDate();
    
    return `${month}月${day}日`;
  } catch (error) {
    console.error('日期格式化错误:', error);
    return '格式错误';
  }
};

/**
 * 格式化为相对时间
 * @param date 日期字符串或Date对象
 * @returns 相对时间字符串，如：2天前更新、3小时前、刚刚
 */
export const formatRelativeTime = (date: string | Date | undefined): string => {
  if (!date) return '未知时间';
  
  try {
    // 使用toBeijingTime进行时区转换
    const beijingDate = toBeijingTime(date);
    
    // 检查日期是否有效
    if (isNaN(beijingDate.getTime())) return '无效日期';
    
    // 获取当前北京时间
    const beijingNow = toBeijingTime(new Date());
    
    // 计算时间差（毫秒）
    const diffTime = Math.abs(beijingNow.getTime() - beijingDate.getTime());
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    
    if (diffMinutes < 1) return '刚刚';
    if (diffMinutes < 60) return `${diffMinutes}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays === 1) return '1天前更新';
    if (diffDays < 7) return `${diffDays}天前更新`;
    if (diffWeeks < 4) return `${diffWeeks}周前更新`;
    if (diffMonths < 12) return `${diffMonths}个月前`;
    
    // 超过一年的显示具体日期
    return formatShortDate(beijingDate);
  } catch (error) {
    console.error('相对时间格式化错误:', error);
    return '格式错误';
  }
};

/**
 * 格式化为ISO字符串
 * @param date 日期字符串或Date对象
 * @returns ISO格式的日期时间字符串
 */
export const formatISOString = (date: string | Date | undefined): string => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
    
    // 检查日期是否有效
    if (isNaN(dateObj.getTime())) return '';
    
    return dateObj.toISOString();
  } catch (error) {
    console.error('ISO日期格式化错误:', error);
    return '';
  }
};

/**
 * 检查日期是否为今天（北京时间）
 * @param date 日期字符串或Date对象
 * @returns 是否为今天
 */
export const isToday = (date: string | Date | undefined): boolean => {
  if (!date) return false;
  
  try {
    const beijingDate = toBeijingTime(date);
    const beijingNow = toBeijingTime(new Date());
    
    // 检查日期是否有效
    if (isNaN(beijingDate.getTime())) return false;
    
    return (
      beijingDate.getFullYear() === beijingNow.getFullYear() &&
      beijingDate.getMonth() === beijingNow.getMonth() &&
      beijingDate.getDate() === beijingNow.getDate()
    );
  } catch (error) {
    console.error('日期比较错误:', error);
    return false;
  }
};

/**
 * 检查日期是否为昨天（北京时间）
 * @param date 日期字符串或Date对象
 * @returns 是否为昨天
 */
export const isYesterday = (date: string | Date | undefined): boolean => {
  if (!date) return false;
  
  try {
    const beijingDate = toBeijingTime(date);
    const beijingNow = toBeijingTime(new Date());
    
    // 检查日期是否有效
    if (isNaN(beijingDate.getTime())) return false;
    
    // 获取昨天的日期
    const yesterday = new Date(beijingNow);
    yesterday.setDate(yesterday.getDate() - 1);
    
    return (
      beijingDate.getFullYear() === yesterday.getFullYear() &&
      beijingDate.getMonth() === yesterday.getMonth() &&
      beijingDate.getDate() === yesterday.getDate()
    );
  } catch (error) {
    console.error('日期比较错误:', error);
    return false;
  }
};

/**
 * 客户端安全的时间格式化函数
 * 避免服务器端和客户端渲染不一致的问题
 */
export const formatDateTimeClient = (date: string | Date | undefined): string => {
  if (!isClient) {
    // 在服务器端返回一个占位符，避免hydration mismatch
    return '加载中...';
  }
  
  return formatDateTime(date);
}; 