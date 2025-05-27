import { NextRequest, NextResponse } from "next/server";
import { getDbConnection } from "@/lib/db/sqlite";

// 获取单个标签
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const db = await getDbConnection();
    
    const tag = await db.prepare('SELECT * FROM tags WHERE id = ?').get(params.id);
    
    if (!tag) {
      return NextResponse.json(
        { error: '标签不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(tag);
  } catch (error) {
    console.error('获取标签失败:', error);
    return NextResponse.json(
      { error: '获取标签失败' },
      { status: 500 }
    );
  }
}

// 更新标签
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
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
    
    // 检查标签是否存在
    const existingTag = await db.prepare('SELECT * FROM tags WHERE id = ?').get(params.id);
    if (!existingTag) {
      return NextResponse.json(
        { error: '标签不存在' },
        { status: 404 }
      );
    }

    // 更新标签
    await db.prepare(`
      UPDATE tags 
      SET name = ?, description = ?, color = ?
      WHERE id = ?
    `).run(
      name,
      description || null,
      color || '#10B981',
      params.id
    );

    // 获取更新后的标签
    const updatedTag = await db.prepare('SELECT * FROM tags WHERE id = ?').get(params.id);

    return NextResponse.json(updatedTag);
  } catch (error) {
    console.error('更新标签失败:', error);
    return NextResponse.json(
      { error: '更新标签失败' },
      { status: 500 }
    );
  }
}

// 删除标签
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const db = await getDbConnection();
    
    // 检查标签是否存在
    const existingTag = await db.prepare('SELECT * FROM tags WHERE id = ?').get(params.id);
    if (!existingTag) {
      return NextResponse.json(
        { error: '标签不存在' },
        { status: 404 }
      );
    }

    // 检查是否有提示词使用此标签
    const promptsUsingTag = await db.prepare('SELECT COUNT(*) as count FROM prompt_tags WHERE tag_id = ?').get(params.id) as { count: number };
    if (promptsUsingTag.count > 0) {
      return NextResponse.json(
        { error: '该标签还在使用中，无法删除' },
        { status: 400 }
      );
    }

    // 删除标签
    await db.prepare('DELETE FROM tags WHERE id = ?').run(params.id);

    return NextResponse.json({ message: '标签删除成功' });
  } catch (error) {
    console.error('删除标签失败:', error);
    return NextResponse.json(
      { error: '删除标签失败' },
      { status: 500 }
    );
  }
} 