import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db/sqlite';
import { PromptVersion } from '@/types';

// GET /api/prompts/[id]/versions/[versionId] - 获取特定版本详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const { id, versionId } = await params;
    const db = await getDbConnection();

    const version = db.prepare(`
      SELECT 
        id,
        prompt_id,
        version_number,
        user_version,
        title,
        content,
        change_description,
        created_at
      FROM prompt_versions 
      WHERE id = ? AND prompt_id = ?
    `).get(versionId, id) as (PromptVersion & { user_version?: string }) | undefined;

    if (!version) {
      return NextResponse.json(
        { error: '版本不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json(version);
  } catch (error) {
    console.error('获取版本详情失败:', error);
    return NextResponse.json(
      { error: '获取版本详情失败' },
      { status: 500 }
    );
  }
}

// DELETE /api/prompts/[id]/versions/[versionId] - 删除特定版本
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const { id, versionId } = await params;
    const db = await getDbConnection();

    // 检查版本是否存在
    const version = db.prepare(`
      SELECT id FROM prompt_versions 
      WHERE id = ? AND prompt_id = ?
    `).get(versionId, id);

    if (!version) {
      return NextResponse.json(
        { error: '版本不存在' },
        { status: 404 }
      );
    }

    // 检查是否是最后一个版本（不允许删除最后一个版本）
    const versionCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM prompt_versions
      WHERE prompt_id = ?
    `).get(id) as { count: number };

    if (versionCount.count <= 1) {
      return NextResponse.json(
        { error: '不能删除最后一个版本' },
        { status: 400 }
      );
    }

    // 删除版本
    db.prepare(`
      DELETE FROM prompt_versions 
      WHERE id = ? AND prompt_id = ?
    `).run(versionId, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除版本失败:', error);
    return NextResponse.json(
      { error: '删除版本失败' },
      { status: 500 }
    );
  }
}

// POST /api/prompts/[id]/versions/batch-delete - 批量删除版本
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
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