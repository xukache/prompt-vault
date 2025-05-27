import { NextResponse } from "next/server";
import { getDbConnection } from "@/lib/db/sqlite";

// 获取所有标签
export async function GET() {
  try {
    const db = await getDbConnection();
    const tags = await db.prepare('SELECT * FROM tags ORDER BY usage_count DESC, name ASC').all();
    
    return NextResponse.json(tags);
  } catch (error) {
    console.error('获取标签失败:', error);
    return NextResponse.json(
      { error: '获取标签失败' },
      { status: 500 }
    );
  }
}

// 创建标签
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, color } = body;

    // 验证必填字段
    if (!name) {
      return NextResponse.json(
        { error: '标签名称为必填项' },
        { status: 400 }
      );
    }

    const db = await getDbConnection();
    const id = `tag-${Date.now()}`;
    const now = new Date().toISOString();

    await db.prepare(`
      INSERT INTO tags (id, name, description, color, usage_count, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      id, 
      name, 
      description || null, 
      color || '#10B981', 
      0, 
      now
    );

    // 获取创建的标签
    const tag = await db.prepare('SELECT * FROM tags WHERE id = ?').get(id);

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.error('创建标签失败:', error);
    return NextResponse.json(
      { error: '创建标签失败' },
      { status: 500 }
    );
  }
} 