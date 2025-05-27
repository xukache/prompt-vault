import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db/sqlite';

// POST /api/prompts/[id]/versions/batch-delete - 批量删除版本
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { versionIds } = body;

    if (!versionIds || !Array.isArray(versionIds) || versionIds.length === 0) {
      return NextResponse.json(
        { error: '请选择要删除的版本' },
        { status: 400 }
      );
    }

    const db = await getDbConnection();

    // 检查版本总数
    const versionCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM prompt_versions
      WHERE prompt_id = ?
    `).get(id) as { count: number };

    if (versionCount.count <= versionIds.length) {
      return NextResponse.json(
        { error: '不能删除所有版本，至少需要保留一个版本' },
        { status: 400 }
      );
    }

    // 批量删除版本
    const placeholders = versionIds.map(() => '?').join(',');
    const deleteResult = db.prepare(`
      DELETE FROM prompt_versions 
      WHERE prompt_id = ? AND id IN (${placeholders})
    `).run(id, ...versionIds);

    return NextResponse.json({ 
      success: true, 
      deletedCount: deleteResult.changes,
      message: `已删除 ${deleteResult.changes} 个版本`
    });
  } catch (error) {
    console.error('批量删除版本失败:', error);
    return NextResponse.json(
      { error: '批量删除版本失败' },
      { status: 500 }
    );
  }
} 