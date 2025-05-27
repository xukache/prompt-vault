import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db/sqlite';
import { requireAuth } from '@/lib/auth/server-cookies';

// GET /api/user/favorites - 获取用户收藏的提示词
export async function GET() {
  try {
    // 验证用户身份
    const userId = await requireAuth();
    
    const db = await getDbConnection();

    // 获取收藏的提示词 - 添加用户隔离
    const favorites = db.prepare(`
      SELECT 
        p.id,
        p.title,
        p.description,
        p.category_id,
        p.rating,
        p.created_at,
        p.updated_at,
        c.name as category_name
      FROM prompts p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_favorite = 1 AND p.user_id = ?
      ORDER BY p.updated_at DESC
    `).all(userId) as Array<{
      id: string;
      title: string;
      description: string | null;
      category_id: string | null;
      rating: number | null;
      created_at: string;
      updated_at: string;
      category_name: string | null;
    }>;

    // 格式化数据
    const formattedFavorites = favorites.map(fav => ({
      id: fav.id,
      title: fav.title,
      description: fav.description || '暂无描述',
      category: fav.category_name || '未分类',
      categoryId: fav.category_id,
      rating: fav.rating || 0,
      createdAt: fav.created_at,
      updatedAt: fav.updated_at
    }));

    return NextResponse.json(formattedFavorites);
  } catch (error) {
    console.error('获取收藏列表失败:', error);
    return NextResponse.json(
      { error: '获取收藏列表失败' },
      { status: 500 }
    );
  }
}

// DELETE /api/user/favorites - 批量取消收藏
export async function DELETE(request: Request) {
  try {
    // 验证用户身份
    const userId = await requireAuth();
    
    const { promptIds } = await request.json();

    if (!Array.isArray(promptIds) || promptIds.length === 0) {
      return NextResponse.json(
        { error: '请提供要取消收藏的提示词ID列表' },
        { status: 400 }
      );
    }

    const db = await getDbConnection();

    // 批量取消收藏 - 添加用户隔离
    const placeholders = promptIds.map(() => '?').join(',');
    db.prepare(`
      UPDATE prompts 
      SET is_favorite = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id IN (${placeholders}) AND user_id = ?
    `).run(...promptIds, userId);

    return NextResponse.json({ 
      message: `已取消收藏 ${promptIds.length} 个提示词`,
      count: promptIds.length
    });
  } catch (error) {
    console.error('取消收藏失败:', error);
    return NextResponse.json(
      { error: '取消收藏失败' },
      { status: 500 }
    );
  }
} 