import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db/sqlite';
import { KnowledgeBase } from '@/types';

// GET - 获取单个知识库条目
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDbConnection();

    const knowledgeItem = db.prepare(
      'SELECT * FROM knowledge_base WHERE id = ?'
    ).get(id) as KnowledgeBase;

    if (!knowledgeItem) {
      return NextResponse.json(
        { error: '知识库条目未找到' },
        { status: 404 }
      );
    }

    return NextResponse.json(knowledgeItem);
  } catch (error) {
    console.error('获取知识库条目失败:', error);
    return NextResponse.json(
      { error: '获取知识库条目失败' },
      { status: 500 }
    );
  }
}

// PUT - 更新知识库条目
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, content, type, description, tags } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: '标题和内容为必填项' },
        { status: 400 }
      );
    }

    const db = await getDbConnection();

    // 检查条目是否存在
    const existingItem = db.prepare(
      'SELECT id FROM knowledge_base WHERE id = ?'
    ).get(id);

    if (!existingItem) {
      return NextResponse.json(
        { error: '知识库条目未找到' },
        { status: 404 }
      );
    }

    // 更新条目
    const updateQuery = `
      UPDATE knowledge_base 
      SET title = ?, content = ?, type = ?, description = ?, tags = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    db.prepare(updateQuery).run(
      title,
      content,
      type || 'domain',
      description || null,
      tags || null,
      id
    );

    // 获取更新后的条目
    const updatedItem = db.prepare(
      'SELECT * FROM knowledge_base WHERE id = ?'
    ).get(id) as KnowledgeBase;

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('更新知识库条目失败:', error);
    return NextResponse.json(
      { error: '更新知识库条目失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除知识库条目
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDbConnection();

    // 检查条目是否存在
    const existingItem = db.prepare(
      'SELECT id FROM knowledge_base WHERE id = ?'
    ).get(id);

    if (!existingItem) {
      return NextResponse.json(
        { error: '知识库条目未找到' },
        { status: 404 }
      );
    }

    // 删除条目（关联的引用会通过外键约束自动删除）
    db.prepare('DELETE FROM knowledge_base WHERE id = ?').run(id);

    return NextResponse.json({ message: '知识库条目删除成功' });
  } catch (error) {
    console.error('删除知识库条目失败:', error);
    return NextResponse.json(
      { error: '删除知识库条目失败' },
      { status: 500 }
    );
  }
} 