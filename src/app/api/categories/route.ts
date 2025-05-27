import { NextResponse } from "next/server";
import { getDbConnection } from "@/lib/db/sqlite";
import { requireAuth } from "@/lib/auth/server-cookies";

// 获取所有分类
export async function GET() {
  try {
    // 验证用户身份
    const userId = await requireAuth();
    
    const db = await getDbConnection();
    const categories = await db.prepare('SELECT * FROM categories WHERE user_id = ? ORDER BY order_index ASC').all(userId);
    
    return NextResponse.json(categories);
  } catch (error) {
    console.error('获取分类失败:', error);
    return NextResponse.json(
      { error: '获取分类失败' },
      { status: 500 }
    );
  }
}

// 创建分类
export async function POST(request: Request) {
  try {
    // 验证用户身份
    const userId = await requireAuth();
    
    const body = await request.json();
    const { name, description, parent_id, color, icon, order_index } = body;

    // 验证必填字段
    if (!name) {
      return NextResponse.json(
        { error: '分类名称为必填项' },
        { status: 400 }
      );
    }

    const db = await getDbConnection();
    const id = `category-${Date.now()}`;
    const now = new Date().toISOString();

    await db.prepare(`
      INSERT INTO categories (id, name, description, parent_id, color, icon, order_index, user_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, 
      name, 
      description || null, 
      parent_id || null, 
      color || '#3B82F6', 
      icon || 'folder', 
      order_index || 0, 
      userId,
      now
    );

    // 获取创建的分类
    const category = await db.prepare('SELECT * FROM categories WHERE id = ? AND user_id = ?').get(id, userId);

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('创建分类失败:', error);
    return NextResponse.json(
      { error: '创建分类失败' },
      { status: 500 }
    );
  }
} 