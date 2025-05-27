import { NextRequest, NextResponse } from "next/server";
import { getDbConnection } from "@/lib/db/sqlite";

// 获取单个分类
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const db = await getDbConnection();
    
    const category = await db.prepare('SELECT * FROM categories WHERE id = ?').get(params.id);
    
    if (!category) {
      return NextResponse.json(
        { error: '分类不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(category);
  } catch (error) {
    console.error('获取分类失败:', error);
    return NextResponse.json(
      { error: '获取分类失败' },
      { status: 500 }
    );
  }
}

// 更新分类
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
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
    
    // 检查分类是否存在
    const existingCategory = await db.prepare('SELECT * FROM categories WHERE id = ?').get(params.id);
    if (!existingCategory) {
      return NextResponse.json(
        { error: '分类不存在' },
        { status: 404 }
      );
    }

    // 更新分类
    await db.prepare(`
      UPDATE categories 
      SET name = ?, description = ?, parent_id = ?, color = ?, icon = ?, order_index = ?
      WHERE id = ?
    `).run(
      name,
      description || null,
      parent_id || null,
      color || '#3B82F6',
      icon || 'folder',
      order_index || 0,
      params.id
    );

    // 获取更新后的分类
    const updatedCategory = await db.prepare('SELECT * FROM categories WHERE id = ?').get(params.id);

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error('更新分类失败:', error);
    return NextResponse.json(
      { error: '更新分类失败' },
      { status: 500 }
    );
  }
}

// 删除分类
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const db = await getDbConnection();
    
    // 检查分类是否存在
    const existingCategory = await db.prepare('SELECT * FROM categories WHERE id = ?').get(params.id);
    if (!existingCategory) {
      return NextResponse.json(
        { error: '分类不存在' },
        { status: 404 }
      );
    }

    // 检查是否有子分类
    const childCategories = await db.prepare('SELECT COUNT(*) as count FROM categories WHERE parent_id = ?').get(params.id) as { count: number };
    if (childCategories.count > 0) {
      return NextResponse.json(
        { error: '该分类下还有子分类，无法删除' },
        { status: 400 }
      );
    }

    // 检查是否有提示词使用此分类
    const promptsUsingCategory = await db.prepare('SELECT COUNT(*) as count FROM prompts WHERE category_id = ?').get(params.id) as { count: number };
    if (promptsUsingCategory.count > 0) {
      return NextResponse.json(
        { error: '该分类下还有提示词，无法删除' },
        { status: 400 }
      );
    }

    // 删除分类
    await db.prepare('DELETE FROM categories WHERE id = ?').run(params.id);

    return NextResponse.json({ message: '分类删除成功' });
  } catch (error) {
    console.error('删除分类失败:', error);
    return NextResponse.json(
      { error: '删除分类失败' },
      { status: 500 }
    );
  }
} 