import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db/sqlite';
import { requireAuth } from '@/lib/auth/server-cookies';

export async function GET() {
  try {
    // 验证用户身份
    const userId = await requireAuth();
    
    const db = await getDbConnection();

    // 获取总提示词数 - 添加用户隔离
    const totalPromptsResult = db.prepare('SELECT COUNT(*) as count FROM prompts WHERE user_id = ?').get(userId) as { count: number };
    const totalPrompts = totalPromptsResult.count;

    // 获取分类数量 - 添加用户隔离
    const categoriesResult = db.prepare('SELECT COUNT(DISTINCT category_id) as count FROM prompts WHERE category_id IS NOT NULL AND user_id = ?').get(userId) as { count: number };
    const totalCategories = categoriesResult.count;

    // 获取收藏数量 - 添加用户隔离
    const favoritesResult = db.prepare('SELECT COUNT(*) as count FROM prompts WHERE is_favorite = 1 AND user_id = ?').get(userId) as { count: number };
    const totalFavorites = favoritesResult.count;

    // 获取本月新增提示词数量 - 添加用户隔离
    const thisMonthResult = db.prepare(`
      SELECT COUNT(*) as count 
      FROM prompts 
      WHERE created_at >= date('now', 'start of month') AND user_id = ?
    `).get(userId) as { count: number };
    const thisMonthPrompts = thisMonthResult.count;

    // 获取本月新增收藏数量（假设收藏时间等于更新时间） - 添加用户隔离
    const thisMonthFavoritesResult = db.prepare(`
      SELECT COUNT(*) as count 
      FROM prompts 
      WHERE is_favorite = 1 AND updated_at >= date('now', 'start of month') AND user_id = ?
    `).get(userId) as { count: number };
    const thisMonthFavorites = thisMonthFavoritesResult.count;

    // 获取最近使用的提示词（按更新时间排序，包含分类信息） - 添加用户隔离
    const recentPromptsResult = db.prepare(`
      SELECT 
        p.id, 
        p.title, 
        p.description, 
        p.category_id, 
        p.updated_at, 
        p.rating,
        c.name as category_name
      FROM prompts p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.user_id = ?
      ORDER BY p.updated_at DESC 
      LIMIT 6
    `).all(userId) as Array<{
      id: string;
      title: string;
      description: string | null;
      category_id: string | null;
      updated_at: string;
      rating: number | null;
      category_name: string | null;
    }>;

    // 获取最近活动（最近更新的提示词） - 添加用户隔离
    const recentActivitiesResult = db.prepare(`
      SELECT title, updated_at, created_at
      FROM prompts 
      WHERE user_id = ?
      ORDER BY updated_at DESC 
      LIMIT 5
    `).all(userId) as Array<{
      title: string;
      updated_at: string;
      created_at: string;
    }>;

    // 格式化最近活动
    const recentActivities = recentActivitiesResult.map(activity => {
      const updatedAt = new Date(activity.updated_at);
      const createdAt = new Date(activity.created_at);
      
      // 判断是创建还是更新（1分钟内认为是新创建）
      const isNewlyCreated = Math.abs(updatedAt.getTime() - createdAt.getTime()) < 60000;

      return {
        type: isNewlyCreated ? 'create' : 'update',
        title: activity.title,
        updatedAt: activity.updated_at // 返回原始时间，让客户端格式化
      };
    });

    // 格式化最近使用的提示词
    const recentPrompts = recentPromptsResult.map(prompt => ({
      id: prompt.id,
      title: prompt.title,
      description: prompt.description || '暂无描述',
      category: prompt.category_name || '未分类',
      categoryId: prompt.category_id,
      rating: prompt.rating || 0,
      updatedAt: prompt.updated_at
    }));

    const stats = {
      totalPrompts,
      totalCategories,
      totalFavorites,
      thisMonthPrompts,
      thisMonthFavorites,
      recentPrompts,
      recentActivities
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('获取仪表盘统计数据失败:', error);
    return NextResponse.json(
      { error: '获取统计数据失败' },
      { status: 500 }
    );
  }
} 