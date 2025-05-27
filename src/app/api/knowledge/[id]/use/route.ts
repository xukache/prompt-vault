import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db/sqlite';

// POST - 记录知识库条目的使用
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { promptId } = body; // 可选：记录在哪个提示词中使用

    const db = await getDbConnection();

    // 检查知识库条目是否存在
    const knowledgeItem = db.prepare(
      'SELECT id FROM knowledge_base WHERE id = ?'
    ).get(id);

    if (!knowledgeItem) {
      return NextResponse.json(
        { error: '知识库条目未找到' },
        { status: 404 }
      );
    }

    // 增加使用计数
    db.prepare(
      'UPDATE knowledge_base SET usage_count = usage_count + 1 WHERE id = ?'
    ).run(id);

    // 如果提供了提示词ID，记录引用关系
    if (promptId) {
      const referenceId = `ref-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      db.prepare(`
        INSERT OR IGNORE INTO knowledge_base_references (id, knowledge_id, prompt_id)
        VALUES (?, ?, ?)
      `).run(referenceId, id, promptId);
    }

    return NextResponse.json({ 
      message: '使用记录成功',
      knowledgeId: id,
      promptId: promptId || null
    });
  } catch (error) {
    console.error('记录知识库使用失败:', error);
    return NextResponse.json(
      { error: '记录使用失败' },
      { status: 500 }
    );
  }
} 